/**
 * Table data endpoint
 * GET /api/v1/tables/[name]?hostId=0&database=default&table=users
 *
 * Returns table data for a specific query configuration with optional filtering
 */

import type { NextRequest } from 'next/server'
import {
  createErrorResponse as createApiErrorResponse,
  getHostIdFromParams,
  type RouteContext,
} from '@/lib/api/error-handler'
import {
  getAvailableTables,
  getTableConfig,
  getTableQuery,
  hasTable,
} from '@/lib/api/table-registry'
import type { ApiResponse } from '@/lib/api/types'
import { ApiErrorType } from '@/lib/api/types'
import { fetchData } from '@/lib/clickhouse'
import { debug, error } from '@/lib/logger'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT_BASE = { route: '/api/v1/tables/[name]' }

/**
 * Handle GET requests for table data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
): Promise<Response> {
  const { name } = await params
  const { searchParams } = new URL(request.url)
  const routeContext: RouteContext & { tableName: string } = {
    ...ROUTE_CONTEXT_BASE,
    method: 'GET',
    tableName: name,
  }

  // Extract and validate hostId
  const hostId = getHostIdFromParams(searchParams, routeContext)

  debug(`[GET /api/v1/tables/${name}]`, { hostId })

  // Check if table query exists
  if (!hasTable(name)) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.TableNotFound,
        message: `Table query configuration not found: ${name}`,
        details: {
          availableTables: getAvailableTables().join(', '),
        },
      },
      404,
      routeContext
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
    hostId,
    searchParams: searchParamsObj,
  })

  if (!queryDef) {
    error(`[GET /api/v1/tables/${name}] Failed to build query`)
    return createApiErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: `Failed to build query for table: ${name}`,
      },
      500,
      routeContext
    )
  }

  // Get the original config for optional table checks
  const config = getTableConfig(name)

  // Execute the query
  const result = await fetchData({
    query: queryDef.query,
    query_params: queryDef.queryParams,
    hostId,
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
    error(`[GET /api/v1/tables/${name}] Query error:`, result.error)
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

  // Create successful response
  return createSuccessResponse(result.data, result.metadata)
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
