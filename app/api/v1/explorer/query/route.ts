/**
 * Explorer query endpoint
 * GET  /api/v1/explorer/query?hostId=0&sql=SELECT...&format=JSONEachRow&timezone=UTC
 * POST /api/v1/explorer/query  (body: { sql, hostId, format?, timezone? })
 *
 * Executes custom SQL queries from the explorer page.
 * Only SELECT queries are allowed; all queries run in readonly mode.
 *
 * GET is for short, shareable queries (URL-safe limit).
 * POST is for large queries that exceed URL length limits.
 */

import type { ApiResponse } from '@/lib/api/types'

import {
  createErrorResponse as createApiErrorResponse,
  getHostIdFromParams,
  type RouteContext,
} from '@/lib/api/error-handler'
import {
  isSupportedFormat,
  SUPPORTED_FORMATS,
} from '@/lib/api/shared/validators/format'
import { validateSqlQuery } from '@/lib/api/shared/validators/sql'
import { ApiErrorType } from '@/lib/api/types'
import { fetchData } from '@/lib/clickhouse'
import { debug, error } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT_BASE = { route: '/api/v1/explorer/query' }

/** Maximum query length for GET requests (URL-safe) */
const MAX_GET_QUERY_LENGTH = 8_000

/** Maximum query length for POST requests */
const MAX_POST_QUERY_LENGTH = 100_000

/**
 * Extract the first SQL verb from a query for safe logging
 */
function getSqlVerb(sql: string): string {
  const match = sql.trim().match(/^(\w+)/i)
  return match ? match[1].toUpperCase() : 'UNKNOWN'
}

/**
 * Shared query execution logic for GET and POST handlers
 */
async function executeQuery(params: {
  sql: string
  hostId: number | string
  format: string
  timezone: string | null
  routeContext: RouteContext
  maxLength: number
}): Promise<Response> {
  const { sql, hostId, format, timezone, routeContext, maxLength } = params

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
  if (sql.length > maxLength) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: `SQL query exceeds maximum length of ${maxLength} characters`,
        details: {
          length: sql.length,
          maxLength,
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
      },
      400,
      routeContext
    )
  }

  // Validate format parameter using the shared type guard
  if (!isSupportedFormat(format)) {
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: `Invalid format parameter. Allowed formats: ${SUPPORTED_FORMATS.join(', ')}`,
        details: {
          format,
        },
      },
      400,
      routeContext
    )
  }

  debug(`[${routeContext.method} /api/v1/explorer/query] Executing query:`, {
    sqlLength: sql.length,
    sqlVerb: getSqlVerb(sql),
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

  // Execute the query — format is narrowed to DataFormat by isSupportedFormat
  const result = await fetchData({
    query: sql,
    hostId,
    format,
    clickhouse_settings,
  })

  // Check if there was an error
  if (result.error) {
    error(
      `[${routeContext.method} /api/v1/explorer/query] Query error:`,
      result.error
    )
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
 * Handle GET requests for short, shareable SQL queries
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const routeContext: RouteContext = {
    ...ROUTE_CONTEXT_BASE,
    method: 'GET',
  }

  try {
    const hostId = getHostIdFromParams(searchParams, routeContext)

    const sql = searchParams.get('sql') || ''
    const format = searchParams.get('format') || 'JSONEachRow'
    const timezone = searchParams.get('timezone')

    debug(`[GET /api/v1/explorer/query]`, { hostId, format, timezone })

    return await executeQuery({
      sql,
      hostId,
      format,
      timezone,
      routeContext,
      maxLength: MAX_GET_QUERY_LENGTH,
    })
  } catch (err) {
    error(`[GET /api/v1/explorer/query] Unexpected error:`, err)
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message:
          err instanceof Error ? err.message : 'Unexpected error occurred',
      },
      400,
      routeContext
    )
  }
}

/**
 * Handle POST requests for large SQL queries
 */
export async function POST(request: Request): Promise<Response> {
  const routeContext: RouteContext = {
    ...ROUTE_CONTEXT_BASE,
    method: 'POST',
  }

  try {
    let body: Record<string, unknown>
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return createApiErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Invalid JSON request body',
        },
        400,
        routeContext
      )
    }

    const sql = typeof body.sql === 'string' ? body.sql : ''
    const hostIdParam = body.hostId
    const format = typeof body.format === 'string' ? body.format : 'JSONEachRow'
    const timezone = typeof body.timezone === 'string' ? body.timezone : null

    // Validate hostId from body
    if (hostIdParam === undefined || hostIdParam === null) {
      return createApiErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Missing required parameter: hostId',
        },
        400,
        routeContext
      )
    }

    const hostId = Number(hostIdParam)
    if (Number.isNaN(hostId)) {
      return createApiErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: `Invalid hostId: ${String(hostIdParam)}. Must be a valid number.`,
        },
        400,
        routeContext
      )
    }

    debug(`[POST /api/v1/explorer/query]`, { hostId, format, timezone })

    return await executeQuery({
      sql,
      hostId,
      format,
      timezone,
      routeContext,
      maxLength: MAX_POST_QUERY_LENGTH,
    })
  } catch (err) {
    error(`[POST /api/v1/explorer/query] Unexpected error:`, err)
    return createApiErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message:
          err instanceof Error ? err.message : 'Unexpected error occurred',
      },
      400,
      routeContext
    )
  }
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
