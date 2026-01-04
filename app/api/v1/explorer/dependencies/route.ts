/**
 * Explorer dependencies endpoint
 * GET /api/v1/explorer/dependencies?hostId=0&database=default&table=users&direction=upstream|downstream
 * GET /api/v1/explorer/dependencies?hostId=0&database=default&direction=database (all deps in database)
 * GET /api/v1/explorer/dependencies?hostId=0&database=default&table=dict_name&direction=dictionary (dictionary source)
 *
 * Returns dependency information for a table (upstream or downstream) or entire database
 */

import type { NextRequest } from 'next/server'
import type { ApiResponse } from '@/lib/api/types'

import {
  createErrorResponse as createApiErrorResponse,
  getHostIdFromParams,
  type RouteContext,
} from '@/lib/api/error-handler'
import { getTableQuery } from '@/lib/api/table-registry'
import { ApiErrorType } from '@/lib/api/types'
import { fetchData } from '@/lib/clickhouse'
import { debug, error } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT_BASE = { route: '/api/v1/explorer/dependencies' }

/**
 * Handle GET requests for dependencies
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const routeContext: RouteContext = {
    ...ROUTE_CONTEXT_BASE,
    method: 'GET',
  }

  // Extract and validate hostId
  const hostId = getHostIdFromParams(searchParams, routeContext)
  const direction = searchParams.get('direction') || 'downstream'

  debug(`[GET /api/v1/explorer/dependencies]`, { hostId, direction })

  // Convert searchParams to a plain object (excluding hostId and direction)
  const searchParamsObj: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key !== 'hostId' && key !== 'direction') {
      searchParamsObj[key] = value
    }
  })

  // Determine which query config to use based on direction
  let configName: string
  switch (direction) {
    case 'upstream':
      configName = 'explorer-dependencies-upstream'
      break
    case 'downstream':
      configName = 'explorer-dependencies-downstream'
      break
    case 'database':
      configName = 'explorer-database-dependencies'
      break
    case 'dictionary':
      configName = 'explorer-dictionary-source'
      break
    case 'all':
      configName = 'explorer-all-dependencies'
      break
    case 'table':
      configName = 'explorer-table-dependencies'
      break
    default:
      configName = 'explorer-dependencies-downstream'
  }

  // Get query definition
  const queryDef = getTableQuery(configName, {
    hostId,
    searchParams: searchParamsObj,
  })

  if (!queryDef) {
    error(`[GET /api/v1/explorer/dependencies] Failed to build query`)
    return createApiErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: 'Failed to build query for dependencies',
      },
      500,
      routeContext
    )
  }

  // Execute the query
  const result = await fetchData({
    query: queryDef.query,
    query_params: queryDef.queryParams,
    hostId,
    format: 'JSONEachRow',
  })

  // Check if there was an error
  if (result.error) {
    error(`[GET /api/v1/explorer/dependencies] Query error:`, result.error)
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
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  })
}
