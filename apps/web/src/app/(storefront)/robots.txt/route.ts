import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  const body = `User-agent: *
Allow: /
Sitemap: /sitemap.xml`

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}