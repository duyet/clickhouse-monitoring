import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { apiKeyAuthEnabled, verifyApiKey } from '@/lib/api-key'

export function middleware(request: NextRequest) {
  if (!apiKeyAuthEnabled()) return NextResponse.next()

  const auth = request.headers.get('authorization')
  const headerToken = auth?.startsWith('Bearer ') ? auth.slice(7) : request.headers.get('x-api-key')

  if (!headerToken) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 })
  }

  const status = verifyApiKey(headerToken)
  if (!status.valid) {
    return NextResponse.json({ error: `Invalid API key: ${status.reason}` }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/v1/:path*'],
}
