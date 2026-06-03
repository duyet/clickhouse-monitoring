/**
 * Notifications API endpoint
 * GET /api/v1/notifications?hostId=n
 *
 * Returns active alerts across all clusters.
 * Currently: readonly-tables warnings (via clusterAllReplicas on system.replicas).
 */

import { createFileRoute } from '@tanstack/react-router'

import type { ClickHouseConfig } from '@chm/clickhouse-client'

import { env } from 'cloudflare:workers'
import { getClient } from '@chm/clickhouse-client'

// ---------------------------------------------------------------------------
// Env helpers (mirrors healthz.ts)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Notification {
  readonly type: 'readonly-tables'
  readonly cluster: string
  readonly count: number
  readonly severity: 'critical' | 'warning'
}

interface NotificationsResponse {
  readonly notifications: readonly Notification[]
  readonly totalCount: number
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/api/v1/notifications')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const rawHostId = url.searchParams.get('hostId') ?? '0'
        const hostId = Number(rawHostId)

        if (!Number.isInteger(hostId) || hostId < 0) {
          return Response.json(
            {
              error: 'Invalid hostId parameter: must be a non-negative integer',
            },
            { status: 400 }
          )
        }

        const configs = getClickHouseConfigsFromEnv()

        if (configs.length === 0) {
          return Response.json(
            { error: 'No ClickHouse hosts configured' },
            { status: 503 }
          )
        }

        const clientConfig = configs[hostId]
        if (!clientConfig) {
          return Response.json(
            {
              error: `Invalid hostId: ${hostId}. Available host indices: 0–${configs.length - 1}`,
            },
            { status: 400 }
          )
        }

        try {
          const client = await getClient({ web: true, clientConfig })

          // Step 1: get all clusters
          const clustersResult = await client.query({
            query: `
              SELECT DISTINCT cluster
              FROM system.clusters
              ORDER BY cluster ASC
            `,
            format: 'JSONEachRow',
          })
          const clusters = (await clustersResult.json()) as Array<{
            cluster: string
          }>

          // Step 2: for each cluster check readonly replica count
          const notifications: Notification[] = []

          for (const { cluster } of clusters) {
            try {
              const readonlyResult = await client.query({
                query: `
                  SELECT COUNT() as count
                  FROM clusterAllReplicas({cluster: String}, system.replicas)
                  WHERE is_readonly = 1
                `,
                format: 'JSONEachRow',
                query_params: { cluster },
              })
              const readonlyData = (await readonlyResult.json()) as Array<{
                count?: number | string
              }>
              const readonlyCount =
                readonlyData.length > 0 && readonlyData[0].count !== undefined
                  ? Number(readonlyData[0].count)
                  : 0

              if (readonlyCount > 0) {
                notifications.push({
                  type: 'readonly-tables',
                  cluster,
                  count: readonlyCount,
                  severity: readonlyCount > 10 ? 'critical' : 'warning',
                })
              }
            } catch {
              // Skip clusters that don't support this query
            }
          }

          const totalCount = notifications.length
          const body: NotificationsResponse = { notifications, totalCount }

          return new Response(JSON.stringify(body), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              // Short cache — 30 seconds, matching the source route
              'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30',
            },
          })
        } catch (err) {
          return Response.json(
            {
              error: err instanceof Error ? err.message : 'Unknown error',
            },
            { status: 500 }
          )
        }
      },
    },
  },
})
