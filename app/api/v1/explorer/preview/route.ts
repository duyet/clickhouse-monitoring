/**
 * Explorer preview endpoint
 * GET /api/v1/explorer/preview?hostId=0&database=default&table=users&limit=100
 *
 * Returns preview data (SELECT *) from a table with pagination
 */

import type { NextRequest } from 'next/server'
import type { ApiResponse } from '@/lib/api/types'

import {
  createErrorResponse as createApiErrorResponse,
  getHostIdFromParams,
  type RouteContext,
} from '@/lib/api/error-handler'
import { ApiErrorType } from '@/lib/api/types'
import { fetchData } from '@/lib/clickhouse'
import { debug, error } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT_BASE = { route: '/api/v1/explorer/preview' }

// Validation regex for identifiers (database and table names)
const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * Handle GET requests for table preview
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const routeContext: RouteContext = {
    ...ROUTE_CONTEXT_BASE,
    method: 'GET',
  }

  // Extract and validate hostId
  const hostId = getHostIdFromParams(searchParams, routeContext)

  // Extract database and table names
  const database = searchParams.get('database')
  const table = searchParams.get('table')
  const limit = searchParams.get('limit') || '100'

  debug(`[GET /api/v1/explorer/preview]`, { hostId, database, table, limit })

  // Validate database parameter
  if (!database || !VALID_IDENTIFIER.test(database)) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: 'Invalid database identifier',
        details: {
          database: database || 'missing',
        },
      },
      400,
      routeContext
    )
  }

  // Validate table parameter
  if (!table || !VALID_IDENTIFIER.test(table)) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: 'Invalid table identifier',
        details: {
          table: table || 'missing',
        },
      },
      400,
      routeContext
    )
  }

  // Validate limit parameter (must be numeric and reasonable)
  const parsedLimit = parseInt(limit, 10)
  if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 10000) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: 'Invalid limit parameter (must be between 1 and 10000)',
        details: {
          limit,
        },
      },
      400,
      routeContext
    )
  }

  // Build safe query using backticks for identifiers
  const query = `SELECT * FROM \`${database}\`.\`${table}\` LIMIT ${parsedLimit}`

  debug(`[GET /api/v1/explorer/preview] Executing query:`, { query })

  // Execute the query
  const result = await fetchData({
    query,
    hostId,
    format: 'JSONEachRow',
  })

  // Check if there was an error
  if (result.error) {
    error(`[GET /api/v1/explorer/preview] Query error:`, result.error)
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
      'Cache-Control': 'private, max-age=0',
    },
  })
}
