/**
 * Init Endpoint — POST /api/init
 *
 * Creates (or migrates) the monitoring_events tracking table for a given host.
 * Safe to call repeatedly — the underlying schema logic is idempotent.
 *
 * Ported from apps/dashboard/app/api/init/route.ts.
 * - ErrorLogger replaced with @chm/logger error.
 */

import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
import { getClient } from '@chm/clickhouse-client'
import { error } from '@chm/logger'
import { bridgeClickHouseEnv } from '@/lib/api/server-env'
import { bridgeApiKeyEnv, isAuthenticatedRequest } from '@/lib/auth/api-guard'
import { initTrackingTable } from '@/lib/tracking'

export const Route = createFileRoute('/api/init')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        bridgeClickHouseEnv(env as Record<string, string | undefined>)
        bridgeApiKeyEnv(env as Record<string, string | undefined>)

        // Mutating endpoint (CREATE TABLE): require a genuinely authenticated
        // caller. isAuthenticatedRequest() intentionally ignores public-read,
        // so anonymous callers cannot reach it in cloud public-read mode.
        if (!(await isAuthenticatedRequest(request))) {
          return Response.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }

        const searchParams = new URL(request.url).searchParams
        const hostIdRaw = searchParams.get('hostId')
        if (!hostIdRaw) {
          return Response.json(
            { error: 'Missing required parameter: hostId' },
            { status: 400 }
          )
        }

        const hostId = parseInt(hostIdRaw, 10)
        if (Number.isNaN(hostId) || hostId < 0) {
          return Response.json(
            { error: 'Invalid hostId: must be a non-negative number' },
            { status: 400 }
          )
        }

        const client = await getClient({ hostId })

        try {
          await initTrackingTable(client)
          return Response.json({ message: 'Ok.' })
        } catch (err) {
          error('[/api/init] Handler error', err as Error)
          return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        }
      },
    },
  },
})
