import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fileUrl = searchParams.get('url')
  const title = searchParams.get('title') || 'study-material'

  if (!fileUrl) {
    return new NextResponse('Missing file url parameter', { status: 400 })
  }

  // Security check: Only allow downloads from our trusted R2 storage domain
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-4c28b39a02ca4952a6c31f0baf9d62e3.r2.dev'
  const isAllowedDomain = fileUrl.startsWith(publicBase) || fileUrl.startsWith('https://pub-4c28b39a02ca4952a6c31f0baf9d62e3.r2.dev')

  if (!isAllowedDomain) {
    return new NextResponse('Forbidden: Download URL is not from a trusted source', { status: 403 })
  }

  try {
    const upstreamRes = await fetch(fileUrl)
    if (!upstreamRes.ok || !upstreamRes.body) {
      return new NextResponse('Failed to fetch file from storage', { status: upstreamRes.status })
    }

    // Clean title for download filename
    const sanitizedTitle = title
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()

    const filename = sanitizedTitle.toLowerCase().endsWith('.pdf')
      ? sanitizedTitle
      : `${sanitizedTitle}.pdf`

    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    // Set attachment disposition to force download prompt
    headers.set('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(filename)}`)
    
    const contentLength = upstreamRes.headers.get('content-length')
    if (contentLength) {
      headers.set('Content-Length', contentLength)
    }

    return new NextResponse(upstreamRes.body as any, {
      status: 200,
      headers
    })
  } catch (err: any) {
    console.error('Download proxy error:', err)
    return new NextResponse('Error downloading file', { status: 500 })
  }
}
