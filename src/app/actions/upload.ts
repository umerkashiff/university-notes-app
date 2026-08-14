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

export async function getPresignedUrl(fileName: string, contentType: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SENIOR') {
    return { error: 'Unauthorized' }
  }

  // 9.5GB hard limit check
  const storageReq = await getTotalStorage()
  if (storageReq.success && storageReq.totalBytes !== undefined) {
    const LIMIT = 9.5 * 1024 * 1024 * 1024;
    if (storageReq.totalBytes > LIMIT) {
      return { error: 'Storage limit reached (9.5GB). Please contact an admin.' }
    }
  }

  const bucketName = process.env.R2_BUCKET_NAME!

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      ContentType: contentType,
    })

    // The URL will expire in 5 minutes
    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 })
    return { url }
  } catch (err) {
    console.error('Error generating presigned URL:', err)
    return { error: 'Failed to generate upload URL' }
  }
}
