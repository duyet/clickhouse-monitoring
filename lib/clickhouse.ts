import type { ClickHouseClient, DataFormat } from '@clickhouse/client'
import { createClient } from '@clickhouse/client'
import type { ClickHouseSettings, QueryParams } from '@clickhouse/client-common'
import { createClient as createClientWeb } from '@clickhouse/client-web'
import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'
import { cache } from 'react'

const DEFAULT_CLICKHOUSE_MAX_EXECUTION_TIME = '60'

type QuerySettings = QueryParams['clickhouse_settings'] &
  Partial<{
    // @since 24.4
    query_cache_system_table_handling: 'throw' | 'save' | 'ignore'
    query_cache_nondeterministic_function_handling: 'throw' | 'save' | 'ignore'
  }>

export const getClickHouseHosts = () => {
  const hosts = (process.env.CLICKHOUSE_HOST || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)

  return hosts
}

export const getClickHouseHost = () => getClickHouseHosts()[0]

export const getClient = <B extends boolean>({
  web,
  clickhouse_settings,
}: {
  web?: B
  clickhouse_settings?: ClickHouseSettings
}): B extends true ? WebClickHouseClient : ClickHouseClient => {
  const client = web === true ? createClientWeb : createClient

  return client({
    host: getClickHouseHost(),
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
    clickhouse_settings: {
      max_execution_time: parseInt(
        process.env.CLICKHOUSE_MAX_EXECUTION_TIME ??
          DEFAULT_CLICKHOUSE_MAX_EXECUTION_TIME
      ),
      ...clickhouse_settings,
    },
  }) as B extends true ? WebClickHouseClient : ClickHouseClient
}

export const QUERY_COMMENT = '/* { "client": "clickhouse-monitoring" } */ '

export const fetchData = async <
  T extends
    | unknown[]
    | object[] // format = '*EachRow'
    | Record<string, unknown> // format = 'JSONObjectEachRow' | 'JSONColumns
    | { length: number; rows: number; statistics: Record<string, unknown> }, // format = 'JSON' | 'JSONStrings' | 'JSONCompact' | 'JSONColumnsWithMetadata' | ...
>({
  query,
  query_params,
  format = 'JSONEachRow',
  clickhouse_settings,
}: QueryParams & Partial<{ clickhouse_settings: QuerySettings }>): Promise<{
  data: T
  metadata: Record<string, string | number>
}> => {
  const start = new Date()
  const client = getClient({ web: false })

  const resultSet = await client.query({
    query: QUERY_COMMENT + query,
    format,
    query_params,
    clickhouse_settings,
  })

  const query_id = resultSet.query_id

  const data = await resultSet.json<T>()
  const end = new Date()
  const duration = (end.getTime() - start.getTime()) / 1000
  let rows: number = 0

  console.debug(
    `--> Query (${query_id}):`,
    query.replace(/(\n|\s+)/g, ' ').replace(/\s+/g, ' ')
  )

  if (data === null) {
    rows = -1
  } else if (Array.isArray(data)) {
    rows = data.length
  } else if (
    typeof data === 'object' &&
    data.hasOwnProperty('rows') &&
    data.hasOwnProperty('statistics')
  ) {
    rows = data.rows as number
  } else if (typeof data === 'object' && data.hasOwnProperty('rows')) {
    rows = data.rows as number
  }

  console.debug(`<-- Response (${query_id}):`, rows, `rows in`, duration, 's\n')

  const metadata = {
    queryId: query_id,
    duration,
    rows,
  }

  return { data, metadata }
}

export const fetchDataWithCache = () => cache(fetchData)

export const query = async (
  query: string,
  params: Record<string, unknown> = {},
  format: DataFormat = 'JSON'
) => {
  const resultSet = await getClient({ web: false }).query({
    query: QUERY_COMMENT + query,
    format,
    query_params: params,
  })

  return resultSet
}
