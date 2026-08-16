'use server'

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getCurrentUser } from '@/app/actions/auth'
import { getTotalStorage } from '@/app/actions/notes'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
])

const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'webp'
])

export async function getPresignedUrl(fileName: string, contentType: string) {
  const user = await getCurrentUser()
  if (!user || user.status !== 'ACTIVE' || (user.role !== 'SENIOR' && user.role !== 'ADMIN')) {
    return { error: 'Unauthorized. Only active contributors and administrators can upload files.' }
  }

  // 1. Strict MIME Type Whitelisting
  const cleanMime = contentType?.trim().toLowerCase()
  if (!cleanMime || !ALLOWED_MIME_TYPES.has(cleanMime)) {
    return { error: 'Invalid file format. Only PDF documents and standard images (PNG, JPG, WEBP) are allowed.' }
  }

  // 2. Path Traversal & Filename Sanitization
  const cleanKey = fileName
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9_\-\/\.]/g, '_')
    .replace(/^\/+/, '')

  const ext = cleanKey.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return { error: 'Invalid file extension. Only .pdf, .png, .jpg, .jpeg, and .webp files are supported.' }
  }

  // 3. Storage Quota Check (9.5GB Hard Limit)
  const storageReq = await getTotalStorage()
  if (storageReq.success && storageReq.totalBytes !== undefined) {
    const LIMIT = 9.5 * 1024 * 1024 * 1024
    if (storageReq.totalBytes > LIMIT) {
      return { error: 'Storage limit reached (9.5GB). Please contact a department administrator.' }
    }
  }

  const bucketName = process.env.R2_BUCKET_NAME!

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: cleanKey,
      ContentType: cleanMime,
    })

    // Presigned upload URL expires strictly after 5 minutes
    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 })
    return { url, key: cleanKey }
  } catch (err) {
    console.error('Error generating presigned URL:', err)
    return { error: 'Failed to generate secure upload URL' }
  }
}
