/**
 * Chart-specific data endpoint
 * GET /api/v1/charts/[name]?hostId=0&interval=toStartOfTenMinutes&lastHours=24
 *
 * Returns time-series data for a specific chart
 */

import type { NextRequest } from 'next/server'
import type {
  ApiResponse as ApiResponseType,
  DataStatus,
} from '@/lib/api/types'
import type { ClickHouseInterval } from '@/types/clickhouse-interval'

import {
  getAvailableCharts,
  getChartQuery,
  hasChart,
  type MultiChartQueryResult,
} from '@/lib/api/chart-registry'
import {
  createErrorResponse as createApiErrorResponse,
  getHostIdFromParams,
  type RouteContext,
} from '@/lib/api/error-handler'
import { transformClickHouseData } from '@/lib/api/transform-data'
import { ApiErrorType } from '@/lib/api/types'
import { fetchData } from '@/lib/clickhouse'
import {
  checkTableAvailability,
  getClickHouseVersion,
  getTableInfoMessage,
  selectQueryVariant,
} from '@/lib/clickhouse-version'
import { debug, error } from '@/lib/logger'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT_BASE = { route: '/api/v1/charts/[name]' }

/**
 * Handle multi-query charts (summary charts)
 * Executes multiple queries in parallel and returns combined data
 */
async function handleMultiQueryChart(
  queryDef: MultiChartQueryResult,
  hostId: number | string,
  chartName: string,
  routeContext: RouteContext
): Promise<Response> {
  debug(`[GET /api/v1/charts/${chartName}]`, {
    hostId,
    type: 'multi-query',
    queryCount: queryDef.queries.length,
  })

  try {
    // Execute all queries in parallel
    const results = await Promise.all(
      queryDef.queries.map(async (q) => {
        try {
          const result = await fetchData({
            query: q.query,
            hostId,
            format: 'JSONEachRow',
          })
          return {
            key: q.key,
            data: result.data || null,
            error: result.error,
          }
        } catch (err) {
          // For optional queries, return null instead of failing
          return {
            key: q.key,
            data: null,
            error: {
              type: ApiErrorType.QueryError,
              message: err instanceof Error ? err.message : 'Unknown error',
            },
          }
        }
      })
    )

    // Combine results into a single object with data keyed by query key
    const combinedData: Record<string, unknown> = {}
    let hasError = false
    let firstError:
      | {
          type: ApiErrorType
          message: string
          details?: {
            readonly [key: string]: string | number | boolean | undefined
          }
        }
      | undefined

    for (const result of results) {
      // Transform data to convert numeric strings to numbers
      combinedData[result.key] = Array.isArray(result.data)
        ? transformClickHouseData(result.data as Record<string, unknown>[])
        : result.data
      if (result.error && !hasError) {
        hasError = true
        // Convert FetchDataError to ApiError format
        firstError = {
          type: result.error.type as unknown as ApiErrorType,
          message: result.error.message,
          details: result.error.details as
            | { readonly [key: string]: string | number | boolean | undefined }
            | undefined,
        }
      }
    }

    // Combine SQL from all queries for display
    const combinedSql = queryDef.queries
      .map((q, i) => `-- Query ${i + 1}: ${q.key}\n${q.query.trim()}`)
      .join('\n\n')

    if (hasError && firstError) {
      error(`[GET /api/v1/charts/${chartName}] Multi-query error:`, firstError)
    }

    // Return combined response
    const response: ApiResponseType<Record<string, unknown>> = {
      success: !hasError,
      data: combinedData,
      metadata: {
        queryId: '',
        duration: 0,
        rows: 0,
        host: String(hostId),
        sql: combinedSql,
      },
      error: hasError ? firstError : undefined,
    }

    return Response.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    error(`[GET /api/v1/charts/${chartName}] Multi-query exception:`, err)
    return createApiErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      500,
      { ...routeContext, method: 'GET', chartName } as RouteContext & {
        chartName: string
      }
    )
  }
}

