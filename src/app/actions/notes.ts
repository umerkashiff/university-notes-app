'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/app/actions/auth'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

export async function createNote(data: {
  title: string
  subjectCode: string
  subjectName?: string
  semester?: number
  description?: string
  fileUrl: string
  pages: number
  size: string
}) {
  const user = await getCurrentUser()
  if (!user || user.status !== 'ACTIVE' || (user.role !== 'SENIOR' && user.role !== 'ADMIN')) {
    return { error: 'Unauthorized. Only active note contributors and administrators can upload notes.' }
  }

  // Strict file URL validation: Must point to our trusted Cloudflare R2 bucket and be a PDF
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-4c28b39a02ca4952a6c31f0baf9d62e3.r2.dev'
  const isAllowedOrigin = data.fileUrl.startsWith(publicBase) || data.fileUrl.startsWith('https://pub-4c28b39a02ca4952a6c31f0baf9d62e3.r2.dev')
  const isPdf = data.fileUrl.toLowerCase().endsWith('.pdf')
  if (!isAllowedOrigin || !isPdf) {
    return { error: 'Invalid document URL. Only verified PDF uploads from secure storage are accepted.' }
  }

  const cleanTitle = data.title?.trim().slice(0, 150)
  if (!cleanTitle) return { error: 'Note title is required.' }
  const cleanDesc = data.description?.trim().slice(0, 2000) || null

  let subject = await prisma.subject.findUnique({ where: { code: data.subjectCode } })
  if (!subject && data.subjectName) {
    try {
      subject = await prisma.subject.create({
        data: {
          name: data.subjectName,
          code: data.subjectCode,
          semester: data.semester || 1,
        }
      })
    } catch (e) {
      // If concurrent insert
      subject = await prisma.subject.findUnique({ where: { code: data.subjectCode } })
    }
  }

  if (!subject) return { error: 'Subject not found.' }

  if (user.role === 'SENIOR' && user.semester && subject.semester > user.semester) {
    return { error: `Unauthorized. As a Semester ${user.semester} contributor, you can only upload notes for courses in Semester 1 to ${user.semester}.` }
  }

  try {
    const note = await prisma.note.create({
      data: {
        title: cleanTitle,
        description: cleanDesc,
        fileUrl: data.fileUrl,
        pages: Math.max(1, Math.min(data.pages || 1, 2000)),
        size: data.size || '0 MB',
        authorId: user.id,
        subjectId: subject.id,
        status: 'PENDING',
      },
      include: {
        subject: true,
        author: true
      }
    })

    // Email alert to active administrators
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', status: 'ACTIVE' },
        select: { email: true }
      })
      if (admins.length > 0) {
        const { noteSubmittedAlertEmail } = await import('@/lib/emails/templates')
        const { sendEmail } = await import('@/lib/emails/send')
        const { subject: emailSubj, html } = noteSubmittedAlertEmail({
          contributorName: user.name || 'Note Contributor',
          noteTitle: data.title,
          subjectCode: subject.code,
          pages: data.pages,
          fileSize: data.size
        })
        sendEmail(admins.map(a => a.email), emailSubj, html).catch(() => {})
      }
    } catch (e) {
      console.warn('Failed to send admin email alert for new note submission:', e)
    }

    return { success: true, note }
  } catch (err) {
    // Cleanup orphaned file on DB failure
    try {
      const filePath = data.fileUrl.split('/').pop()
      if (filePath) {
        const s3Client = new S3Client({
          region: 'auto',
          endpoint: process.env.R2_ENDPOINT!,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
        })
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: filePath
        }))
      }
    } catch (cleanupErr) {
      console.error('Failed to cleanup orphaned file from R2:', cleanupErr)
    }
    return { error: 'Failed to create note in database. Please try again.' }
  }
}

