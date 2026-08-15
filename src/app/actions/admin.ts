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

  // Create welcome announcement
  await prisma.announcement.create({
    data: {
      title: 'Account Activated',
      body: `Welcome ${updatedUser.name}! Your account has been approved as ${role === 'SENIOR' ? 'Note Contributor' : 'Student'} for Semester ${updatedUser.semester}.`,
      audience: `SEM_${updatedUser.semester}`
    }
  })

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

  return { success: true, user: updatedUser }
}

export async function submitHeldBackSelfReport(notes?: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Authentication required')

  await prisma.announcement.create({
    data: {
      title: 'Re-Take / Hold-Back Request',
      body: `Student ${user.name} (${user.regNumber || user.email}, Sem ${user.semester}) submitted a repeat semester report: "${notes || 'Repeating coursework'}"`,
      audience: 'ADMIN'
    }
  })

  return { success: true }
}
