import type { ClickHouseClient, DataFormat } from '@clickhouse/client'
import { createClient } from '@clickhouse/client'
import type { ClickHouseSettings } from '@clickhouse/client-common'
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

export const getClient = <B extends boolean>(
  web?: B
): B extends true ? WebClickHouseClient : ClickHouseClient => {
  const client = web ? createClientWeb : createClient

  return client({
    host: getClickHouseHost(),
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
    request_timeout: parseInt(process.env.CLICKHOUSE_TIMEOUT ?? '100000'),
  }) as B extends true ? WebClickHouseClient : ClickHouseClient
}

export const QUERY_COMMENT = '/* { "client": "clickhouse-monitoring" } */ '

export const fetchData = async (
  query: string,
  params: Record<string, unknown> = {},
  format: DataFormat = 'JSONEachRow',
  clickhouse_settings: ClickHouseSettings = {}
) => {
  const sql = QUERY_COMMENT + query

  const resultSet = await getClient(false).query({
    query: sql,
    format,
    query_params: params,
    clickhouse_settings,
  })

  const query_id = resultSet.query_id
  const data: any[] = await resultSet.json()
  console.debug(`--> Query (${query_id}):`, sql)
  console.debug(`<-- Response (${query_id}):`, data.length, 'rows\n')

  return data
}

export const fetchDataWithCache = () => cache(fetchData)

export const query = async (
  query: string,
  params: Record<string, unknown> = {},
  format: DataFormat = 'JSON'
) => {
  const resultSet = await getClient().query({
    query: QUERY_COMMENT + query,
    format,
    query_params: params,
  })

  return resultSet
}
