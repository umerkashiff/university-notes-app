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

export async function deleteSubject(subjectId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Unauthorized. Only admins can manage subjects.' }
  }

  try {
    const noteCount = await prisma.note.count({ where: { subjectId } })
    if (noteCount > 0) {
      return { error: `Cannot delete subject with ${noteCount} attached note(s).` }
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
