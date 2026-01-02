/**
 * ClickHouse Data Fetching
 * Main fetchData function for executing queries with error handling
 */

import type { DataFormat, QueryParams } from '@clickhouse/client'

import type { QueryConfig } from '@/types/query-config'
import type { FetchDataErrorType, FetchDataResult } from './types'

import { getClient } from './clickhouse-client'
import { getClickHouseConfigs } from './clickhouse-config'
import { QUERY_COMMENT } from './constants'
import {
  getClickHouseVersion,
  selectQueryVariantSemver,
  selectVersionedSql,
} from '@/lib/clickhouse-version'
import { debug, error, warn } from '@/lib/logger'
import { validateTableExistence } from '@/lib/table-validator'

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

    // Select version-appropriate query
    let effectiveQuery = query
    // Only fetch version when needed (prevents infinite recursion since
    // getClickHouseVersion itself calls fetchData without queryConfig)
    let clickhouseVersion: Awaited<ReturnType<typeof getClickHouseVersion>> =
      null

    if (queryConfig) {
      // Get ClickHouse version for query selection
      clickhouseVersion = await getClickHouseVersion(currentHostId)

      // New format: sql is an array of VersionedSql
      if (Array.isArray(queryConfig.sql)) {
        effectiveQuery = selectVersionedSql(queryConfig.sql, clickhouseVersion)

        debug(
          `[fetchData] Version selection for ${queryConfig.name}: ` +
            `detected=${clickhouseVersion?.raw ?? 'null'}, ` +
            `selected=${effectiveQuery.substring(0, 60).replace(/\s+/g, ' ')}...`
        )
      }
      // Simple string sql
      else if (typeof queryConfig.sql === 'string') {
        effectiveQuery = queryConfig.sql
      }

      // Deprecated: old variants format (backward compatibility)
      if (queryConfig.variants && queryConfig.variants.length > 0) {
        effectiveQuery = selectQueryVariantSemver(
          {
            query: typeof queryConfig.sql === 'string' ? queryConfig.sql : '',
            variants: queryConfig.variants.map((v) => ({
              versions: v.versions,
              query: v.sql,
            })),
          },
          clickhouseVersion
        )

        if (clickhouseVersion) {
          debug(
            `[fetchData] Using query for ClickHouse ${clickhouseVersion.raw} via variants (config: ${queryConfig.name})`
          )
        }
      }
    }

    const resultSet = await client.query({
      query: QUERY_COMMENT + effectiveQuery,
      format,
      query_params,
      clickhouse_settings,
    })

    const query_id = resultSet.query_id

    // Use the client's json() method which handles format-specific parsing
    const data = await resultSet.json<T>()

    // For debugging: serialize the parsed data to see what we got
    const rawText = JSON.stringify(data)
    debug(`[fetchData] ClickHouse response (${query_id}):`, {
      dataType: typeof data,
      isArray: Array.isArray(data),
      length: Array.isArray(data) ? data.length : 'N/A',
      preview: rawText.substring(0, 500),
    })

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

    const metadata: Record<string, string | number> = {
      queryId: query_id,
      duration,
      rows,
      host: clientConfig.host,
      // Include detected ClickHouse version
      clickhouseVersion: clickhouseVersion?.raw ?? 'unknown',
      // Include the actual SQL that was executed (normalized for readability)
      sql: effectiveQuery.replace(/\s+/g, ' ').trim(),
      // Include raw response for debugging (truncated if large)
      rawResponseLength: rawText.length,
      rawResponsePreview:
        rawText.length <= 500 ? rawText : rawText.substring(0, 500) + '...',
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
