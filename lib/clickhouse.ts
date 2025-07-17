import { getHostId } from '@/lib/server-context'
import { validateTableExistence } from '@/lib/table-validator'
import type { QueryConfig } from '@/types/query-config'
import type {
  ClickHouseClient,
  ClickHouseSettings,
  DataFormat,
  QueryParams,
} from '@clickhouse/client'
import { createClient } from '@clickhouse/client'
import { createClient as createClientWeb } from '@clickhouse/client-web'
import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client'

export const DEFAULT_CLICKHOUSE_MAX_EXECUTION_TIME = '60'
export const QUERY_COMMENT = '/* { "client": "clickhouse-monitoring" } */\n'

export type ClickHouseConfig = {
  id: number
  host: string
  user: string
  password: string
  customName?: string
}

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

export const getClickHouseConfigs = (): ClickHouseConfig[] => {
  const hosts = splitByComma(process.env.CLICKHOUSE_HOST || '')
  const users = splitByComma(process.env.CLICKHOUSE_USER || '')
  const passwords = splitByComma(process.env.CLICKHOUSE_PASSWORD || '')
  const customLabels = splitByComma(process.env.CLICKHOUSE_NAME || '')

  return hosts.map((host, index) => {
    // User and password fallback to the first value,
    // supporting multiple hosts with the same user/password
    let user, password
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

export const getClient = async <B extends boolean>({
  web,
  clickhouseSettings,
  clientConfig,
  hostId,
}: {
  web?: B
  clickhouseSettings?: ClickHouseSettings
  clientConfig?: ClickHouseConfig
  hostId?: number
}): Promise<B extends true ? WebClickHouseClient : ClickHouseClient> => {
  const client = web === true ? createClientWeb : createClient
  const config = clientConfig
    ? clientConfig
    : getClickHouseConfigs()[hostId || getHostId()]

  const c = client({
    host: config.host,
    username: config.user ?? 'default',
    password: config.password ?? '',
    clickhouse_settings: {
      max_execution_time: parseInt(
        process.env.CLICKHOUSE_MAX_EXECUTION_TIME ??
          DEFAULT_CLICKHOUSE_MAX_EXECUTION_TIME
      ),
      ...clickhouseSettings,
    },
  })

  return Promise.resolve(
    c as B extends true ? WebClickHouseClient : ClickHouseClient
  )
}

export type FetchDataErrorType =
  | 'table_not_found'
  | 'validation_error'
  | 'query_error'
  | 'network_error'
  | 'permission_error'

export interface FetchDataError {
  readonly type: FetchDataErrorType
  readonly message: string
  readonly details?: {
    readonly missingTables?: readonly string[]
    readonly queryId?: string
    readonly originalError?: Error
    readonly host?: string
  }
}

export interface FetchDataResult<T> {
  readonly data: T | null
  readonly metadata: Record<string, string | number>
  readonly error?: FetchDataError
}

export const fetchData = async <
  T extends
    | unknown[]
    | object[]
    | Record<string, unknown>
    | { length: number; rows: number; statistics: Record<string, unknown> },
>({
  query,
  query_params,
  format = 'JSONEachRow',
  clickhouse_settings,
  hostId,
  queryConfig,
}: QueryParams &
  Partial<{
    clickhouse_settings: QuerySettings
    hostId?: number | string
    queryConfig?: QueryConfig
  }>): Promise<FetchDataResult<T>> => {
  const start = new Date()
  const currentHostId = hostId ? Number(hostId) : getHostId()
  const clientConfig = getClickHouseConfigs()[currentHostId]

  try {
    // Perform table validation if queryConfig is provided and query is optional
    if (queryConfig?.optional) {
      const validation = await validateTableExistence(
        queryConfig,
        currentHostId
      )

      if (!validation.shouldProceed) {
        const missingTables = validation.missingTables
        const errorMessage =
          validation.error ||
          `Missing required tables: ${missingTables.join(', ')}`

        console.warn(
          `Skipping query "${queryConfig.name}" due to missing tables:`,
          missingTables
        )

        return {
          data: null,
          metadata: {
            queryId: '',
            duration: 0,
            rows: 0,
            host: clientConfig.host,
          },
          error: {
            type: 'table_not_found',
            message: errorMessage,
            details: {
              missingTables,
              host: clientConfig.host,
            },
          },
        }
      }
    }

    const client = await getClient({
      web: false,
      clientConfig,
    })

    const effectiveQuery = queryConfig?.sql || query
    const resultSet = await client.query({
      query: QUERY_COMMENT + effectiveQuery,
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
      `--> Query (${query_id}, host: ${clientConfig.host}):`,
      effectiveQuery.replace(/(\n|\s+)/g, ' ').replace(/\s+/g, ' ')
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

    console.debug(
      `<-- Response (${query_id}):`,
      rows,
      `rows in`,
      duration,
      's\n'
    )

    const metadata = {
      queryId: query_id,
      duration,
      rows,
      host: clientConfig.host,
    }

    return { data, metadata }
  } catch (originalError) {
    const errorMessage =
      originalError instanceof Error
        ? originalError.message
        : String(originalError)

    // Categorize error types based on error message patterns
    let errorType: FetchDataErrorType = 'query_error'

    if (
      errorMessage.toLowerCase().includes('table') &&
      errorMessage.toLowerCase().includes('not') &&
      errorMessage.toLowerCase().includes('exist')
    ) {
      errorType = 'table_not_found'
    } else if (
      errorMessage.toLowerCase().includes('permission') ||
      errorMessage.toLowerCase().includes('access')
    ) {
      errorType = 'permission_error'
    } else if (
      errorMessage.toLowerCase().includes('network') ||
      errorMessage.toLowerCase().includes('connection')
    ) {
      errorType = 'network_error'
    }

    console.error(`Query failed (host: ${clientConfig.host}):`, errorMessage)

    return {
      data: null,
      metadata: {
        queryId: '',
        duration: (new Date().getTime() - start.getTime()) / 1000,
        rows: 0,
        host: clientConfig.host,
      },
      error: {
        type: errorType,
        message: errorMessage,
        details: {
          originalError:
            originalError instanceof Error ? originalError : undefined,
          host: clientConfig.host,
        },
      },
    }
  }
}

export const query = async (
  query: string,
  params: Record<string, unknown> = {},
  format: DataFormat = 'JSON'
) => {
  const client = await getClient({
    web: false,
    clickhouseSettings: {},
  })
  const resultSet = await client.query({
    query: QUERY_COMMENT + query,
    format,
    query_params: params,
  })

  return resultSet
}
