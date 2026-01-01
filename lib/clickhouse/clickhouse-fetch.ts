/**
 * ClickHouse Data Fetching
 * Main fetchData function for executing queries with error handling
 */

import type { DataFormat, QueryParams } from '@clickhouse/client'
import { debug, error, warn } from '@/lib/logger'
import { validateTableExistence } from '@/lib/table-validator'
import {
  getClickHouseVersion,
  selectQueryVariantSemver,
} from '@/lib/clickhouse-version'
import type { QueryConfig } from '@/types/query-config'
import { getClient } from './clickhouse-client'
import { getClickHouseConfigs } from './clickhouse-config'
import { QUERY_COMMENT } from './constants'
import type { FetchDataErrorType, FetchDataResult } from './types'

/**
 * Fetch data from ClickHouse with comprehensive error handling
 */
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
}: QueryParams & {
  hostId: number | string
  clickhouse_settings?: QueryParams['clickhouse_settings']
  queryConfig?: QueryConfig
}): Promise<FetchDataResult<T>> => {
  const start = new Date()

  // Parse and validate hostId to prevent NaN
  const currentHostId = Number(hostId)
  if (Number.isNaN(currentHostId)) {
    throw new Error(`Invalid hostId: ${hostId}. Must be a valid number.`)
  }

  const configs = getClickHouseConfigs()

  // Check if any configs are available
  if (configs.length === 0) {
    const errorMessage =
      'No ClickHouse hosts configured. Please set CLICKHOUSE_HOST environment variable.\n' +
      'Example: CLICKHOUSE_HOST=http://localhost:8123\n' +
      'See console logs for more details.'

    error('[fetchData] No ClickHouse configurations available!')
    error('[fetchData] Make sure environment variables are loaded.')
    error(
      '[fetchData] Check .env, .env.local, or deployment environment settings.'
    )

    return {
      data: null,
      metadata: {
        queryId: '',
        duration: 0,
        rows: 0,
        host: 'unknown',
      },
      error: {
        type: 'validation_error',
        message: errorMessage,
        details: {
          originalError: new Error(errorMessage),
          host: 'unknown',
        },
      },
    }
  }

  const clientConfig = configs[currentHostId]

  // Check if clientConfig exists before using it
  if (!clientConfig) {
    const availableHosts = configs.map((c) => c.id).join(', ')
    const errorMessage = `Invalid hostId: ${currentHostId}. Available hosts: ${availableHosts} (total: ${configs.length})`

    error('[fetchData]', errorMessage)

    return {
      data: null,
      metadata: {
        queryId: '',
        duration: 0,
        rows: 0,
        host: 'unknown',
      },
      error: {
        type: 'validation_error',
        message: errorMessage,
        details: {
          originalError: new Error(errorMessage),
          host: 'unknown',
        },
      },
    }
  }

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

        warn(
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

    // getClient will auto-detect and use web client for Cloudflare Workers
    // Cloudflare Workers don't support Node.js APIs like https.request
    const client = await getClient({
      clientConfig,
    })

    // Select version-appropriate query if variants are defined
    let effectiveQuery = queryConfig?.sql || query

    if (queryConfig?.variants && queryConfig.variants.length > 0) {
      // Get ClickHouse version for this host (cached)
      const version = await getClickHouseVersion(currentHostId)

      // Select the appropriate query variant based on version
      effectiveQuery = selectQueryVariantSemver(
        {
          query: queryConfig.sql,
          variants: queryConfig.variants.map((v) => ({
            versions: v.versions,
            query: v.sql,
          })),
        },
        version
      )

      if (version) {
        debug(
          `[fetchData] Using query for ClickHouse ${version.raw} (config: ${queryConfig.name})`
        )
      }
    }

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

    debug(
      `--> Query (${query_id}, host: ${clientConfig.host}):`,
      effectiveQuery.replace(/(\n|\s+)/g, ' ').replace(/\s+/g, ' ')
    )

    if (data === null) {
      rows = -1
    } else if (Array.isArray(data)) {
      rows = data.length
    } else if (
      typeof data === 'object' &&
      Object.hasOwn(data, 'rows') &&
      Object.hasOwn(data, 'statistics')
    ) {
      rows = data.rows as number
    } else if (typeof data === 'object' && Object.hasOwn(data, 'rows')) {
      rows = data.rows as number
    }

    debug(`<-- Response (${query_id}):`, { rows, duration, unit: 's' })

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

    error(`Query failed (host: ${clientConfig.host}):`, errorMessage)

    return {
      data: null,
      metadata: {
        queryId: '',
        duration: (Date.now() - start.getTime()) / 1000,
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

/**
 * Simple query helper for basic queries
 */
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
