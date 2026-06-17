/**
 * AI Insights generation endpoint — POST /api/v1/insights/generate
 *
 * Runs the insight pipeline (collect → optional LLM enrich → persist) for a
 * host and returns the freshly generated insights. Backs the manual "Refresh"
 * button on the overview panel; the cron sweep generates the same insights
 * autonomously every few minutes.
 *
 * Best-effort: degrades silently on read-only clusters or when no LLM key is
 * configured (deterministic insights are still produced and returned).
 *
 * Query parameters:
 * - host (optional, default 0): host to generate insights for
 */

import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
import { error, generateRequestId } from '@chm/logger'
import { bridgeClickHouseEnv } from '@/lib/api/server-env'
import { generateInsights } from '@/lib/insights/generate-insights'

async function handlePost(request: Request): Promise<Response> {
  bridgeClickHouseEnv(env as Record<string, string | undefined>)
  const requestId = generateRequestId()

  try {
    const hostId = Number.parseInt(
      new URL(request.url).searchParams.get('host') ?? '0',
      10
    )
    if (!Number.isInteger(hostId) || hostId < 0) {
      return Response.json(
        { error: 'Invalid host parameter: must be a non-negative integer' },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      )
    }

    const insights = await generateInsights(hostId)

    return Response.json(
      { insights, count: insights.length },
      { headers: { 'X-Request-ID': requestId } }
    )
  } catch (err) {
    error('[POST /api/v1/insights/generate] Unexpected error:', err, {
      requestId,
    })
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    )
  }
}

export const Route = createFileRoute('/api/v1/insights/generate')({
  server: {
    handlers: {
      POST: ({ request }) => handlePost(request),
    },
  },
})
