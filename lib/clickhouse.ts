import { createClient } from '@clickhouse/client'
import { cache } from 'react'

export const getClickHouseHosts = () => {
  const hosts = (process.env.CLICKHOUSE_HOST || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)

  return hosts
}

export const getClickHouseHost = () => getClickHouseHosts()[0]

export const getClient = () =>
  createClient({
    host: getClickHouseHost(),
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
    request_timeout: parseInt(process.env.CLICKHOUSE_TIMEOUT ?? '100000'),
  })

export const QUERY_COMMENT = '/* { "client": "clickhouse-monitoring" } */ '

export const fetchData = async (
  query: string,
  params: Record<string, unknown> = {}
) => {
  const resultSet = await getClient().query({
    query: QUERY_COMMENT + query,
    format: 'JSONEachRow',
    query_params: params,
  })

  const data: any[] = []

  for await (const rows of resultSet.stream()) {
    rows.forEach((row: any) => {
      data.push(row.json())
    })
  }
  return data
}

export const fetchDataWithCache = () => cache(fetchData)

export const query = async (
  query: string,
  params: Record<string, unknown> = {}
) => {
  const resultSet = await getClient().query({
    query: QUERY_COMMENT + query,
    format: 'JSON',
    query_params: params,
  })

  return resultSet
}
