import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
// Public client factory. We pass `web: true` so it always uses
// @clickhouse/client-web (fetch-based) and never touches the node
// @clickhouse/client (node:os/node:stream/TCP) — excluded from the worker
// bundle in vite.config.ts.
import { getClient } from '@chm/clickhouse-client'
import { error as logError } from '@chm/logger'
import { getClickHouseConfigsFromEnv } from '@/lib/api/clickhouse-config'

// Mirrors @chm/clickhouse-client getClickHouseConfigs(), but sources the
// comma-separated lists from the Cloudflare env binding (workerd does not map
// arbitrary bindings onto process.env) instead of process.env.

interface HostHealth {
  host: string
  name?: string
  status: 'up' | 'down'
  latencyMs: number
  error?: string
}

export const Route = createFileRoute('/api/healthz')({
  server: {
    handlers: {
      GET: async () => {
        const configs = getClickHouseConfigsFromEnv(
          env as Record<string, string | undefined>
        )

        if (configs.length === 0) {
          return Response.json(
            {
              ok: false,
              error: 'No ClickHouse hosts configured',
              hosts: [],
              timestamp: new Date().toISOString(),
            },
            { status: 503 }
          )
        }

        // Per-host ping timeout (default 3s; override via CHM_HEALTHZ_TIMEOUT_MS).
        // Without an explicit abort a hung ClickHouse host stalls this readiness
        // check past the kubelet probe timeout — @clickhouse/client-web's fetch
        // otherwise waits on the TCP timeout (often >30s). Keep this BELOW the
        // chart's readinessProbe.timeoutSeconds (default 10s). abort_signal +
        // AbortSignal.timeout() are supported on both runtimes (Node 18+ and
        // workerd), so this route stays runtime-agnostic.
        const pingTimeoutMs =
          Number.parseInt(
            (env as Record<string, string | undefined>)
              .CHM_HEALTHZ_TIMEOUT_MS ?? '',
            10
          ) || 3000

        const hosts: HostHealth[] = await Promise.all(
          configs.map(async (config) => {
            const start = Date.now()
            try {
              // web: true forces the fetch-based client-web on workerd.
              const client = await getClient({
                web: true,
                clientConfig: config,
              })
              const resultSet = await client.query({
                query: 'SELECT 1',
                format: 'JSON',
                abort_signal: AbortSignal.timeout(pingTimeoutMs),
              })
              // Drain the response so the ping is a real round-trip.
              await resultSet.text()

              return {
                host: config.host,
                name: config.customName,
                status: 'up' as const,
                latencyMs: Date.now() - start,
              }
            } catch (err) {
              logError('[/api/healthz] host check failed', err as Error)
              return {
                host: config.host,
                name: config.customName,
                status: 'down' as const,
                latencyMs: Date.now() - start,
                error: 'Connection failed',
              }
            }
          })
        )

        const allUp = hosts.every((h) => h.status === 'up')

        return Response.json(
          {
            ok: allUp,
            hosts,
            timestamp: new Date().toISOString(),
          },
          { status: allUp ? 200 : 503 }
        )
      },
    },
  },
})
