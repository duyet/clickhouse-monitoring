import { getHostIdCookie } from '@/lib/scoped-link'
import { getHostId } from '@/lib/server-context'
import type { ClickHouseClient, DataFormat } from '@clickhouse/client'
import { createClient } from '@clickhouse/client'
import type { ClickHouseSettings, QueryParams } from '@clickhouse/client-common'
import { createClient as createClientWeb } from '@clickhouse/client-web'
import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'

export const DEFAULT_CLICKHOUSE_MAX_EXECUTION_TIME = '60'
export const QUERY_COMMENT = '/* { "client": "clickhouse-monitoring" } */ '

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

function splitByComma(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const getClickHouseConfigs = () => {
  const hosts = splitByComma(process.env.CLICKHOUSE_HOST || '')
  const users = splitByComma(process.env.CLICKHOUSE_USER || '')
  const passwords = splitByComma(process.env.CLICKHOUSE_PASSWORD || '')
  const customLabels = splitByComma(process.env.CLICKHOUSE_NAME || '')

  return hosts.map((host, index) => {
    return {
      host,
      user: users[index] || 'default',
      password: passwords[index] || '',
      customName: customLabels[index],
    }
  })
}

export const getClickHouseHost = () => {
  const hostId = parseInt(getHostId() || '0')

  return getClickHouseConfigs()[hostId]
}

export const getClient = <B extends boolean>({
  web,
  clickhouse_settings,
  forceHostId,
}: {
  web?: B
  clickhouse_settings?: ClickHouseSettings
  forceHostId?: number
}): B extends true ? WebClickHouseClient : ClickHouseClient => {
  const client = web === true ? createClientWeb : createClient

  const currentConfig = forceHostId
    ? getClickHouseConfigs()[forceHostId]
    : getClickHouseConfigs()[Number(getHostIdCookie())]

  return client({
    host: currentConfig.host,
    username: currentConfig.user ?? 'default',
    password: currentConfig.password ?? '',
    clickhouse_settings: {
      max_execution_time: parseInt(
        process.env.CLICKHOUSE_MAX_EXECUTION_TIME ??
          DEFAULT_CLICKHOUSE_MAX_EXECUTION_TIME
      ),
      ...clickhouse_settings,
    },
  }) as B extends true ? WebClickHouseClient : ClickHouseClient
}

export const fetchData = async <
  T extends
    | unknown[]
    | object[] // format = '*EachRow'
    | Record<string, unknown> // format = 'JSONObjectEachRow' | 'JSONColumns
    | { length: number; rows: number; statistics: Record<string, unknown> }, // format = 'JSON' | 'JSONStrings' | 'JSONCompact' | 'JSONColumnsWithMetadata' | ...
>(
  {
    query,
    query_params,
    format = 'JSONEachRow',
    clickhouse_settings,
  }: QueryParams &
    Partial<{
      clickhouse_settings: QuerySettings
    }>,
  forceHostId?: number | string
): Promise<{
  data: T
  metadata: Record<string, string | number>
}> => {
  const start = new Date()
  const client = getClient({
    web: false,
    forceHostId: forceHostId ? Number(forceHostId) : undefined,
  })

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

export const query = async (
  query: string,
  params: Record<string, unknown> = {},
  format: DataFormat = 'JSON'
) => {
  const resultSet = await getClient({
    web: false,
    clickhouse_settings: {},
  }).query({
    query: QUERY_COMMENT + query,
    format,
    query_params: params,
  })

  return resultSet
}
