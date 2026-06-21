import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
import { getClient } from '@chm/clickhouse-client'
import { error } from '@chm/logger'
import { getClickHouseConfigsFromEnv } from '@/lib/api/clickhouse-config'
import {
  classifyError,
  getStatusCodeForErrorType,
} from '@/lib/api/error-handler'

const QUERY_COMMENT = '/* { "client": "clickhouse-monitoring" } */\n'

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

        const configs = getClickHouseConfigsFromEnv(
          env as Record<string, string | undefined>
        )

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
        } catch (err) {
          error('[GET /api/v1/host-status] Error:', err)
          // An unreachable upstream is a 503/504, not a 500.
          const { type, message } = classifyError(err)
          return Response.json(
            {
              success: false,
              error: message || 'Failed to fetch host status',
            },
            { status: getStatusCodeForErrorType(type) }
          )
        }
      },
    },
  },
})
