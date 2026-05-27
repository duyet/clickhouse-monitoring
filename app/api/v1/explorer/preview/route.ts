/**
 * Explorer preview endpoint
 * GET /api/v1/explorer/preview?hostId=0&database=default&table=users&limit=100
 *
 * Returns preview data (SELECT *) from a table with pagination
 */

import type { ApiResponse } from '@/lib/api/types'

import {
  createErrorResponse as createApiErrorResponse,
  getHostIdFromParams,
  type RouteContext,
} from '@/lib/api/error-handler'
import { truncateLargeValues } from '@/lib/api/shared'
import { ApiErrorType } from '@/lib/api/types'
import { fetchData } from '@/lib/clickhouse'
import { TABLES_FEATURE_PERMISSION } from '@/lib/feature-permissions/permissions'
import { authorizeFeatureRequest } from '@/lib/feature-permissions/server'
import { debug, error } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT_BASE = { route: '/api/v1/explorer/preview' }

// Validation regex for identifiers (database and table names)
const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * Return a JSON preview of rows from a specified database table using query parameters.
 *
 * Accepts the following query parameters:
 * - `hostId` (required): numeric host identifier, must be provided for all data fetching operations
 * - `database` (required): database identifier matching `^[a-zA-Z_][a-zA-Z0-9_]*$`
 * - `table` (required): table identifier matching `^[a-zA-Z_][a-zA-Z0-9_]*$`
 * - `limit` (optional): number of rows to return, defaults to `100`, must be between 1 and 10000
 * - `offset` (optional): zero-based row offset, defaults to `0`, must be an integer >= 0
 *
 * The endpoint performs a feature authorization check, validates parameters, executes a
 * `SELECT *` query with `LIMIT` and `OFFSET`, and returns either a successful preview
 * response or a structured API error response with an appropriate HTTP status code.
 *
 * @returns A Response containing an `ApiResponse` with preview rows and metadata on success,
 *          or an error `ApiResponse` with details and an appropriate HTTP status on failure.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const routeContext: RouteContext = {
    ...ROUTE_CONTEXT_BASE,
    method: 'GET',
  }
  const permissionResponse = await authorizeFeatureRequest(
    TABLES_FEATURE_PERMISSION,
    request
  )
  if (permissionResponse) return permissionResponse

  // Extract and validate hostId
  const hostId = getHostIdFromParams(searchParams, routeContext)

  // Extract database and table names
  const database = searchParams.get('database')
  const table = searchParams.get('table')
  const limit = searchParams.get('limit') || '100'
  const offset = searchParams.get('offset') || '0'

  debug(`[GET /api/v1/explorer/preview]`, {
    hostId,
    database,
    table,
    limit,
    offset,
  })

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

  const parsedOffset = parseInt(offset, 10)
  if (Number.isNaN(parsedOffset) || parsedOffset < 0 || parsedOffset > 10000) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message:
          'Invalid offset parameter (must be a non-negative integer and <= 10000)',
        details: { offset },
      },
      400,
      routeContext
    )
  }

  // Build safe query using ClickHouse placeholders
  const query =
    'SELECT * FROM {database:Identifier}.{table:Identifier} LIMIT {limit:UInt32} OFFSET {offset:UInt32}'

  debug(`[GET /api/v1/explorer/preview] Executing query:`, { query })

  // Execute the query
  const result = await fetchData({
    query,
    query_params: {
      database,
      table,
      limit: parsedLimit,
      offset: parsedOffset,
    },
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

  // Truncate large cell values to prevent browser OOM on large text/JSON columns
  const truncatedData = truncateLargeValues(result.data)

  // Create successful response
  return createSuccessResponse(truncatedData, result.metadata)
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
    [ApiErrorType.SslError]: 503,
    [ApiErrorType.TimeoutError]: 504,
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
