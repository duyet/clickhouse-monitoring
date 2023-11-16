import { cache } from 'react'
import { createClient } from '@clickhouse/client'
import { Logger, LogParams, ErrorLogParams, ClickHouseLogLevel } from '@clickhouse/client'

class AppLogger implements Logger {
  trace({ module, message, args }: LogParams) {
    console.log(`[TRACE][${module}] ${message}`, args)
  }
  debug({ module, message, args }: LogParams) {
    console.log(`[${module}] ${message}`, args)
  }
  info({ module, message, args }: LogParams) {
    console.info(`[${module}] ${message}`, args)
  }
  warn({ module, message, args }: LogParams) {
    console.warn(`[${module}] ${message}`, args)
  }
  error({ module, message, args, err }: ErrorLogParams) {
    console.error(`[${module}] ${message}`, args, err)
  }
}

const clickhouseHost = process.env.CLICKHOUSE_HOST ?? 'http://localhost:8123'
console.log('clickhouseHost', clickhouseHost)

export const client = createClient({
  host: process.env.CLICKHOUSE_HOST ?? 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER ?? 'default',
  password: process.env.CLICKHOUSE_PASSWORD ?? '',
  request_timeout: parseInt(process.env.CLICKHOUSE_TIMEOUT ?? '100000'),
  log: {
    level: ClickHouseLogLevel.INFO,
    LoggerClass: AppLogger,
  },
})

export const revalidate = 60

export const fetchData = cache(async (query: string) => {
  const resultSet = await client.query({
    query,
    format: 'JSONEachRow',
  })

  const data = []

  for await (const rows of resultSet.stream()) {
    rows.forEach((row) => {
      data.push(row.json())
    })
  }
  return data
})