/**
 * Handle GET requests for chart data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
): Promise<Response> {
  const { name } = await params
  const { searchParams } = new URL(request.url)
  const routeContext: RouteContext & { chartName: string } = {
    ...ROUTE_CONTEXT_BASE,
    method: 'GET',
    chartName: name,
  }

  // Extract and validate hostId
  const hostId = getHostIdFromParams(searchParams, routeContext)

  // Extract optional query parameters
  const intervalParam = searchParams.get('interval')
  // Ensure empty string is treated as undefined (use chart's default interval)
  const interval = (intervalParam || undefined) as
    | ClickHouseInterval
    | undefined
  const lastHours = searchParams.get('lastHours')
    ? parseInt(searchParams.get('lastHours') || '24', 10)
    : undefined
  const paramStr = searchParams.get('params')
  const params_obj = paramStr ? JSON.parse(paramStr) : undefined

  debug(`[GET /api/v1/charts/${name}]`, { hostId, interval, lastHours })

  // Check if chart exists
  if (!hasChart(name)) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.TableNotFound,
        message: `Chart not found: ${name}`,
        details: {
          availableCharts: getAvailableCharts().join(', '),
        },
      },
      404,
      routeContext
    )
  }

  // Get chart query definition
  const queryDef = getChartQuery(name, {
    interval,
    lastHours,
    params: params_obj,
  })

  if (!queryDef) {
    error(`[GET /api/v1/charts/${name}] Failed to build query`)
    return createApiErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: `Failed to build query for chart: ${name}`,
      },
      500,
      routeContext
    )
  }

  // Check if this is a multi-query chart (summary charts)
  if ('queries' in queryDef) {
    return await handleMultiQueryChart(
      queryDef as MultiChartQueryResult,
      hostId,
      name,
      routeContext
    )
  }

  // Convert hostId to number for version check
  const numericHostId =
    typeof hostId === 'string' ? parseInt(hostId, 10) : hostId

  // Get ClickHouse version for query variant selection
  const clickhouseVersion = await getClickHouseVersion(numericHostId)

  // Select appropriate query for this ClickHouse version
  const selectedQuery = selectQueryVariant(queryDef, clickhouseVersion)

  debug(`[GET /api/v1/charts/${name}]`, {
    clickhouseVersion: clickhouseVersion?.raw,
    hasVariants: (queryDef.variants?.length ?? 0) > 0,
    queryChanged: selectedQuery !== queryDef.query,
  })

  // Check table availability for optional tables
  let statusInfo:
    | {
        status: DataStatus
        statusMessage?: string
        checkedTables?: string[]
        missingTables?: string[]
        clickhouseVersion?: string
      }
    | undefined

  if (queryDef.tableCheck) {
    // Handle tableCheck being string or string[]
    const tableToCheck = Array.isArray(queryDef.tableCheck)
      ? queryDef.tableCheck[0]
      : queryDef.tableCheck
    const [database, table] = tableToCheck?.split('.') ?? []

    if (database && table && tableToCheck) {
      const availability = await checkTableAvailability(
        numericHostId,
        database,
        table
      )

      if (!availability.exists) {
        // Table doesn't exist - return empty data with informative status
        statusInfo = {
          status: 'table_not_found',
          statusMessage: getTableInfoMessage(tableToCheck),
          checkedTables: [tableToCheck],
          missingTables: [tableToCheck],
        }

        debug(
          `[GET /api/v1/charts/${name}] Table ${tableToCheck} not found, returning empty data`
        )

        return createSuccessResponse(
          [],
          { queryId: '', duration: 0, rows: 0, host: String(hostId) },
          queryDef.query.trim(),
          statusInfo
        )
      }

      if (!availability.hasData) {
        statusInfo = {
          status: 'table_empty',
          statusMessage: `Table ${tableToCheck} exists but contains no data. The table may need time to collect metrics.`,
          checkedTables: [tableToCheck],
        }
      }
    }
  }

  // Execute the query (using version-selected query if variants exist)
  const result = await fetchData({
    query: selectedQuery,
    query_params: queryDef.queryParams,
    hostId,
    format: 'JSONEachRow',
    // Use the query definition to validate optional tables if needed
    queryConfig: queryDef.optional
      ? {
          name,
          sql: selectedQuery,
          columns: [],
          tableCheck: queryDef.tableCheck,
          optional: true,
        }
      : undefined,
  })

  // Check if there was an error
  if (result.error) {
    error(`[GET /api/v1/charts/${name}] Query error:`, result.error)
    return createApiErrorResponse(
      {
        type: result.error.type as ApiErrorType,
        message: result.error.message,
        details: result.error.details as Record<
          string,
          string | number | boolean | undefined
        >,
      },
      mapErrorTypeToStatusCode(result.error.type as ApiErrorType),
      { ...routeContext, hostId }
    )
  }

  // Update status if data is empty but we didn't already set a status
  if (
    !statusInfo &&
    (!result.data || (Array.isArray(result.data) && result.data.length === 0))
  ) {
    // Normalize tableCheck to string[] for status info
    const checkedTables = queryDef.tableCheck
      ? Array.isArray(queryDef.tableCheck)
        ? queryDef.tableCheck
        : [queryDef.tableCheck]
      : undefined

    statusInfo = {
      status: 'empty',
      statusMessage: 'Query executed successfully but returned no data.',
      checkedTables,
    }
  }

  // Create successful response with SQL from query definition
  return createSuccessResponse(
    result.data,
    result.metadata,
    selectedQuery.trim(),
    statusInfo
      ? { ...statusInfo, clickhouseVersion: clickhouseVersion?.raw }
      : clickhouseVersion
        ? {
            status: 'ok' as DataStatus,
            clickhouseVersion: clickhouseVersion.raw,
          }
        : undefined
  )
}

/**
 * Map error type to HTTP status code
 */
