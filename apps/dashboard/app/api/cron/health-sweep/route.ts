/**
 * Autonomous Health Sweep Cron Endpoint
 * GET /api/cron/health-sweep
 *
 * Invoked by the Cloudflare Cron Trigger (see apps/dashboard/wrangler.toml) every
 * 5 minutes. OpenNext routes scheduled events to the worker fetch handler, so
 * the cron hits this GET route. Runs the health/anomaly sweep over all hosts
 * and dispatches webhook alerts for findings at/above the configured severity.
 *
 * Guarded by a shared secret (CRON_SECRET) supplied via the `Authorization:
 * Bearer <secret>` header or the `?secret=` query param. Returns 401 on
 * mismatch. When CRON_SECRET is unset the endpoint is open (no secret to check).
 */

import { error } from '@chm/logger'
import { runHealthSweep } from '@/lib/health/server-sweep'

export const dynamic = 'force-dynamic'

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return true

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) return true

  const url = new URL(request.url)
  if (url.searchParams.get('secret') === secret) return true

  return false
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
