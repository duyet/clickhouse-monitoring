import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'
import { apiKeyAuthEnabled, verifyApiKey } from '@/lib/api-key'

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  if (!host) return false

  if (origin) {
    try {
      return new URL(origin).host === host
    } catch {
      return false
    }
  }

  if (referer) {
    try {
      return new URL(referer).host === host
    } catch {
      return false
    }
  }

  return false
}

export async function middleware(request: NextRequest) {
  if (!apiKeyAuthEnabled()) return NextResponse.next()

  // Key issuance route has its own secret-based auth in the handler
  if (request.nextUrl.pathname === '/api/v1/auth/api-key') {
    return NextResponse.next()
  }

  // Same-origin requests from the dashboard UI bypass API key check
  if (isSameOrigin(request)) return NextResponse.next()

  const auth = request.headers.get('authorization')
  const headerToken = auth?.startsWith('Bearer ')
    ? auth.slice(7)
    : request.headers.get('x-api-key')

  if (!headerToken) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 })
  }

  const result = await verifyApiKey(headerToken)
  if (!result.valid) {
    return NextResponse.json(
      { error: `Invalid API key: ${result.reason}` },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/v1/:path*'],
}
