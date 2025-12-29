/**
 * Table data endpoint
 * GET /api/v1/tables/[name]?hostId=0&database=default&table=users
 *
 * Returns table data for a specific query configuration with optional filtering
 */

import type { NextRequest } from 'next/server'
import { fetchData } from '@/lib/clickhouse'
import {
  getTableQuery,
  hasTable,
  getAvailableTables,
  getTableConfig,
} from '@/lib/api/table-registry'
import type { ApiResponse, ApiError } from '@/lib/api/types'
import { ApiErrorType } from '@/lib/api/types'

/**
 * Handle GET requests for table data
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

    // Check if table query exists
    if (!hasTable(name)) {
      return createErrorResponse(
        {
          type: ApiErrorType.TableNotFound,
          message: `Table query configuration not found: ${name}`,
          details: {
            availableTables: getAvailableTables().join(', '),
          },
        },
        404
      )
    }

    // Convert searchParams to a plain object (excluding hostId which is handled separately)
    const searchParamsObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      if (key !== 'hostId') {
        searchParamsObj[key] = value
      }
    })

    // Get table query definition
    const queryDef = getTableQuery(name, {
      hostId: parseHostId(hostId),
      searchParams: searchParamsObj,
    })

    if (!queryDef) {
      return createErrorResponse(
        {
          type: ApiErrorType.QueryError,
          message: `Failed to build query for table: ${name}`,
        },
        500
      )
    }

    // Get the original config for optional table checks
    const config = getTableConfig(name)

    // Execute the query
    const result = await fetchData({
      query: queryDef.query,
      query_params: queryDef.queryParams,
      hostId: parseHostId(hostId),
      format: 'JSONEachRow',
      // Use the query config for optional table validation if needed
      queryConfig: config?.optional
        ? {
            name,
            sql: queryDef.query,
            columns: config.columns,
            tableCheck: config.tableCheck,
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

    // Create successful response
    return createSuccessResponse(result.data, result.metadata)
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
  metadata: Record<string, string | number>
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    metadata: {
      queryId: String(metadata.queryId || ''),
      duration: Number(metadata.duration || 0),
      rows: Number(metadata.rows || 0),
      host: String(metadata.host || ''),
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
  const response: ApiResponse = {
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
