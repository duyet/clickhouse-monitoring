import { createFileRoute } from '@tanstack/react-router'

import type { ClickHouseConfig } from '@chm/clickhouse-client'

import { env } from 'cloudflare:workers'
// Public client factory. We pass `web: true` so it always uses
// @clickhouse/client-web (fetch-based) and never touches the node
// @clickhouse/client (node:os/node:stream/TCP) — excluded from the worker
// bundle in vite.config.ts.
import { getClient } from '@chm/clickhouse-client'

// Mirrors @chm/clickhouse-client getClickHouseConfigs(), but sources the
// comma-separated lists from the Cloudflare env binding (workerd does not map
// arbitrary bindings onto process.env) instead of process.env.
function splitByComma(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getClickHouseConfigsFromEnv(): ClickHouseConfig[] {
  const bindings = env as Record<string, string | undefined>

  const hosts = splitByComma(bindings.CLICKHOUSE_HOST)
  const users = splitByComma(bindings.CLICKHOUSE_USER)
  const passwords = splitByComma(bindings.CLICKHOUSE_PASSWORD)
  const customLabels = splitByComma(bindings.CLICKHOUSE_NAME)

  return hosts.map((host, index) => {
    // User/password fall back to the first entry so a single credential pair
    // can serve many hosts — identical to getClickHouseConfigs().
    let user: string
    let password: string
    if (users.length === 1 && passwords.length === 1) {
      user = users[0]
      password = passwords[0]
    } else {
      user = users[index] || 'default'
      password = passwords[index] || ''
    }

    return {
      id: index,
      host,
      user,
      password,
      customName: customLabels[index],
    }
  })
}

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
        const configs = getClickHouseConfigsFromEnv()

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
