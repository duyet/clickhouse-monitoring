import type { NextRequest } from 'next/server'
import { NextResponse, userAgent } from 'next/server'

import { getClient } from '@/lib/clickhouse'
import { normalizeUrl } from '@/lib/utils'
import { validateHostId, validateUrl } from '@/lib/validation'
import { geolocation } from '@vercel/functions'

export const dynamic = 'force-dynamic'

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME || 'system.monitoring_events'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const rawUrl = searchParams.get('url') || request.headers.get('referer')

    // Validate URL parameter
    const urlValidation = validateUrl(rawUrl)
    if (!urlValidation.isValid) {
      return NextResponse.json({ error: urlValidation.error }, { status: 400 })
    }

    const url = normalizeUrl(urlValidation.value!)

    // Validate hostId parameter
    const hostIdParam = searchParams.get('hostId') || '0'
    const hostIdValidation = validateHostId(hostIdParam)
    if (!hostIdValidation.isValid) {
      return NextResponse.json(
        { error: hostIdValidation.error },
        { status: 400 }
      )
    }

    const hostId = hostIdValidation.value!

    // Get client with validated hostId
    const client = await getClient({ web: true, hostId })

    // https://nextjs.org/docs/app/api-reference/functions/userAgent
    const ua = userAgent(request)

    // https://vercel.com/guides/geo-ip-headers-geolocation-vercel-functions#further-reading
    const { city, country, region } = geolocation(request)
    const realIp = request.headers.get('x-real-ip') ?? ''
    const forwardedFor = request.headers.get('x-forwarded-for') ?? realIp
    const ip = (forwardedFor.split(',')[0] || '').trim()

    // Fire-and-forget pattern: Don't wait for insert completion
    // This prevents multiple simultaneous requests from causing race conditions
    const insertPromise = client.insert({
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

    // Return immediately to prevent blocking
    // Log async to avoid race conditions
    insertPromise
      .then(() => {
        console.log(`[/api/pageview] 'PageView' event created: ${url}`)
      })
      .catch((error) => {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        console.error('[/api/pageview] Failed to create PageView event:', {
          error: errorMessage,
          url,
        })
      })

    return NextResponse.json({ message: 'PageView event queued', url })
  } catch (error) {
    // Enhanced error logging with context
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('[/api/pageview] Error creating PageView event:', {
      message: errorMessage,
      stack: errorStack,
    })

    return NextResponse.json(
      {
        error: errorMessage,
        message: 'Failed to create PageView event',
      },
      { status: 500 }
    )
  }
}
