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

import { SignupAcademicContext } from '@/lib/academic'

export async function getSignupAcademicContext(): Promise<SignupAcademicContext> {
  try {
    const activePeriod = await prisma.academicPeriod.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        batchMaps: {
          orderBy: { batchYear: 'desc' }
        }
      }
    })

    if (activePeriod && activePeriod.batchMaps.length > 0) {
      return {
        activePeriodName: activePeriod.name,
        batchMaps: activePeriod.batchMaps.map(b => ({
          batchYear: b.batchYear,
          semester: b.semester
        }))
      }
    }
  } catch (e) {
    console.error('Error fetching active academic period for signup:', e)
  }

  return {
    activePeriodName: undefined,
    batchMaps: [
      { batchYear: 2026, semester: 1 },
      { batchYear: 2025, semester: 2 },
      { batchYear: 2024, semester: 4 },
      { batchYear: 2023, semester: 6 },
      { batchYear: 2022, semester: 8 },
      { batchYear: 2021, semester: 8 },
      { batchYear: 2020, semester: 8 },
      { batchYear: 2019, semester: 8 },
      { batchYear: 2018, semester: 8 }
    ]
  }
}

export async function getAcademicPeriods() {
  const periods = await prisma.academicPeriod.findMany({
    include: {
      batchMaps: {
        orderBy: { batchYear: 'desc' }
      }
    },
    orderBy: { startDate: 'desc' }
  })

  const activePeriod = periods.find(p => p.status === 'ACTIVE')
  const summerBreakPeriod = periods.find(p => p.status === 'SUMMER_BREAK')

  return { periods, activePeriod, summerBreakPeriod }
}

