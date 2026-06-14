import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
import { getClient } from '@chm/clickhouse-client'
import { getClickHouseConfigsFromEnv } from '@/lib/api/clickhouse-config'

export const Route = createFileRoute('/api/timezone')({
  server: {
    handlers: {
      GET: async () => {
        const configs = getClickHouseConfigsFromEnv(
          env as Record<string, string | undefined>
        )

        if (configs.length === 0) {
          return Response.json({}, { status: 500 })
        }

        try {
          const client = await getClient({
            web: true,
            clientConfig: configs[0],
          })
          const resultSet = await client.query({
            query: 'SELECT timezone() AS tz',
            format: 'JSON',
          })
          // JSON format wraps rows: json<Row>() => { data: Row[], ... }
          const json = await resultSet.json<{ tz: string }>()
          const tz = json.data[0]?.tz

          if (!tz) {
            return Response.json({}, { status: 500 })
          }

          return Response.json({ tz })
        } catch {
          return Response.json({}, { status: 500 })
        }
      },
    },
  },
})
