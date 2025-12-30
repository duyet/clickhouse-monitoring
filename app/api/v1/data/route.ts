/**
 * Generic data endpoint for executing ClickHouse queries
 * POST /api/v1/data
 *
 * Accepts a query and parameters, returns data with metadata
 * Includes caching headers for performance optimization
 *
 * SECURITY: This endpoint validates that queries being executed are either:
 * 1. Pre-defined in the chart/table registries (recommended)
 * 2. Stored in the dashboard tables (for custom dashboards)
 * This prevents clients from sending arbitrary SQL queries.
 */

import type { DataFormat } from '@clickhouse/client'
import {
  createErrorResponse as createApiErrorResponse,
  createValidationError,
  getHostIdFromParams,
  type RouteContext,
  withApiHandler,
} from '@/lib/api/error-handler'
import type { ApiError, ApiRequest, ApiResponse } from '@/lib/api/types'
import { ApiErrorType } from '@/lib/api/types'
import { fetchData } from '@/lib/clickhouse'
import { debug, error } from '@/lib/logger'

// Dashboard table names for query validation
const DASHBOARD_QUERIES_TABLE = 'system.clickhouse_monitoring_custom_dashboard'

// Cache of valid dashboard queries to avoid repeated lookups
const validDashboardQueriesCache = new Map<string, Set<string>>()
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Validate that a query exists in the dashboard tables
 * This prevents execution of arbitrary SQL from clients
 */
async function validateDashboardQuery(
  query: string,
  hostId: number
): Promise<boolean> {
  try {
    // Check cache first
    const now = Date.now()
    if (now - cacheTimestamp > CACHE_TTL) {
      validDashboardQueriesCache.clear()
      cacheTimestamp = now
    }

    const cacheKey = String(hostId)
    const cachedQueries = validDashboardQueriesCache.get(cacheKey)
    if (cachedQueries?.has(query)) {
      return true
    }

    // Query the dashboard table to verify this query exists
    const result = await fetchData({
      query: `SELECT query FROM ${DASHBOARD_QUERIES_TABLE}`,
      format: 'JSONEachRow',
      hostId,
    })

    if (result.error) {
      // Table doesn't exist or other error - fail closed
      error('[Dashboard Query Validation] Error:', result.error)
      return false
    }

    const queries = new Set<string>()
    for (const row of result.data as Array<{ query: string }>) {
      queries.add(row.query)
    }

    // Cache the results
    validDashboardQueriesCache.set(cacheKey, queries)

    // Check if the query exists in the table
    return queries.has(query)
  } catch (err) {
    error('[Dashboard Query Validation] Unexpected error:', err)
    return false
  }
}

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = { route: '/api/v1/data' }

/**
 * Handle GET requests for data fetching (for backward compatibility with client-side fetch)
 * Accepts query and parameters via URL query string
 */
export const GET = withApiHandler(async (request: Request) => {
  const url = new URL(request.url)
  const searchParams = url.searchParams

  // Parse query parameters from URL
  const query = searchParams.get('sql') || searchParams.get('query')
  const format = searchParams.get('format') as DataFormat | null

  // Validate required fields
  if (!query) {
    return createValidationError('Missing required parameter: sql or query', {
      ...ROUTE_CONTEXT,
      method: 'GET',
    })
  }

  const hostId = getHostIdFromParams(searchParams, {
    ...ROUTE_CONTEXT,
    method: 'GET',
  })

  debug('[GET /api/v1/data]', { hostId, format: format || 'JSONEachRow' })

  // Execute the query
  const result = await fetchData({
    query,
    format: format || 'JSONEachRow',
    hostId,
  })

  // Check if there was an error
  if (result.error) {
    error('[GET /api/v1/data] Query error:', result.error)
    return createErrorResponse(
      {
        type: result.error.type as ApiErrorType,
        message: result.error.message,
        details: result.error.details as Record<
          string,
          string | number | boolean
        >,
      },
      mapErrorTypeToStatusCode(result.error.type as ApiErrorType),
      { ...ROUTE_CONTEXT, method: 'GET', hostId }
    )
  }

  // Create successful response
  return createSuccessResponse(result.data, result.metadata)
}, ROUTE_CONTEXT)

/**
 * Handle POST requests for data fetching
 * Accepts query and parameters in the request body
 *
 * SECURITY: When queryConfig is not provided, validates that the query
 * exists in the dashboard tables to prevent arbitrary SQL execution.
 */
export const POST = withApiHandler(async (request: Request) => {
  // Parse request body
  const body = (await request.json()) as Partial<ApiRequest>

  // Validate required fields
  const validationError = validateApiRequest(body)
  if (validationError) {
    return createErrorResponse(validationError, 400, {
      ...ROUTE_CONTEXT,
      method: 'POST',
    })
  }

  const typedBody = body as ApiRequest
  const {
    query,
    queryParams,
    hostId,
    format = 'JSONEachRow',
    queryConfig,
  } = typedBody

  debug('[POST /api/v1/data]', {
    hostId,
    format,
    queryConfig: queryConfig?.name,
  })

  // SECURITY: If no queryConfig provided, validate the query exists in dashboard tables
  // This prevents arbitrary SQL execution from clients
  if (!queryConfig) {
    const isValidDashboardQuery = await validateDashboardQuery(
      query,
      Number(hostId)
    )
    if (!isValidDashboardQuery) {
      error(
        '[POST /api/v1/data] Security: Query not found in dashboard tables',
        {
          queryPreview: query.substring(0, 100),
        }
      )
      return createErrorResponse(
        {
          type: ApiErrorType.PermissionError,
          message:
            'Query not found in dashboard tables. Use /api/v1/charts/[name] or /api/v1/tables/[name] for registry-based queries.',
        },
        403,
        { ...ROUTE_CONTEXT, method: 'POST', hostId }
      )
    }
  }

  // Convert format string to DataFormat if needed
  const dataFormat = (format || 'JSONEachRow') as DataFormat

  // Execute the query
  const result = await fetchData({
    query,
    query_params: queryParams,
    format: dataFormat,
    hostId,
    queryConfig,
  })

  // Check if there was an error
  if (result.error) {
    error('[POST /api/v1/data] Query error:', result.error)
    return createErrorResponse(
      {
        type: result.error.type as ApiErrorType,
        message: result.error.message,
        details: result.error.details as Record<
          string,
          string | number | boolean
        >,
      },
      mapErrorTypeToStatusCode(result.error.type as ApiErrorType),
      { ...ROUTE_CONTEXT, method: 'POST', hostId }
    )
  }

  // Create successful response
  return createSuccessResponse(result.data, result.metadata)
}, ROUTE_CONTEXT)

/**
 * Validate API request body
 */
function validateApiRequest(body: Partial<ApiRequest>): ApiError | undefined {
  if (!body.query) {
    return {
      type: ApiErrorType.ValidationError,
      message: 'Missing required field: query',
    }
  }

  if (!body.hostId) {
    return {
      type: ApiErrorType.ValidationError,
      message: 'Missing required field: hostId',
    }
  }

  if (
    body.format &&
    !['JSONEachRow', 'JSON', 'CSV', 'TSV'].includes(body.format)
  ) {
    return {
      type: ApiErrorType.ValidationError,
      message: 'Invalid format. Supported formats: JSONEachRow, JSON, CSV, TSV',
    }
  }

  return undefined
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
 * Create an error response (local wrapper for backward compatibility)
 */
function createErrorResponse(
  error: ApiError,
  status: number,
  context?: RouteContext
): Response {
  return createApiErrorResponse(error, status, context)
}
