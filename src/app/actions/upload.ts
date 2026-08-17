'use server'

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getCurrentUser } from '@/app/actions/auth'
import { getTotalStorage } from '@/app/actions/notes'
import { isGoogleDriveConfigured, uploadToGoogleDrive } from '@/lib/google-drive'

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
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/plain',
  'application/octet-stream'
])

const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'docx',
  'doc',
  'pptx',
  'ppt',
  'txt',
  'xlsx',
  'xls'
])

export async function getPresignedUrl(fileName: string, contentType: string) {
  const user = await getCurrentUser()
  if (!user || user.status !== 'ACTIVE' || (user.role !== 'SENIOR' && user.role !== 'ADMIN')) {
    return { error: 'Unauthorized. Only active contributors and administrators can upload files.' }
  }

  // 1. Strict MIME Type Whitelisting
  const cleanMime = contentType?.trim().toLowerCase()
  if (!cleanMime || !ALLOWED_MIME_TYPES.has(cleanMime)) {
    return { error: 'Invalid file format. Supported formats: PDF, DOCX, PPTX, XLSX, TXT, and Images (PNG, JPG, WEBP).' }
  }

  // 2. Path Traversal & Filename Sanitization
  const cleanKey = fileName
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9_\-\/\.]/g, '_')
    .replace(/^\/+/, '')

  const ext = cleanKey.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return { error: 'Invalid file extension. Supported formats: .pdf, .docx, .pptx, .xlsx, .txt, and image files.' }
  }

  // 3. Storage Quota Check (9.5GB Hard Safety Cap to guarantee zero Cloudflare charges)
  const storageReq = await getTotalStorage()
  if (storageReq.success && storageReq.totalBytes !== undefined) {
    const R2_LIMIT = 9.5 * 1024 * 1024 * 1024
    if (storageReq.totalBytes >= R2_LIMIT) {
      if (isGoogleDriveConfigured()) {
        return { 
          useDriveFallback: true, 
          error: 'Cloudflare R2 free tier safety cap reached (9.5GB). Routed to Google Drive fallback storage.' 
        }
      }
      return { 
        error: 'Cloudflare R2 9.5GB safety cap reached. Uploads are paused to guarantee zero billing charges. Please contact a department administrator.' 
      }
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

/**
 * Direct Server Action to upload via Google Drive adapter (Failover / Direct option)
 */
export async function uploadViaGoogleDrive(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.status !== 'ACTIVE' || (user.role !== 'SENIOR' && user.role !== 'ADMIN')) {
    return { error: 'Unauthorized. Only active contributors and administrators can upload files.' }
  }

  if (!isGoogleDriveConfigured()) {
    return { error: 'Google Drive storage adapter is not configured. Please add Google Drive credentials in settings.' }
  }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) {
    return { error: 'No file provided.' }
  }

  const cleanMime = file.type?.trim().toLowerCase() || 'application/octet-stream'
  if (!ALLOWED_MIME_TYPES.has(cleanMime)) {
    return { error: 'Invalid file format. Supported formats: PDF, DOCX, PPTX, XLSX, TXT, and Images.' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return { error: 'Invalid file extension.' }
  }

  if (file.size > 100 * 1024 * 1024) {
    return { error: 'File size must be under 100 MB.' }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const cleanFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_')}`
    return await uploadToGoogleDrive(cleanFileName, cleanMime, buffer)
  } catch (err: any) {
    console.error('Failed to upload file via Google Drive:', err)
    return { error: err?.message || 'Failed to upload to Google Drive' }
  }
}

/**
 * Check storage health, current R2 utilization, 9.5GB safety cap, and Google Drive readiness
 */
export async function getStorageProviderStatus() {
  const storageReq = await getTotalStorage()
  const totalBytes = storageReq.totalBytes || 0
  const R2_LIMIT = 9.5 * 1024 * 1024 * 1024
  const isR2Capped = totalBytes >= R2_LIMIT
  const googleDriveReady = isGoogleDriveConfigured()

  return {
    r2UsedBytes: totalBytes,
    r2LimitBytes: R2_LIMIT,
    isR2Capped,
    googleDriveReady,
    activeProvider: isR2Capped ? (googleDriveReady ? 'GOOGLE_DRIVE' : 'LOCKED') : 'R2'
  }
}
