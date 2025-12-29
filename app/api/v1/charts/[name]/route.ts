/**
 * Chart-specific data endpoint
 * GET /api/v1/charts/[name]?hostId=0&interval=toStartOfTenMinutes&lastHours=24
 *
 * Returns time-series data for a specific chart
 */

import type { NextRequest } from 'next/server'
import { fetchData } from '@/lib/clickhouse'
import {
  getChartQuery,
  hasChart,
  getAvailableCharts,
  type MultiChartQueryResult,
} from '@/lib/api/chart-registry'
import type { ApiResponse as ApiResponseType, ApiError } from '@/lib/api/types'
import { ApiErrorType } from '@/lib/api/types'
import type { ClickHouseInterval } from '@/types/clickhouse-interval'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

/**
 * Handle multi-query charts (summary charts)
 * Executes multiple queries in parallel and returns combined data
 */
async function handleMultiQueryChart(
  queryDef: MultiChartQueryResult,
  hostId: number | string,
  _chartName: string
): Promise<Response> {
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
        } catch (error) {
          // For optional queries, return null instead of failing
          return {
            key: q.key,
            data: null,
            error: {
              type: ApiErrorType.QueryError,
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          }
        }
      })
    )

    // Combine results into a single object with data keyed by query key
    const combinedData: Record<string, unknown> = {}
    let hasError = false
    let firstError: ApiError | undefined

    for (const result of results) {
      combinedData[result.key] = result.data
      if (result.error && !hasError) {
        hasError = true
        firstError = result.error as ApiError
      }
    }

    // Combine SQL from all queries for display
    const combinedSql = queryDef.queries
      .map((q, i) => `-- Query ${i + 1}: ${q.key}\n${q.query.trim()}`)
      .join('\n\n')

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
  } catch (error) {
    return createErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
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
  try {
    const { name } = await params
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const hostId = searchParams.get('hostId')
    const intervalParam = searchParams.get('interval')
    const interval = intervalParam as ClickHouseInterval | undefined
    const lastHours = searchParams.get('lastHours')
      ? parseInt(searchParams.get('lastHours') || '24', 10)
      : undefined
    const paramStr = searchParams.get('params')
    const params_obj = paramStr ? JSON.parse(paramStr) : undefined

    // Validate required parameters
    if (!hostId) {
      return createErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Missing required query parameter: hostId',
        },
        400
      )
    }

    // Check if chart exists
    if (!hasChart(name)) {
      return createErrorResponse(
        {
          type: ApiErrorType.TableNotFound,
          message: `Chart not found: ${name}`,
          details: {
            availableCharts: getAvailableCharts().join(', '),
          },
        },
        404
      )
    }

    // Get chart query definition
    const queryDef = getChartQuery(name, {
      interval,
      lastHours,
      params: params_obj,
    })

    if (!queryDef) {
      return createErrorResponse(
        {
          type: ApiErrorType.QueryError,
          message: `Failed to build query for chart: ${name}`,
        },
        500
      )
    }

    // Check if this is a multi-query chart (summary charts)
    if ('queries' in queryDef) {
      return await handleMultiQueryChart(
        queryDef as MultiChartQueryResult,
        parseHostId(hostId),
        name
      )
    }

    // Execute the query
    const result = await fetchData({
      query: queryDef.query,
      query_params: queryDef.queryParams,
      hostId: parseHostId(hostId),
      format: 'JSONEachRow',
      // Use the query definition to validate optional tables if needed
      queryConfig: queryDef.optional
        ? {
            name,
            sql: queryDef.query,
            columns: [],
            tableCheck: queryDef.tableCheck,
            optional: true,
          }
        : undefined,
    })

    // Check if there was an error
    if (result.error) {
      return createErrorResponse(
        {
          type: result.error.type as ApiErrorType,
          message: result.error.message,
          details: result.error.details as Record<
            string,
            string | number | boolean | undefined
          >,
        },
        mapErrorTypeToStatusCode(result.error.type as ApiErrorType)
      )
    }

    // Create successful response with SQL from query definition
    return createSuccessResponse(
      result.data,
      result.metadata,
      queryDef.query.trim()
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return createErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: errorMessage,
        details: {
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
}

/**
 * Parse hostId from string to number
 */
function parseHostId(hostId: string): number | string {
  const parsed = parseInt(hostId, 10)
  return Number.isNaN(parsed) ? hostId : parsed
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
 * Create a success response
 */
function createSuccessResponse<T>(
  data: T,
  metadata: Record<string, string | number>,
  sql?: string
): Response {
  const response: ApiResponseType<T> = {
    success: true,
    data,
    metadata: {
      queryId: String(metadata.queryId || ''),
      duration: Number(metadata.duration || 0),
      rows: Number(metadata.rows || 0),
      host: String(metadata.host || ''),
      sql,
    },
  }

  return Response.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  })
}

/**
 * Create an error response
 */
function createErrorResponse(error: ApiError, status: number): Response {
  const response: ApiResponseType = {
    success: false,
    metadata: {
      queryId: '',
      duration: 0,
      rows: 0,
      host: 'unknown',
    },
    error,
  }

  return Response.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
