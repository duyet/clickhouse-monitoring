import { createFileRoute } from '@tanstack/react-router'

import type { ClickHouseConfig } from '@chm/clickhouse-client'

import { env } from 'cloudflare:workers'
// Public client factory. We pass `web: true` so it always uses
// @clickhouse/client-web (fetch-based) and never touches the node
// @clickhouse/client (node:os/node:stream/TCP) — excluded from the worker
// bundle in vite.config.ts.
import { getClient } from '@chm/clickhouse-client'
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
              return {
                host: config.host,
                name: config.customName,
                status: 'down' as const,
                latencyMs: Date.now() - start,
                error: err instanceof Error ? err.message : String(err),
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
