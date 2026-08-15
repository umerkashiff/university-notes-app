import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    
    // Find active periods whose endDate has passed
    const expiredActivePeriods = await prisma.academicPeriod.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: now
        }
      }
    })

    if (expiredActivePeriods.length === 0) {
      return NextResponse.json({ message: 'No expired academic periods found.' })
    }

    for (const period of expiredActivePeriods) {
      // Check if reminder already created today
      const existingReminder = await prisma.announcement.findFirst({
        where: {
          title: `Semester End: ${period.name}`,
          audience: 'ADMIN'
        }
      })

      if (!existingReminder) {
        await prisma.announcement.create({
          data: {
            title: `Semester End: ${period.name}`,
            body: `The ${period.name} academic term ended on ${period.endDate.toLocaleDateString()}. Please open the Calendar tab in Content Studio to review the student checklist and advance semesters.`,
            audience: 'ADMIN'
          }
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      notifiedPeriods: expiredActivePeriods.map(p => p.name) 
    })
  } catch (err: any) {
    console.error('Cron reminder error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