export async function publishNote(noteId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Unauthorized.' }
  }

  try {
    const existing = await prisma.note.findUnique({ 
      where: { id: noteId }, 
      include: { subject: true, author: true } 
    })
    if (!existing) return { error: 'Note not found.' }
    if (existing.status === 'PUBLISHED') return { error: 'Note is already published.' }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: { status: 'PUBLISHED' },
      include: { subject: true, author: true }
    })

    // Create an announcement automatically
    await prisma.announcement.create({
      data: {
        title: `${note.subject.name} notes published`,
        body: `${note.title} is now available.`,
        audience: `SEM_${note.subject.semester}`
      }
    })

    // Notify the contributor author via email
    if (existing.author?.email) {
      try {
        const { notePublishedEmail } = await import('@/lib/emails/templates')
        const { sendEmail } = await import('@/lib/emails/send')
        const { subject: emailSubj, html } = notePublishedEmail({
          authorName: existing.author.name,
          noteTitle: note.title,
          subjectName: note.subject.name,
          subjectCode: note.subject.code
        })
        sendEmail(existing.author.email, emailSubj, html).catch(() => {})
      } catch (e) {
        console.warn('Failed to send note published email to author:', e)
      }
    }

    return { success: true }
  } catch (err) {
    return { error: 'Failed to publish note. Please try again.' }
  }
}

