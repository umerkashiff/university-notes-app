import crypto from 'crypto'

/**
 * Lightweight Zero-Dependency Google Drive Adapter
 * Uses Node.js native crypto for Google Service Account JWT signing.
 * Compatible with Next.js Server Actions & API Route handlers on Vercel/Node.
 */

interface GoogleTokenCache {
  token: string
  expiresAt: number
}

let tokenCache: GoogleTokenCache | null = null

export function isGoogleDriveConfigured(): boolean {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_DRIVE_CLIENT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_DRIVE_PRIVATE_KEY
  return Boolean(email && key)
}

/**
 * Obtains a Google OAuth2 access token using Service Account RSA-SHA256 JWT
 */
export async function getGoogleDriveAccessToken(): Promise<string | null> {
  const clientEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_DRIVE_CLIENT_EMAIL)?.trim()
  let privateKey = (process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_DRIVE_PRIVATE_KEY)?.trim()

  if (!clientEmail || !privateKey) {
    return null
  }

  // If token is cached and not expired, reuse it
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) {
    return tokenCache.token
  }

  try {
    // Handle escaped newlines from environment variables
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }

    const now = Math.floor(Date.now() / 1000)
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    }

    const claimSet = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
    const encodedClaimSet = Buffer.from(JSON.stringify(claimSet)).toString('base64url')
    const signatureInput = `${encodedHeader}.${encodedClaimSet}`

    const signer = crypto.createSign('RSA-SHA256')
    signer.update(signatureInput)
    const signature = signer.sign(privateKey, 'base64url')

    const jwt = `${signatureInput}.${signature}`

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error('Failed to authenticate with Google Drive API:', errText)
      return null
    }

    const tokenData = await tokenRes.json()
    tokenCache = {
      token: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000)
    }

    return tokenCache.token
  } catch (err) {
    console.error('Google Drive auth error:', err)
    return null
  }
}

/**
 * Uploads a file buffer directly to Google Drive and sets public read permissions
 */
export async function uploadToGoogleDrive(
  fileName: string,
  contentType: string,
  buffer: Buffer
): Promise<{ fileId: string; fileUrl: string } | { error: string }> {
  const token = await getGoogleDriveAccessToken()
  if (!token) {
    return { error: 'Google Drive credentials are not configured or invalid.' }
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim()

  try {
    const metadata: Record<string, any> = {
      name: fileName,
      mimeType: contentType
    }

    if (folderId) {
      metadata.parents = [folderId]
    }

    // Multipart upload
    const boundary = `-------SemstackBoundary${Date.now()}`
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    const multipartBody = Buffer.concat([
      Buffer.from(
        `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`
      ),
      Buffer.from(
        `${delimiter}Content-Type: ${contentType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`
      ),
      buffer,
      Buffer.from(closeDelimiter)
    ])

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webContentLink,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': String(multipartBody.length)
        },
        body: multipartBody
      }
    )

    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      return { error: `Google Drive upload failed: ${errText}` }
    }

    const fileData = await uploadRes.json()
    const fileId = fileData.id

    // Grant public read permission to anyone with link
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    })

    // Direct download/streaming URL
    const fileUrl = `https://drive.google.com/uc?export=download&id=${fileId}`

    return {
      fileId,
      fileUrl
    }
  } catch (err: any) {
    console.error('Error uploading to Google Drive:', err)
    return { error: err?.message || 'Failed to upload to Google Drive' }
  }
}
