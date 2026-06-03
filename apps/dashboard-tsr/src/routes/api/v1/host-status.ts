import { createFileRoute } from '@tanstack/react-router'

import type { ClickHouseConfig } from '@chm/clickhouse-client'

import { env } from 'cloudflare:workers'
import { getClient } from '@chm/clickhouse-client'

const QUERY_COMMENT = '/* { "client": "clickhouse-monitoring" } */\n'

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

export const Route = createFileRoute('/api/v1/host-status')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const searchParams = new URL(request.url).searchParams
        const hostIdRaw = searchParams.get('hostId')

        if (hostIdRaw === null || hostIdRaw === '') {
          return Response.json(
            { success: false, error: 'hostId query parameter is required' },
            { status: 400 }
          )
        }

        const hostId = Number(hostIdRaw)
        if (!Number.isInteger(hostId) || hostId < 0) {
          return Response.json(
            { success: false, error: 'hostId must be a non-negative integer' },
            { status: 400 }
          )
        }

        const configs = getClickHouseConfigsFromEnv()

        if (hostId >= configs.length) {
          return Response.json(
            {
              success: false,
              error: `hostId ${hostId} is out of range (${configs.length} host(s) configured)`,
            },
            { status: 400 }
          )
        }

        const clientConfig = configs[hostId]

        try {
          const client = await getClient({ web: true, clientConfig })
          const resultSet = await client.query({
            query: `${QUERY_COMMENT}SELECT
  version() AS version,
  formatReadableTimeDelta(uptime()) AS uptime,
  hostName() AS hostname`,
            format: 'JSONEachRow',
          })

          // JSONEachRow returns rows directly: json<Row>() => Row[]
          const rows = await resultSet.json<{
            version: string
            uptime: string
            hostname: string
          }>()

          const data = rows[0]
          const version = data?.version ?? ''
          const uptime = data?.uptime ?? ''
          const hostname = data?.hostname ?? ''

          return Response.json({
            success: true,
            data: { version, uptime, hostname },
          })
        } catch (error) {
          console.error('Host status API error:', error)
          return Response.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch host status',
            },
            { status: 500 }
          )
        }
      },
    },
  },
})
