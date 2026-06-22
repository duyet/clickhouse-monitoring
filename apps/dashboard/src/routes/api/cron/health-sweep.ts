/**
 * Autonomous Health Sweep Cron Endpoint — GET /api/cron/health-sweep
 *
 * Invoked by the Cloudflare Cron Trigger (see wrangler.toml `[triggers] crons`)
 * every 5 minutes. The @cloudflare/vite-plugin worker routes scheduled events to
 * the fetch handler, so the cron hits this GET route. Runs the health/anomaly
 * sweep over all hosts and dispatches webhook alerts for findings at/above the
 * configured severity.
 *
 * Guarded by a shared secret (CRON_SECRET) supplied via the `Authorization:
 * Bearer <secret>` header or the `?secret=` query param. Returns 401 on
 * mismatch. When CRON_SECRET is unset the endpoint is open (no secret to check).
 *
 * Ported from apps/dashboard/app/api/cron/health-sweep/route.ts (Next.js).
 * Differences from the Next version:
 *   - The handler is wired through TanStack Start `createFileRoute().server`.
 *   - CRON_SECRET is read from the Worker `env` binding (authoritative on
 *     workerd) with a `process.env` fallback for node/dev.
 *   - `bridgeClickHouseEnv(env)` copies CLICKHOUSE_* from the Worker binding
 *     onto `process.env` before the sweep, because `getClickHouseConfigs()`
 *     (used by `runHealthSweep`) reads host config from `process.env`.
 */

import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
import { error } from '@chm/logger'
import { bridgeClickHouseEnv } from '@/lib/api/server-env'
import { runHealthSweep } from '@/lib/health/server-sweep'
import { secretsMatch } from '@/lib/auth/providers/constant-time'

function isAuthorized(request: Request): boolean {
  const bindings = env as Record<string, string | undefined>
  const secret = (bindings.CRON_SECRET ?? process.env.CRON_SECRET)?.trim()
  if (!secret) return true

  const authHeader = request.headers.get('authorization')
  if (authHeader && secretsMatch(authHeader, `Bearer ${secret}`)) return true

  const url = new URL(request.url)
  const querySecret = url.searchParams.get('secret')
  if (querySecret && secretsMatch(querySecret, secret)) return true

  return false
}

async function handler(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Copy CLICKHOUSE_* from the Worker binding onto process.env so
  // getClickHouseConfigs() (inside runHealthSweep) can resolve hosts.
  bridgeClickHouseEnv(env as Record<string, string | undefined>)

  try {
    const summary = await runHealthSweep()
    return Response.json(summary, { status: 200 })
  } catch (err) {
    error('[GET /api/cron/health-sweep] Sweep failed', err as Error)
    return Response.json(
      {
        error: err instanceof Error ? err.message : 'Health sweep failed',
      },
      { status: 500 }
    )
  }
}

export const Route = createFileRoute('/api/cron/health-sweep')({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
    },
  },
})
