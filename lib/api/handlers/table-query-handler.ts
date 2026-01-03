/**
 * Table Query Handler Factory
 *
 * Creates standardized GET handlers for table/explorer API routes.
 * Eliminates duplicate boilerplate code across routes.
 *
 * @module lib/api/handlers/table-query-handler
 */

import type { NextRequest } from 'next/server'

import {
  createErrorResponse,
  getHostIdFromParams,
  type RouteContext,
} from '@/lib/api/error-handler'
import { getTableQuery } from '@/lib/api/table-registry'
import { ApiErrorType } from '@/lib/api/types'
import { fetchData } from '@/lib/clickhouse'
import { debug, error } from '@/lib/logger'

export interface CreateTableQueryHandlerOptions {
  route: string
  queryConfigName: string
}

/**
 * Creates a standardized GET handler for table/explorer queries
 */
export function createTableQueryHandler(
  options: CreateTableQueryHandlerOptions
) {
  const { route, queryConfigName } = options

  return async function handler(request: NextRequest): Promise<Response> {
    const { searchParams } = new URL(request.url)
    const routeContext: RouteContext = {
      route,
      method: 'GET',
    }

    // Extract and validate hostId
    const hostId = getHostIdFromParams(searchParams, routeContext)

    debug(`[GET ${route}]`, { hostId })

    // Convert searchParams to a plain object (excluding hostId)
    const searchParamsObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      if (key !== 'hostId') {
        searchParamsObj[key] = value
      }
    })

    // Get query definition
    const queryDef = getTableQuery(queryConfigName, {
      hostId,
      searchParams: searchParamsObj,
    })

    if (!queryDef) {
      error(`[GET ${route}] Failed to build query`)
      return createErrorResponse(
        {
          type: ApiErrorType.QueryError,
          message: `Failed to build query for ${queryConfigName}`,
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
      error(`[GET ${route}] Query error:`, result.error)
      return createErrorResponse(
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
}

/**
 * Map error type to HTTP status code
 */
function mapErrorTypeToStatusCode(errorType: string): number {
  const statusMap: Record<string, number> = {
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
  return Response.json(
    {
      success: true,
      data,
      metadata: {
        queryId: String(metadata.queryId || ''),
        duration: Number(metadata.duration || 0),
        rows: Number(metadata.rows || 0),
        host: String(metadata.host || ''),
      },
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    }
  )
}
