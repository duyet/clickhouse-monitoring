import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'
import type { NextRequest } from 'next/server'
import { NextResponse, userAgent } from 'next/server'
import { getClient } from './lib/clickhouse'

const QUERY_CLEANUP_MAX_DURATION_SECONDS = 10 * 60 // 10 minutes
const MONITORING_USER = process.env.CLICKHOUSE_USER || ''

export async function middleware(request: NextRequest) {
  const client = getClient(true)
  await initTrackingTable(client)
  await trackingPageView(client, request)
  await cleanupHangQuery(client)

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
     */
    '/((?!api|healthz|_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
}

async function initTrackingTable(client: WebClickHouseClient) {
  console.log('[Middleware] initializing system.monitoring_events')

  try {
    const response = await client.query({
      query: `
        CREATE TABLE IF NOT EXISTS system.monitoring_events (
          kind Enum('PageView', 'UserKillQuery', 'SystemKillQuery', 'LastCleanup'),
          actor LowCardinality(String) DEFAULT user(),
          data String,
          extra String,
          event_time DateTime DEFAULT now(),
          event_date Date DEFAULT today()
        ) ENGINE = ReplacingMergeTree
        PARTITION BY event_date
        ORDER BY (kind, actor, event_time)`,
    })
    console.log(
      '[Middleware] Created table system.monitoring_events',
      await response.text()
    )
  } catch (error) {
    console.error(
      '[Middleware] Error initializing table system.monitoring_events',
      error
    )
  }
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

async function cleanupHangQuery(client: WebClickHouseClient) {
  // Last cleanup event
  let lastCleanup = null

  try {
    const response = await client.query({
      query: `
        SELECT max(event_time) as last_cleanup
        FROM system.monitoring_events
        WHERE kind = 'LastCleanup'
        `,
      format: 'JSONEachRow',
    })
    const data: { last_cleanup: string }[] = await response.json()
    lastCleanup = data.length > 0 ? new Date(data[0].last_cleanup) : new Date()
    console.debug('[Middleware] Last cleanup:', lastCleanup)
  } catch (error) {
    console.error('[Middleware] Error getting last cleanup:', error)
    return
  }

  if (
    new Date().getTime() - lastCleanup.getTime() <
    QUERY_CLEANUP_MAX_DURATION_SECONDS * 1000
  ) {
    console.debug(
      `[Middleware] Last cleanup was less than ${QUERY_CLEANUP_MAX_DURATION_SECONDS}s`
    )
    return
  }

  try {
    const resp = await client.query({
      query: `
        KILL QUERY
        WHERE user = currentUser()
          AND read_rows = 0
          AND elapsed > ${QUERY_CLEANUP_MAX_DURATION_SECONDS}
        ASYNC
      `,
      format: 'JSON',
    })
    const respJson: {
      meta: object[]
      data: { kill_status: string; query_id: string; user: string }[]
      rows: number
      statistics: object
    } = await resp.json()

    console.log(
      '[Middleware] Cleanup hang queries:',
      respJson.data.map((row) => row.query_id).join(', ')
    )

    await client.insert({
      table: 'system.monitoring_events',
      values: [
        {
          kind: 'LastCleanup',
          actor: MONITORING_USER,
        },
      ],
      format: 'JSONEachRow',
    })

    if (respJson.rows === 0) {
      console.debug('[Middleware] No hang queries to cleanup')
      return
    }

    // Count group by kill_status
    const killStatus = respJson.data.reduce(
      (acc, row) => {
        acc[row.kill_status] = (acc[row.kill_status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    console.log('[Middleware] Kill status:', killStatus)

    await client.insert({
      table: 'system.monitoring_events',
      format: 'JSONEachRow',
      values: [
        {
          kind: 'SystemKillQuery',
          actor: MONITORING_USER,
          data: [
            `Detected ${respJson.rows} hang queries`,
            `(>${QUERY_CLEANUP_MAX_DURATION_SECONDS}s),`,
            `killing them, result: ${JSON.stringify(killStatus)}`,
          ].join(' '),
        },
      ],
    })
  } catch (error) {
    console.error('[Middleware] Error cleaning up hang query:', error)
  }
}
