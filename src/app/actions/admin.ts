'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Administrator privileges required.')
  }
  return user
}

export async function getAdminUsersData() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { pendingUsers: [], activeUsers: [], error: 'Unauthorized: Administrator privileges required.' }
  }

  const [pendingUsers, activeUsers] = await Promise.all([
    prisma.user.findMany({
      where: { status: 'PENDING' },
      include: { contributorRequest: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.findMany({
      where: { status: { in: ['ACTIVE', 'GRADUATED', 'REJECTED'] } },
      include: { contributorRequest: true },
      orderBy: { createdAt: 'desc' }
    })
  ])

  return { pendingUsers, activeUsers }
}

export async function approveUser(
  userId: string, 
  role: 'STUDENT' | 'SENIOR' | 'ADMIN' = 'STUDENT', 
  semesterOverride?: number
) {
  await requireAdmin()

  const dataToUpdate: any = {
    status: 'ACTIVE',
    role: role
  }

  if (semesterOverride && semesterOverride >= 1 && semesterOverride <= 8) {
    dataToUpdate.semester = semesterOverride
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate
  })

  // Update contributor request if exists
  await prisma.contributorRequest.updateMany({
    where: { userId: userId },
    data: { status: role === 'SENIOR' ? 'APPROVED' : 'REJECTED' }
  })

  // Dispatch Welcome / Approved Email
  try {
    const { accountApprovedEmail } = await import('@/lib/emails/templates')
    const { sendEmail } = await import('@/lib/emails/send')
    const { subject, html } = accountApprovedEmail({
      name: updatedUser.name,
      role: updatedUser.role,
      semester: updatedUser.semester
    })
    await sendEmail(updatedUser.email, subject, html)
  } catch (e) {
    console.warn('Failed to send account approval email:', e)
  }

  return { success: true, user: updatedUser }
}

export async function rejectUser(userId: string, reason?: string) {
  await requireAdmin()

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason || 'Application did not match department student records.'
    }
  })

  await prisma.contributorRequest.updateMany({
    where: { userId: userId },
    data: { status: 'REJECTED' }
  })

  // Dispatch Rejection Email
  try {
    const { accountRejectedEmail } = await import('@/lib/emails/templates')
    const { sendEmail } = await import('@/lib/emails/send')
    const { subject, html } = accountRejectedEmail({
      name: updatedUser.name,
      reason: updatedUser.rejectionReason
    })
    await sendEmail(updatedUser.email, subject, html)
  } catch (e) {
    console.warn('Failed to send account rejection email:', e)
  }

  return { success: true, user: updatedUser }
}

export async function updateUserSemester(userId: string, newSemester: number) {
  await requireAdmin()
  if (newSemester < 1 || newSemester > 8) throw new Error('Invalid semester number')

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { semester: newSemester }
  })

  return { success: true, user: updatedUser }
}

export async function toggleHeldBack(userId: string) {
  await requireAdmin()

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { heldBack: !user.heldBack }
  })

  return { success: true, user: updatedUser }
}

export async function changeUserRole(userId: string, role: 'STUDENT' | 'SENIOR' | 'ADMIN') {
  await requireAdmin()

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role }
  })

  // If promoted to Senior/Contributor, notify via email
  if (role === 'SENIOR') {
    try {
      const { rolePromotedEmail } = await import('@/lib/emails/templates')
      const { sendEmail } = await import('@/lib/emails/send')
      const { subject, html } = rolePromotedEmail({
        name: updatedUser.name,
        newRole: 'Note Contributor'
      })
      await sendEmail(updatedUser.email, subject, html)
    } catch (e) {
      console.warn('Failed to send promotion email:', e)
    }
  }

  return { success: true, user: updatedUser }
}

export async function submitHeldBackSelfReport(notes?: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Authentication required')

  await prisma.contentRequest.create({
    data: {
      type: 'Academic Progression & Re-take Report',
      message: `Student submitted repeat coursework report: "${notes || 'Repeating coursework / pause progression'}"`,
      semester: user.semester,
      userId: user.id,
      status: 'PENDING'
    }
  })

  return { success: true }
}

export async function getContentRequests(statusFilter?: string) {
  await requireAdmin()

  const where: any = {}
  if (statusFilter && statusFilter !== 'ALL') {
    where.status = statusFilter
  }

  const requests = await prisma.contentRequest.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          regNumber: true,
          semester: true,
          section: true,
          batchYear: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return { success: true, requests }
}

export async function updateContentRequestStatus(id: string, status: 'PENDING' | 'RESOLVED' | 'DISMISSED', adminNotes?: string) {
  await requireAdmin()

  const updated = await prisma.contentRequest.update({
    where: { id },
    data: {
      status,
      adminNotes: adminNotes ?? undefined
    }
  })

  return { success: true, request: updated }
}

export async function deleteContentRequest(id: string) {
  await requireAdmin()

  await prisma.contentRequest.delete({
    where: { id }
  })

  return { success: true }
}
