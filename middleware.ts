import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'
import type { NextRequest } from 'next/server'
import { NextResponse, userAgent } from 'next/server'
import { getClient } from './lib/clickhouse'
import { initTrackingTable } from './lib/tracking'

export async function middleware(request: NextRequest) {
  const client = getClient(true)
  await initTrackingTable(client)
  await trackingPageView(client, request)

  // Store current request url in a custom header, which you can read later
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-url', request.url)

  const url = new URL(request.url)
  requestHeaders.set('x-pathname', url.pathname)

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

async function trackingPageView(
  client: WebClickHouseClient,
  request: NextRequest
) {
  // https://nextjs.org/docs/app/api-reference/functions/userAgent
  const ua = userAgent(request)

  try {
    await client.insert({
      table: 'system.monitoring_events',
      format: 'JSONEachRow',
      values: [
        {
          kind: 'PageView',
          data: request.url,
          actor: 'user',
          extra: JSON.stringify({
            browser: ua.browser,
            os: ua.os,
            device: ua.device,
            engine: ua.engine,
            cpu: ua.cpu,
            isBot: ua.isBot,
          }),
        },
      ],
    })
    console.log(`[Middleware] 'PageView' event created:`, request.url)
  } catch (error) {
    console.error("[Middleware] 'PageView' event create error:", error)
  }
}
