import type { NextRequest } from 'next/server'

import { geolocation } from '@vercel/functions'
import { NextResponse, userAgent } from 'next/server'
import { getClient } from '@/lib/clickhouse'
import { ErrorLogger } from '@/lib/logger'
import { normalizeUrl } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME || 'system.monitoring_events'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const rawUrl = searchParams.get('url') || request.headers.get('referer')
  const hostId = parseInt(searchParams.get('hostId') || '0', 10)

  if (!rawUrl) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
  }

  const url = normalizeUrl(rawUrl)
  // getClient will auto-detect and use web client for Cloudflare Workers
  const client = await getClient({ hostId })

  // https://nextjs.org/docs/app/api-reference/functions/userAgent
  const ua = userAgent(request)

  // https://vercel.com/guides/geo-ip-headers-geolocation-vercel-functions#further-reading
  const { city, country, region } = geolocation(request)
  const realIp = request.headers.get('x-real-ip') ?? ''
  const forwardedFor = request.headers.get('x-forwarded-for') ?? realIp
  const ip = (forwardedFor.split(',')[0] || '').trim()

  try {
    await client.insert({
      table: EVENTS_TABLE,
      format: 'JSONEachRow',
      values: [
        {
          kind: 'PageView',
          data: url,
          actor: 'user',
          extra: JSON.stringify({
            browser: ua.browser,
            os: ua.os,
            device: ua.device,
            engine: ua.engine,
            cpu: ua.cpu,
            isBot: ua.isBot,
            ip,
            city,
            country,
            region,
          }),
        },
      ],
    })
    ErrorLogger.logDebug('[/api/pageview] PageView event created', {
      route: '/api/pageview',
      url: request.url,
    })
    return NextResponse.json({ message: 'PageView event created', url })
  } catch (error) {
    ErrorLogger.logError(
      error instanceof Error ? error : new Error(String(error)),
      { route: '/api/pageview', event: 'PageView' }
    )
    return NextResponse.json(
      { error: `Error creating PageView event: ${error}` },
      { status: 500 }
    )
  }
}
