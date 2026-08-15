import { StudyCompanion } from '@/components/study-companion'
import { getCurrentUser } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function Page() {
  let user = null
  let notes: any[] = []
  let announcements: any[] = []
  let subjects: any[] = []
  let bookmarks: string[] = []

  try {
    user = await getCurrentUser()
    if (user) {
      const userBookmarks = await prisma.bookmark.findMany({
        where: { userId: user.id },
        select: { noteId: true }
      })
      bookmarks = userBookmarks.map(b => b.noteId)
    }
  } catch (err) {
    console.error('Failed to get current user/bookmarks:', err)
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
    if (user && user.role === 'ADMIN') {
      announcements = await prisma.announcement.findMany({ 
        orderBy: { createdAt: 'desc' } 
      })
    } else if (user) {
      const semTarget = `Semester ${user.semester}`
      const semTargetAlt = `SEM_${user.semester}`
      announcements = await prisma.announcement.findMany({ 
        where: {
          OR: [
            { audience: 'ALL' },
            { audience: 'All students' },
            { audience: 'Department' },
            { audience: semTarget },
            { audience: semTargetAlt },
          ]
        },
        orderBy: { createdAt: 'desc' } 
      })
    } else {
      announcements = await prisma.announcement.findMany({ 
        where: {
          OR: [
            { audience: 'ALL' },
            { audience: 'All students' },
            { audience: 'Department' },
          ]
        },
        orderBy: { createdAt: 'desc' } 
      })
    }
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
      initialBookmarks={bookmarks}
    />
  )
}

