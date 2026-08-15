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
  if (!user || user.role !== 'SENIOR') {
    return { error: 'Unauthorized. Only seniors can upload notes.' }
  }

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
    return { error: `Unauthorized. As a Semester ${user.semester} senior, you can only upload notes for courses in Semester 1 to ${user.semester}.` }
  }

  try {
    const note = await prisma.note.create({
      data: {
        title: data.title,
        description: data.description || null,
        fileUrl: data.fileUrl,
        pages: data.pages,
        size: data.size,
        authorId: user.id,
        subjectId: subject.id,
        status: 'PENDING',
      },
      include: {
        subject: true,
        author: true
      }
    })

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
    const existing = await prisma.note.findUnique({ where: { id: noteId }, include: { subject: true } })
    if (!existing) return { error: 'Note not found.' }
    if (existing.status === 'PUBLISHED') return { error: 'Note is already published.' }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: { status: 'PUBLISHED' },
      include: { subject: true }
    })

    // Create an announcement automatically
    await prisma.announcement.create({
      data: {
        title: `${note.subject.name} notes published`,
        body: `${note.title} is now available.`,
        audience: 'ALL'
      }
    })

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

    // If approved and newly published, announce it under the senior's notes
    if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      await prisma.announcement.create({
        data: {
          title: `${updated.subject.name} notes published`,
          body: `${updated.title} is now available.`,
          audience: updated.subject.name || 'ALL'
        }
      })
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

export async function deleteNote(noteId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Unauthorized. Only admins can delete notes.' }
  }

  try {
    const note = await prisma.note.findUnique({ where: { id: noteId } })
    if (!note) return { error: 'Note not found.' }

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

export async function deleteSubject(subjectId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Unauthorized. Only admins can manage subjects.' }
  }

  try {
    const notes = await prisma.note.findMany({ where: { subjectId } })
    
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
      await prisma.note.deleteMany({ where: { subjectId } })
    }

    await prisma.subject.delete({ where: { id: subjectId } })
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
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Unauthorized. Only admins can publish announcements.' }
  }

  try {
    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        body: data.body,
        audience: data.audience || 'ALL',
      }
    })
    return { success: true, announcement }
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

