/**
 * Generic data endpoint for executing ClickHouse queries
 * POST /api/v1/data, GET /api/v1/data
 *
 * Accepts a query and parameters, returns data with metadata.
 * Includes caching headers for performance optimization.
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
  withApiHandler,
  type RouteContext,
} from '@/lib/api/error-handler'
import type { ApiError, ApiRequest } from '@/lib/api/types'
import { ApiErrorType } from '@/lib/api/types'
import { createSuccessResponse } from '@/lib/api/shared/response-builder'
import { mapErrorTypeToStatusCode } from '@/lib/api/shared/status-code-mapper'
import {
  getAndValidateHostId,
  validateDataRequest,
  validateSearchParams,
} from '@/lib/api/shared/validators'
import type { FetchDataError } from '@/lib/clickhouse'
import { fetchData } from '@/lib/clickhouse'
import { debug, error } from '@/lib/logger'
import { validateDashboardQuery } from './validators/dashboard-query-validator'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = { route: '/api/v1/data' }

/**
 * Handle GET requests for data fetching
 * Accepts query and parameters via URL query string
 *
 * @example
 * GET /api/v1/data?hostId=0&sql=SELECT%20count()%20FROM%20system.tables&format=JSONEachRow
 */
export const GET = withApiHandler(async (request: Request) => {
  const url = new URL(request.url)
  const searchParams = url.searchParams

  // Parse query parameters from URL
  const query =
    searchParams.get('sql') || searchParams.get('query') || undefined
  const format = searchParams.get('format') as DataFormat | null

  // Validate required parameters
  const validationError = validateSearchParams(searchParams, ['hostId'])
  if (validationError) {
    return createValidationError(validationError.message, {
      ...ROUTE_CONTEXT,
      method: 'GET',
    })
  }

  if (!query) {
    return createValidationError('Missing required parameter: sql or query', {
      ...ROUTE_CONTEXT,
      method: 'GET',
    })
  }

  // Get and validate hostId from search params
  const hostIdResult = getAndValidateHostId(searchParams)
  if (typeof hostIdResult !== 'number') {
    return createValidationError(hostIdResult.message, {
      ...ROUTE_CONTEXT,
      method: 'GET',
    })
  }
  const hostId = hostIdResult

  debug('[GET /api/v1/data]', { hostId, format: format || 'JSONEachRow' })

  // Execute the query
  const result = await fetchData({
    query,
    format: (format || 'JSONEachRow') as DataFormat,
    hostId,
  })

  // Handle errors
  if (result.error) {
    error('[GET /api/v1/data] Query error:', result.error)
    return handleQueryError(result.error, hostId, 'GET')
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
 *
 * @example
 * POST /api/v1/data
 * {
 *   "query": "SELECT count() FROM system.tables",
 *   "hostId": 0,
 *   "format": "JSONEachRow"
 * }
 */
export const POST = withApiHandler(async (request: Request) => {
  // Parse request body
  const body = (await request.json()) as Partial<ApiRequest>

  // Validate required fields using shared validator
  const validationError = validateDataRequest(body)
  if (validationError) {
    return createApiErrorResponse(validationError, 400, {
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
    const validationResult = await validateDashboardQuery(
      query,
      Number(hostId)
    )
    if (!validationResult.valid) {
      error(
        '[POST /api/v1/data] Security: Query not found in dashboard tables',
        {
          queryPreview: query.substring(0, 100),
        }
      )
      return createApiErrorResponse(
        {
          type: ApiErrorType.PermissionError,
          message: validationResult.error?.message || 'Query validation failed',
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

  // Handle errors
  if (result.error) {
    error('[POST /api/v1/data] Query error:', result.error)
    return handleQueryError(result.error, hostId, 'POST')
  }

  // Create successful response
  return createSuccessResponse(result.data, result.metadata)
}, ROUTE_CONTEXT)

/**
 * Handle query execution errors with proper status code mapping
 *
 * @param queryError - The FetchDataError returned from fetchData
 * @param hostId - The host identifier for logging
 * @param method - HTTP method for logging
 * @returns Error response with appropriate status code
 */
function handleQueryError(
  queryError: FetchDataError,
  hostId: string | number,
  method: string
): Response {
  // Map FetchDataErrorType to ApiErrorType
  const errorTypeMap: Record<FetchDataError['type'], ApiErrorType> = {
    table_not_found: ApiErrorType.TableNotFound,
    validation_error: ApiErrorType.ValidationError,
    query_error: ApiErrorType.QueryError,
    network_error: ApiErrorType.NetworkError,
    permission_error: ApiErrorType.PermissionError,
  }

  const apiErrorType = errorTypeMap[queryError.type] ?? ApiErrorType.QueryError

  return createApiErrorResponse(
    {
      type: apiErrorType,
      message: queryError.message,
      details: queryError.details as Record<
        string,
        string | number | boolean | undefined
      >,
    },
    mapErrorTypeToStatusCode(apiErrorType),
    { ...ROUTE_CONTEXT, method, hostId }
  )
}
