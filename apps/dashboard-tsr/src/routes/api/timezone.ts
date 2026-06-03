import { createFileRoute } from '@tanstack/react-router'

import type { ClickHouseConfig } from '@chm/clickhouse-client'

import { env } from 'cloudflare:workers'
import { getClient } from '@chm/clickhouse-client'

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

export const Route = createFileRoute('/api/timezone')({
  server: {
    handlers: {
      GET: async () => {
        const configs = getClickHouseConfigsFromEnv()

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