export async function updateNote(data: {
  id: string
  title?: string
  subjectCode?: string
  semester?: number
  description?: string
  status?: string
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Unauthorized. Only admins can edit note metadata.' }
  }

  try {
    const existing = await prisma.note.findUnique({ 
      where: { id: data.id }, 
      include: { subject: true, author: true } 
    })
    if (!existing) return { error: 'Note not found.' }

    let subjectId = existing.subjectId
    if (data.subjectCode && data.subjectCode !== existing.subject.code) {
      const targetSub = await prisma.subject.findUnique({ where: { code: data.subjectCode } })
      if (!targetSub) {
        return { error: `Course ${data.subjectCode} does not exist. Please add it in the Curriculum tab first.` }
      }
      subjectId = targetSub.id
    }

    const updated = await prisma.note.update({
      where: { id: data.id },
      data: {
        title: data.title !== undefined ? data.title : existing.title,
        description: data.description !== undefined ? data.description : existing.description,
        subjectId,
        status: data.status !== undefined ? data.status : existing.status
      },
      include: {
        subject: true,
        author: true
      }
    })

    // If newly published, announce and email author
    if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      await prisma.announcement.create({
        data: {
          title: `${updated.subject.name} notes published`,
          body: `${updated.title} is now available.`,
          audience: `SEM_${updated.subject.semester}`
        }
      })

      if (existing.author?.email) {
        try {
          const { notePublishedEmail } = await import('@/lib/emails/templates')
          const { sendEmail } = await import('@/lib/emails/send')
          const { subject: emailSubj, html } = notePublishedEmail({
            authorName: existing.author.name,
            noteTitle: updated.title,
            subjectName: updated.subject.name,
            subjectCode: updated.subject.code
          })
          sendEmail(existing.author.email, emailSubj, html).catch(() => {})
        } catch (e) {
          console.warn('Failed to send note published email to author:', e)
        }
      }
    }

    return { success: true, note: updated }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function createSubject(data: {
  name: string
  code: string
  semester: number
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Unauthorized. Only admins can manage subjects.' }
  }

  try {
    const existing = await prisma.subject.findUnique({ where: { code: data.code } })
    if (existing) {
      const updated = await prisma.subject.update({
        where: { code: data.code },
        data: { name: data.name, semester: data.semester }
      })
      return { success: true, subject: updated }
    }

    const subject = await prisma.subject.create({
      data: {
        name: data.name,
        code: data.code,
        semester: data.semester
      }
    })

    return { success: true, subject }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function deleteNote(noteId: string, rejectionReason?: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Unauthorized. Only admins can delete notes.' }
  }

  try {
    const note = await prisma.note.findUnique({ 
      where: { id: noteId },
      include: { author: true, subject: true }
    })
    if (!note) return { error: 'Note not found.' }

    // If note was in PENDING review queue and rejected, send polite rejection email to contributor
    if (note.status === 'PENDING' && note.author?.email) {
      try {
        const { noteRejectedEmail } = await import('@/lib/emails/templates')
        const { sendEmail } = await import('@/lib/emails/send')
        const { subject: emailSubj, html } = noteRejectedEmail({
          authorName: note.author.name,
          noteTitle: note.title,
          subjectCode: note.subject?.code,
          reason: rejectionReason
        })
        sendEmail(note.author.email, emailSubj, html).catch(() => {})
      } catch (e) {
        console.warn('Failed to send note rejection email to author:', e)
      }
    }

    // Cleanup R2 storage if fileUrl exists
    if (note.fileUrl) {
      try {
        const filePath = note.fileUrl.split('/').pop()
        if (filePath && process.env.R2_ENDPOINT) {
          const s3Client = new S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
              accessKeyId: process.env.R2_ACCESS_KEY_ID!,
              secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            },
          })
          await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: filePath
          }))
        }
      } catch (r2Err) {
        console.warn('Failed to delete note file from R2:', r2Err)
      }
    }

    // Delete associated bookmarks
    await prisma.bookmark.deleteMany({ where: { noteId } })

    // Delete the note
    await prisma.note.delete({ where: { id: noteId } })

    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function deleteSubject(subjectIdentifier: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Unauthorized. Only admins can manage subjects.' }
  }

  try {
    const subject = await prisma.subject.findFirst({
      where: {
        OR: [
          { id: subjectIdentifier },
          { code: subjectIdentifier }
        ]
      }
    })

    if (!subject) {
      return { error: 'Subject not found.' }
    }

    const notes = await prisma.note.findMany({ where: { subjectId: subject.id } })
    
    // Clean up all notes, their bookmarks, and their R2 files
    for (const note of notes) {
      if (note.fileUrl) {
        try {
          const filePath = note.fileUrl.split('/').pop()
          if (filePath && process.env.R2_ENDPOINT) {
            const s3Client = new S3Client({
              region: 'auto',
              endpoint: process.env.R2_ENDPOINT,
              credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID!,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
              },
            })
            await s3Client.send(new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME!,
              Key: filePath
            }))
          }
        } catch (r2Err) {
          console.warn('Failed to delete subject note file from R2:', r2Err)
        }
      }
      await prisma.bookmark.deleteMany({ where: { noteId: note.id } })
    }

    if (notes.length > 0) {
      await prisma.note.deleteMany({ where: { subjectId: subject.id } })
    }

    await prisma.subject.delete({ where: { id: subject.id } })
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function getTotalStorage() {
  const notes = await prisma.note.findMany({ select: { size: true } });
  let totalBytes = 0;
  notes.forEach(n => {
    const match = n.size.match(/([\d.]+)\s*(MB|KB|GB)/i);
    if (match) {
      const val = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      if (unit === 'MB') totalBytes += val * 1024 * 1024;
      else if (unit === 'KB') totalBytes += val * 1024;
      else if (unit === 'GB') totalBytes += val * 1024 * 1024 * 1024;
    }
  });
  return { success: true, totalBytes };
}

