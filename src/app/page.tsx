import { StudyCompanion } from '@/components/study-companion'
import { getCurrentUser } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function Page() {
  let user = null
  let notes: any[] = []
  let announcements: any[] = []
  let subjects: any[] = []

  try {
    user = await getCurrentUser()
  } catch (err) {
    console.error('Failed to get current user:', err)
  }

  try {
    notes = await prisma.note.findMany({ 
      include: { author: true, subject: true }, 
      orderBy: { createdAt: 'desc' } 
    })
  } catch (err) {
    console.warn('Prisma database unreachable, fallback will be used:', (err as Error).message)
  }

  try {
    announcements = await prisma.announcement.findMany({ 
      orderBy: { createdAt: 'desc' } 
    })
  } catch (err) {
    console.warn('Prisma database unreachable for announcements:', (err as Error).message)
  }

  try {
    subjects = await prisma.subject.findMany()
  } catch (err) {
    console.warn('Prisma database unreachable for subjects:', (err as Error).message)
  }

  return (
    <StudyCompanion 
      initialUser={user} 
      initialNotes={notes} 
      initialAnnouncements={announcements} 
      initialSubjects={subjects} 
    />
  )
}

