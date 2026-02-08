/**
 * Analytics API Endpoint
 * Receives analytics events and stores them in ClickHouse
 */

import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'
import { getClient } from '@/lib/clickhouse'
import { ErrorLogger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME || 'system.monitoring_events'

interface AnalyticsRequestBody {
  events: Array<{
    kind: string
    data: string
    extra?: string
  }>
}

/**
 * POST /api/analytics
 * Receives batched analytics events
 */
export async function POST(request: NextRequest) {
  try {
    const body: AnalyticsRequestBody = await request.json()

    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Get hostId from query params (default to 0)
    const hostId = parseInt(
      request.nextUrl.searchParams.get('hostId') || '0',
      10
    )
    const client = await getClient({ hostId })

    // Transform events to match ClickHouse schema
    const values = body.events.map((event) => ({
      kind: event.kind,
      data: event.data,
      extra: event.extra || '{}',
      actor: 'user',
    }))

    // Insert events into ClickHouse
    await client.insert({
      table: EVENTS_TABLE,
      format: 'JSONEachRow',
      values,
    })

    ErrorLogger.logDebug('[/api/analytics] Analytics events received', {
      route: '/api/analytics',
      eventCount: body.events.length,
      url: request.url,
    })

    return NextResponse.json({ success: true, count: body.events.length })
  } catch (error) {
    ErrorLogger.logError(
      error instanceof Error ? error : new Error(String(error)),
      {
        route: '/api/analytics',
      }
    )

    return NextResponse.json(
      { error: `Error storing analytics events: ${error}` },
      { status: 500 }
    )
  }
}

/**
 * GET /api/analytics
 * Returns analytics status and configuration
 */
export async function GET() {
  return NextResponse.json({
    enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false',
    trackPerformance:
      process.env.NEXT_PUBLIC_ANALYTICS_TRACK_PERFORMANCE !== 'false',
    trackErrors: process.env.NEXT_PUBLIC_ANALYTICS_TRACK_ERRORS !== 'false',
    trackPageViews:
      process.env.NEXT_PUBLIC_ANALYTICS_TRACK_PAGEVIEWS !== 'false',
  })
}