export async function createAcademicPeriod(data: {
  name: string
  startDate: string
  endDate: string
  status?: string
  batchMappings: { batchYear: number; semester: number }[]
}) {
  await requireAdmin()

  const { name, startDate, endDate, status = 'ACTIVE', batchMappings } = data

  if (!name || !startDate || !endDate) {
    throw new Error('Name, Start Date, and End Date are required.')
  }

  // If new period is ACTIVE, mark any currently active period as SUMMER_BREAK or ENDED
  if (status === 'ACTIVE') {
    await prisma.academicPeriod.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'ENDED' }
    })
  }

  const period = await prisma.academicPeriod.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      batchMaps: {
        create: batchMappings.map(bm => ({
          batchYear: bm.batchYear,
          semester: bm.semester
        }))
      }
    },
    include: {
      batchMaps: true
    }
  })

  // Sync users' semesters to the new period's batch mappings if ACTIVE
  if (status === 'ACTIVE') {
    for (const bm of batchMappings) {
      await prisma.user.updateMany({
        where: {
          batchYear: bm.batchYear,
          status: 'ACTIVE',
          heldBack: false
        },
        data: {
          semester: bm.semester
        }
      })
    }
  }

  // Create announcement
  await prisma.announcement.create({
    data: {
      title: `Academic Term: ${name}`,
      body: `The ${name} academic period is now officially active from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
      audience: 'ALL'
    }
  })

  return { success: true, period }
}

export async function getPreAdvancementSummary(periodId: string) {
  await requireAdmin()

  const period = await prisma.academicPeriod.findUnique({
    where: { id: periodId },
    include: { batchMaps: true }
  })

  if (!period) throw new Error('Academic period not found')

  const batchYears = period.batchMaps.map(b => b.batchYear)

  const students = await prisma.user.findMany({
    where: {
      batchYear: { in: batchYears },
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      email: true,
      regNumber: true,
      semester: true,
      batchYear: true,
      heldBack: true,
      role: true
    },
    orderBy: [
      { batchYear: 'desc' },
      { regNumber: 'asc' }
    ]
  })

  // Group by batch
  const batchGroups: Record<number, {
    batchYear: number
    targetSemester: number
    students: typeof students
  }> = {}

  period.batchMaps.forEach(bm => {
    const batchStudents = students.filter(s => s.batchYear === bm.batchYear)
    batchGroups[bm.batchYear] = {
      batchYear: bm.batchYear,
      targetSemester: bm.semester + 1,
      students: batchStudents
    }
  })

  const advancingCount = students.filter(s => !s.heldBack && s.semester < 8).length
  const graduatingCount = students.filter(s => !s.heldBack && s.semester >= 8).length
  const heldBackCount = students.filter(s => s.heldBack).length

  return {
    period,
    batchGroups,
    stats: {
      total: students.length,
      advancing: advancingCount,
      graduating: graduatingCount,
      heldBack: heldBackCount
    }
  }
}

export async function advanceSemestersForPeriod(
  periodId: string, 
  customHeldBackUserIds: string[] = []
) {
  await requireAdmin()

  const period = await prisma.academicPeriod.findUnique({
    where: { id: periodId },
    include: { batchMaps: true }
  })

  if (!period) throw new Error('Academic period not found')

  // 1. Update any custom hold back flags if selected in checklist
  if (customHeldBackUserIds.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: customHeldBackUserIds } },
      data: { heldBack: true }
    })
  }

  // 2. Process each batch
  for (const bm of period.batchMaps) {
    // A) Students in Sem 8 -> Graduate
    if (bm.semester >= 8) {
      const graduatingStudents = await prisma.user.findMany({
        where: {
          batchYear: bm.batchYear,
          status: 'ACTIVE',
          heldBack: false
        }
      })

      for (const grad of graduatingStudents) {
        await prisma.user.update({
          where: { id: grad.id },
          data: {
            status: 'GRADUATED',
            semester: 8 // keep at 8 for full library access
          }
        })
      }

      if (graduatingStudents.length > 0) {
        await prisma.announcement.create({
          data: {
            title: `🎓 Congratulations Batch ${bm.batchYear} Graduates!`,
            body: `You have successfully completed 8 semesters of Computer Engineering. Your full notes library access remains permanently unlocked. Best wishes on your professional journey!`,
            audience: 'ALL'
          }
        })

        // Email graduating students
        try {
          const { graduatedEmail } = await import('@/lib/emails/templates')
          const { sendEmail } = await import('@/lib/emails/send')
          for (const grad of graduatingStudents) {
            if (grad.email) {
              const { subject, html } = graduatedEmail({
                name: grad.name,
                batchYear: bm.batchYear
              })
              sendEmail(grad.email, subject, html).catch(() => {})
            }
          }
        } catch (e) {
          console.warn('Failed to send graduation emails:', e)
        }
      }
    } else {
      // B) Students in Sem 1–7 -> Advance to Next Semester
      const nextSem = bm.semester + 1

      const advancingStudents = await prisma.user.findMany({
        where: {
          batchYear: bm.batchYear,
          status: 'ACTIVE',
          heldBack: false
        }
      })

      await prisma.user.updateMany({
        where: {
          id: { in: advancingStudents.map(s => s.id) }
        },
        data: {
          semester: nextSem
        }
      })

      if (advancingStudents.length > 0) {
        await prisma.announcement.create({
          data: {
            title: `📚 Welcome to Semester ${nextSem}!`,
            body: `A new chapter begins for Batch ${bm.batchYear}. Your study companion library has been updated with Semester ${nextSem} courses and notes.`,
            audience: `SEM_${nextSem}`
          }
        })

        // Email advancing students
        try {
          const { semesterAdvancedEmail } = await import('@/lib/emails/templates')
          const { sendEmail } = await import('@/lib/emails/send')
          for (const st of advancingStudents) {
            if (st.email) {
              const { subject, html } = semesterAdvancedEmail({
                name: st.name,
                fromSem: bm.semester,
                toSem: nextSem,
                periodName: period.name
              })
              sendEmail(st.email, subject, html).catch(() => {})
            }
          }
        } catch (e) {
          console.warn('Failed to send semester advancement emails:', e)
        }
      }
    }
  }

  // 3. Mark period as ENDED
  const updatedPeriod = await prisma.academicPeriod.update({
    where: { id: periodId },
    data: { status: 'ENDED' }
  })

  return { success: true, period: updatedPeriod }
}

export async function setPeriodStatus(
  periodId: string, 
  status: 'UPCOMING' | 'ACTIVE' | 'SUMMER_BREAK' | 'ENDED'
) {
  await requireAdmin()

  if (status === 'ACTIVE') {
    await prisma.academicPeriod.updateMany({
      where: { status: 'ACTIVE', id: { not: periodId } },
      data: { status: 'ENDED' }
    })
  }

  const period = await prisma.academicPeriod.update({
    where: { id: periodId },
    data: { status }
  })

  return { success: true, period }
}