function mapErrorTypeToStatusCode(errorType: ApiErrorType): number {
  const statusMap: Record<ApiErrorType, number> = {
    [ApiErrorType.ValidationError]: 400,
    [ApiErrorType.PermissionError]: 403,
    [ApiErrorType.TableNotFound]: 404,
    [ApiErrorType.NetworkError]: 503,
    [ApiErrorType.QueryError]: 500,
  }

  return statusMap[errorType] || 500
}

/**
 * Extended metadata for chart responses
 */
interface ChartResponseMetadata {
  queryId: string
  duration: number
  rows: number
  host: string
  sql?: string
  status?: DataStatus
  statusMessage?: string
  checkedTables?: string[]
  missingTables?: string[]
  clickhouseVersion?: string
}

/**
 * Create a success response with detailed status information
 * Transforms numeric strings to numbers for chart rendering
 */
function createSuccessResponse<T>(
  data: T,
  metadata: Record<string, string | number>,
  sql?: string,
  statusInfo?: {
    status: DataStatus
    statusMessage?: string
    checkedTables?: string[]
    missingTables?: string[]
    clickhouseVersion?: string
  }
): Response {
  // Transform data to convert numeric strings to numbers
  // This is necessary because ClickHouse returns numbers as strings in JSON
  const transformedData = Array.isArray(data)
    ? transformClickHouseData(data as Record<string, unknown>[])
    : data

  // Determine status based on data
  const dataArray = Array.isArray(transformedData) ? transformedData : []
  const defaultStatus: DataStatus = dataArray.length > 0 ? 'ok' : 'empty'

  const responseMetadata: ChartResponseMetadata = {
    queryId: String(metadata.queryId || ''),
    duration: Number(metadata.duration || 0),
    rows: Number(metadata.rows || 0),
    host: String(metadata.host || ''),
    sql,
    status: statusInfo?.status ?? defaultStatus,
    statusMessage: statusInfo?.statusMessage,
    checkedTables: statusInfo?.checkedTables,
    missingTables: statusInfo?.missingTables,
    clickhouseVersion: statusInfo?.clickhouseVersion,
  }

  const response: ApiResponseType<T> = {
    success: true,
    data: transformedData as T,
    metadata: responseMetadata,
  }

  return Response.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  })
}
