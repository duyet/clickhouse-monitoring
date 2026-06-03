/**
 * Autonomous Health Sweep Cron Endpoint — GET /api/cron/health-sweep
 *
 * Intended to be invoked by a Cloudflare Cron Trigger every 5 minutes.
 * Runs the health/anomaly sweep over all hosts and dispatches webhook
 * alerts for findings at or above the configured minimum severity.
 *
 * Ported from apps/dashboard/app/api/cron/health-sweep/route.ts.
 *
 * STATUS: 501 stub — @/lib/health/server-sweep (runHealthSweep) and
 * @/lib/health/server-alert-config (getServerAlertConfig) are not yet
 * ported into dashboard-tsr. Port those modules first, then remove the
 * stub and wire the real handler below.
 */

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/cron/health-sweep')({
  server: {
    handlers: {
      GET: async () => {
        return Response.json(
          {
            error: 'Not Implemented',
            message:
              'health-sweep is not yet available in dashboard-tsr: ' +
              'lib/health/server-sweep and lib/health/server-alert-config ' +
              'must be ported first.',
          },
          { status: 501 }
        )
      },
    },
  },
})
