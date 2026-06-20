/**
 * AI Insights storage backend info — GET /api/v1/insights/backend
 *
 * Reports which persistence backend the engine is configured to use
 * (`INSIGHTS_STORE_BACKEND`), so the overview panel can surface a read-only
 * indicator — mirroring `/api/v1/conversations/backend` for the chat agent.
 *
 * Returns no insight data and no secrets — only the backend kind. Fails safe to
 * `clickhouse` (the default) on any error.
 */

import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
import { error, generateRequestId } from '@chm/logger'
import { bridgeClickHouseEnv } from '@/lib/api/server-env'
import { resolveInsightsStore } from '@/lib/insights/store/resolve-store'

async function handleGet(): Promise<Response> {
  bridgeClickHouseEnv(env as Record<string, string | undefined>)
  const requestId = generateRequestId()

  try {
    const store = await resolveInsightsStore()
    return Response.json(
      { backend: store.backend },
      { headers: { 'X-Request-ID': requestId, 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    error('[GET /api/v1/insights/backend] Error:', err, { requestId })
    // Fail safe: default to the ClickHouse backend.
    return Response.json(
      { backend: 'clickhouse' },
      { headers: { 'X-Request-ID': requestId, 'Cache-Control': 'no-store' } }
    )
  }
}

export const Route = createFileRoute('/api/v1/insights/backend')({
  server: {
    handlers: {
      GET: () => handleGet(),
    },
  },
})
