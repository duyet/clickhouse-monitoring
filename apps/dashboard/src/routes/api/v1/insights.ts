/**
 * AI Insights read endpoint — GET /api/v1/insights
 *
 * Returns the current set of AI-generated insights for a host, read from the
 * findings store (source `ai-insight`), de-duplicated by stable key and bounded
 * to a recent window. Insights are produced by the cron sweep and the manual
 * POST /api/v1/insights/generate endpoint.
 *
 * Query parameters:
 * - host (optional, default 0): host to read insights for
 * - since (optional): time window, e.g. "6 HOUR", "1 DAY" (default 6 HOUR)
 * - limit (optional, default 200, max 1000)
 */

import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
import { error, generateRequestId } from '@chm/logger'
import { bridgeClickHouseEnv } from '@/lib/api/server-env'
import { readInsights } from '@/lib/insights/read-insights'

export const Route = createFileRoute('/api/v1/insights')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        bridgeClickHouseEnv(env as Record<string, string | undefined>)
        const requestId = generateRequestId()

        try {
          const searchParams = new URL(request.url).searchParams

          const hostId = Number.parseInt(searchParams.get('host') ?? '0', 10)
          if (!Number.isInteger(hostId) || hostId < 0) {
            return Response.json(
              {
                error: 'Invalid host parameter: must be a non-negative integer',
              },
              { status: 400, headers: { 'X-Request-ID': requestId } }
            )
          }

          const since = searchParams.get('since') ?? undefined
          const limitParam = searchParams.get('limit')
          const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined

          const insights = await readInsights(hostId, { since, limit })

          return Response.json(
            { insights, count: insights.length },
            { headers: { 'X-Request-ID': requestId } }
          )
        } catch (err) {
          error('[GET /api/v1/insights] Unexpected error:', err, { requestId })
          return Response.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500, headers: { 'X-Request-ID': requestId } }
          )
        }
      },
    },
  },
})
