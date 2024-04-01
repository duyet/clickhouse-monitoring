import type { ClickHouseClient, DataFormat } from '@clickhouse/client'
import { createClient } from '@clickhouse/client'
import type { QueryParams } from '@clickhouse/client-common'
import { createClient as createClientWeb } from '@clickhouse/client-web'
import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'
import { cache } from 'react'

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
}: {
  web?: B
}): B extends true ? WebClickHouseClient : ClickHouseClient => {
  const client = web === true ? createClientWeb : createClient

  return client({
    host: getClickHouseHost(),
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
    request_timeout: parseInt(process.env.CLICKHOUSE_TIMEOUT ?? '100000'),
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
}: QueryParams): Promise<T> => {
  const client = getClient({ web: false })
  const resultSet = await client.query({
    query: QUERY_COMMENT + query,
    format,
    query_params,
    clickhouse_settings,
  })

  const query_id = resultSet.query_id

  const data = await resultSet.json<T>()

  console.debug(
    `--> Query (${query_id}):`,
    query.replace(/(\n|\s+)/g, ' ').replace(/\s+/g, ' ')
  )

  if (data === null) {
    console.debug(`<-- Response (${query_id}):`, 'null\n')
  } else if (Array.isArray(data)) {
    console.debug(`<-- Response (${query_id}):`, data.length, 'rows\n')
  } else if (
    typeof data === 'object' &&
    data.hasOwnProperty('rows') &&
    data.hasOwnProperty('statistics')
  ) {
    console.debug(
      `<-- Response (${query_id}):`,
      data.rows || 0,
      'rows',
      JSON.stringify(data.statistics),
      '\n'
    )
  } else if (typeof data === 'object' && data.hasOwnProperty('rows')) {
    console.debug(`<-- Response (${query_id}):`, data.rows, 'rows\n')
  } else {
    console.debug(`<-- Response (${query_id}):`, data, '\n')
  }

  return data
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