export async function createAnnouncement(data: {
  title: string
  body: string
  audience?: string
  imageUrl?: string
  sendEmailNotification?: boolean
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Unauthorized. Only admins can publish announcements.' }
  }

  try {
    let cleanImageUrl = data.imageUrl || null
    if (cleanImageUrl && (cleanImageUrl.includes('cloudflarestorage.com') || cleanImageUrl.includes('uet-notes-bucket'))) {
      const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-4c28b39a02ca4952a6c31f0baf9d62e3.r2.dev'
      const key = cleanImageUrl.split('/announcements/')[1]
      if (key) {
        cleanImageUrl = `${publicBase}/announcements/${key}`
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        body: data.body,
        imageUrl: cleanImageUrl,
        audience: data.audience || 'ALL',
      }
    })

    // Broadcast email to targeted active students if email option is enabled
    if (data.sendEmailNotification !== false) {
      try {
        const whereClause: any = { status: 'ACTIVE' }
        if (data.audience && data.audience !== 'ALL' && data.audience !== 'All students' && data.audience !== 'Department') {
          const semMatch = data.audience.match(/Semester\s*(\d)/i) || data.audience.match(/SEM_(\d)/i)
          if (semMatch) {
            whereClause.semester = parseInt(semMatch[1], 10)
          }
        }

        const targetedUsers = await prisma.user.findMany({
          where: whereClause,
          select: { email: true }
        })

        if (targetedUsers.length > 0) {
          const { departmentAnnouncementEmail } = await import('@/lib/emails/templates')
          const { sendEmail } = await import('@/lib/emails/send')
          const { subject: emailSubj, html } = departmentAnnouncementEmail({
            title: data.title,
            body: data.body,
            audienceLabel: data.audience || 'All Students',
            hasImage: !!cleanImageUrl
          })
          await sendEmail(targetedUsers.map(u => u.email), emailSubj, html)
        }
      } catch (broadcastErr) {
        console.warn('Failed to broadcast announcement email:', broadcastErr)
      }
    }

    return { success: true, announcement }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function deleteAnnouncement(announcementId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Unauthorized. Only admins can delete announcements.' }
  }

  try {
    const existing = await prisma.announcement.findUnique({ where: { id: announcementId } })
    if (!existing) return { error: 'Announcement not found.' }

    // Clean up image from R2 if present
    if (existing.imageUrl) {
      try {
        const filePath = existing.imageUrl.split('/announcements/').pop()
        if (filePath && process.env.R2_ENDPOINT) {
          const s3Client = new S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
              accessKeyId: process.env.R2_ACCESS_KEY_ID!,
              secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            },
          })
          await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: `announcements/${filePath}`
          }))
        }
      } catch (r2Err) {
        console.warn('Failed to delete announcement image from R2:', r2Err)
      }
    }

    await prisma.announcement.delete({ where: { id: announcementId } })
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function broadcastAnnouncementEmail(announcementId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Unauthorized. Only admins can broadcast announcement emails.' }
  }

  try {
    const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } })
    if (!announcement) return { error: 'Announcement not found.' }

    const whereClause: any = { status: 'ACTIVE' }
    if (announcement.audience && announcement.audience !== 'ALL' && announcement.audience !== 'All students' && announcement.audience !== 'Department') {
      const semMatch = announcement.audience.match(/Semester\s*(\d)/i) || announcement.audience.match(/SEM_(\d)/i)
      if (semMatch) {
        whereClause.semester = parseInt(semMatch[1], 10)
      }
    }

    const targetedUsers = await prisma.user.findMany({
      where: whereClause,
      select: { email: true }
    })

    if (targetedUsers.length === 0) {
      return { error: 'No active student accounts found for this target audience.' }
    }

    const { departmentAnnouncementEmail } = await import('@/lib/emails/templates')
    const { sendEmail } = await import('@/lib/emails/send')
    const { subject: emailSubj, html } = departmentAnnouncementEmail({
      title: announcement.title,
      body: announcement.body,
      audienceLabel: announcement.audience || 'All Students',
      hasImage: !!announcement.imageUrl
    })

    const emailRes = await sendEmail(targetedUsers.map(u => u.email), emailSubj, html)
    if (emailRes.error) {
      return { error: `Failed to dispatch emails: ${emailRes.error}` }
    }

    return { success: true, count: targetedUsers.length }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function toggleBookmark(noteId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in to save notes.' }

  try {
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_noteId: {
          userId: user.id,
          noteId: noteId
        }
      }
    })

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id }
      })
      return { success: true, isBookmarked: false }
    } else {
      await prisma.bookmark.create({
        data: {
          userId: user.id,
          noteId: noteId
        }
      })
      return { success: true, isBookmarked: true }
    }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function submitContentRequest(data: {
  type: string
  semester?: number
  subject?: string
  message: string
}) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in to submit a request.' }

  try {
    await prisma.contentRequest.create({
      data: {
        type: data.type,
        semester: data.semester,
        subject: data.subject,
        message: data.message,
        userId: user.id,
        status: 'PENDING'
      }
    })

    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

