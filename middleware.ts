import { Logger } from 'next-axiom'
import type { NextFetchEvent, NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // Axiom
  const logger = new Logger({ source: 'middleware' })
  logger.middleware(request)

  // Store current request url in a custom header, which you can read later
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-url', request.url)

  const url = new URL(request.url)
  requestHeaders.set('x-pathname', url.pathname)

  // Axiom
  event.waitUntil(logger.flush())

  return NextResponse.next({
    request: {
      // Apply new request headers
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - healthz (health check)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.svg (favicon file)
     *
     * And have the following headers: next-router-prefetch, purpose=prefetch
     */
    {
      source:
        '/((?!api|healthz|_next/static|_next/image|favicon.ico|logo.svg).*)',
      has: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
