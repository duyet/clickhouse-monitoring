/**
 * Explorer query endpoint
 * GET /api/v1/explorer/query?hostId=0&sql=SELECT...&format=JSONEachRow&timezone=UTC
 *
 * Executes custom SQL queries from the explorer page.
 * Only SELECT queries are allowed; all queries run in readonly mode.
 */

import type { NextRequest } from 'next/server'
import type { ApiResponse } from '@/lib/api/types'

import {
  createErrorResponse as createApiErrorResponse,
  getHostIdFromParams,
  type RouteContext,
} from '@/lib/api/error-handler'
import { ApiErrorType } from '@/lib/api/types'
import { validateSqlQuery } from '@/lib/api/shared/validators/sql'
import { fetchData } from '@/lib/clickhouse'
import { debug, error } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT_BASE = { route: '/api/v1/explorer/query' }

/** Maximum allowed query length in characters */
const MAX_QUERY_LENGTH = 100_000

/**
 * Handle GET requests for custom SQL query execution
 */
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const routeContext: RouteContext = {
    ...ROUTE_CONTEXT_BASE,
    method: 'GET',
  }

  // Extract and validate hostId
  const hostId = getHostIdFromParams(searchParams, routeContext)

  // Extract query parameters
  const sql = searchParams.get('sql')
  const format = searchParams.get('format') || 'JSONEachRow'
  const timezone = searchParams.get('timezone')

  debug(`[GET /api/v1/explorer/query]`, { hostId, format, timezone })

  // Validate sql parameter is present
  if (!sql) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: 'Missing required parameter: sql',
        details: {
          sql: 'missing',
        },
      },
      400,
      routeContext
    )
  }

  // Validate query length
  if (sql.length > MAX_QUERY_LENGTH) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: `SQL query exceeds maximum length of ${MAX_QUERY_LENGTH} characters`,
        details: {
          length: sql.length,
          maxLength: MAX_QUERY_LENGTH,
        },
      },
      400,
      routeContext
    )
  }

  // Validate SQL query for safety (SELECT-only, no dangerous keywords)
  try {
    validateSqlQuery(sql)
  } catch (validationError) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message:
          validationError instanceof Error
            ? validationError.message
            : 'Invalid SQL query',
        details: {
          sql,
        },
      },
      400,
      routeContext
    )
  }

  // Validate format parameter
  const allowedFormats = ['JSONEachRow', 'JSON', 'CSV', 'TSV']
  if (!allowedFormats.includes(format)) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: `Invalid format parameter. Allowed formats: ${allowedFormats.join(', ')}`,
        details: {
          format,
        },
      },
      400,
      routeContext
    )
  }

  debug(`[GET /api/v1/explorer/query] Executing query:`, {
    sql,
    format,
    timezone,
  })

  // Build ClickHouse settings with readonly mode
  const clickhouse_settings: Record<string, string | number> = {
    readonly: 1,
  }

  if (timezone) {
    clickhouse_settings.session_timezone = timezone
  }

  // Execute the query
  const result = await fetchData({
    query: sql,
    hostId,
    format,
    clickhouse_settings,
  })

  // Check if there was an error
  if (result.error) {
    error(`[GET /api/v1/explorer/query] Query error:`, result.error)
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
