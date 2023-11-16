import { createClient } from '@clickhouse/client'
import {
  Logger,
  LogParams,
  ErrorLogParams,
  ClickHouseLogLevel,
} from '@clickhouse/client'

class AppLogger implements Logger {
  trace({ module, message, args }: LogParams) {
    console.log(`[TRACE][${module}] ${message}`, args)
  }
  debug({ module, message, args }: LogParams) {
    console.log(`[DEBUG][${module}] ${message}`, args)
  }
  info({ module, message, args }: LogParams) {
    console.info(`[INFO][${module}] ${message}`, args)
  }
  warn({ module, message, args }: LogParams) {
    console.warn(`[WARN][${module}] ${message}`, args)
  }
  error({ module, message, args, err }: ErrorLogParams) {
    console.error(`[ERROR][${module}] ${message}`, args, err)
  }
}

export const getClient = () =>
  createClient({
    host: process.env.CLICKHOUSE_HOST ?? 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
    request_timeout: parseInt(process.env.CLICKHOUSE_TIMEOUT ?? '100000'),
    log: {
      level: ClickHouseLogLevel.INFO,
      LoggerClass: AppLogger,
    },
  })

export const fetchData = async (query: string) => {
  const resultSet = await getClient().query({
    query,
    format: 'JSONEachRow',
  })

  const data: any[] = []

  for await (const rows of resultSet.stream()) {
    rows.forEach((row: any) => {
      data.push(row.json())
    })
  }
  return data
}
