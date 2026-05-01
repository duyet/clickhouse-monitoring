import { NextResponse } from 'next/server'
import { apiKeyAuthEnabled, verifyApiKey } from '@/lib/api-key'
import { getBearerToken } from '@/lib/auth/bearer-token'

export async function middleware(request: Request) {
  if (!apiKeyAuthEnabled()) return NextResponse.next()

  // Key issuance route has its own secret-based auth in the handler
  const { pathname } = new URL(request.url)
  if (pathname === '/api/v1/auth/api-key') {
    return NextResponse.next()
  }

  const headerToken =
    getBearerToken(request.headers.get('authorization')) ||
    request.headers.get('x-api-key')

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
