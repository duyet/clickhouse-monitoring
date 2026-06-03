/**
 * PageView Tracking Endpoint — GET /api/pageview
 *
 * Records a PageView event to the monitoring_events table. Collects URL,
 * browser user-agent, and IP/geo from standard request headers.
 *
 * Ported from apps/dashboard/app/api/pageview/route.ts.
 * - next/server (userAgent) and @vercel/functions (geolocation) are replaced
 *   with direct header reads — equivalent for Cloudflare Workers.
 * - ErrorLogger replaced with @chm/logger debug/error.
 */

import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
import { getClient } from '@chm/clickhouse-client'
import { debug, error } from '@chm/logger'
import { bridgeClickHouseEnv } from '@/lib/api/server-env'
import { EVENTS_TABLE } from '@/lib/app-tables'

/** Trim whitespace and strip trailing slash/question-mark from a URL string. */
function normalizeUrl(url: string): string {
  return url.trim().replace(/(\/|\?)$/, '')
}

export const Route = createFileRoute('/api/pageview')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        bridgeClickHouseEnv(env as Record<string, string | undefined>)

        const searchParams = new URL(request.url).searchParams
        const rawUrl = searchParams.get('url') || request.headers.get('referer')
        const hostId = parseInt(searchParams.get('hostId') || '0', 10)

        if (!rawUrl) {
          return Response.json({ error: 'No URL provided' }, { status: 400 })
        }

        const url = normalizeUrl(rawUrl)
        const client = await getClient({ hostId })

        // User-agent: parse browser/os/device from the UA string directly.
        // next/server's userAgent() is not available; Cloudflare provides the
        // raw header. We forward the raw string in the extra payload.
        const uaString = request.headers.get('user-agent') ?? ''

        // Geo: Cloudflare Workers expose CF-IPCountry, CF-IPCity etc.
        const country =
          request.headers.get('cf-ipcountry') ??
          request.headers.get('x-vercel-ip-country') ??
          undefined
        const city =
          request.headers.get('cf-ipcity') ??
          request.headers.get('x-vercel-ip-city') ??
          undefined
        const region =
          request.headers.get('cf-region') ??
          request.headers.get('x-vercel-ip-country-region') ??
          undefined

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
                  userAgent: uaString,
                  ip,
                  city,
                  country,
                  region,
                }),
              },
            ],
          })
          debug('[/api/pageview] PageView event created', { url })
          return Response.json({ message: 'PageView event created', url })
        } catch (err) {
          error('[/api/pageview] PageView insert error', err as Error)
          return Response.json(
            { error: `Error creating PageView event: ${err}` },
            { status: 500 }
          )
        }
      },
    },
  },
})
