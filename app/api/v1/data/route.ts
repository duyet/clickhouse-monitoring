/**
 * Generic data endpoint for executing ClickHouse queries
 * POST /api/v1/data
 *
 * Accepts a query and parameters, returns data with metadata
 * Includes caching headers for performance optimization
 */

import { fetchData } from '@/lib/clickhouse'
import type { ApiRequest, ApiResponse, ApiError } from '@/lib/api/types'
import { ApiErrorType } from '@/lib/api/types'
import type { DataFormat } from '@clickhouse/client'
import {
  withApiHandler,
  createValidationError,
  createErrorResponse as createApiErrorResponse,
  getHostIdFromParams,
  type RouteContext,
} from '@/lib/api/error-handler'
import { debug, error } from '@/lib/logger'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = { route: '/api/v1/data' }

/**
 * Handle GET requests for data fetching (for backward compatibility with client-side fetch)
 * Accepts query and parameters via URL query string
 */
export const GET = withApiHandler(
  async (request: Request) => {
    const url = new URL(request.url)
    const searchParams = url.searchParams

    // Parse query parameters from URL
    const query = searchParams.get('sql') || searchParams.get('query')
    const format = searchParams.get('format') as DataFormat | null

    // Validate required fields
    if (!query) {
      return createValidationError(
        'Missing required parameter: sql or query',
        { ...ROUTE_CONTEXT, method: 'GET' }
      )
    }

    const hostId = getHostIdFromParams(searchParams, { ...ROUTE_CONTEXT, method: 'GET' })

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
  },
  ROUTE_CONTEXT
)

/**
 * Handle POST requests for data fetching
 * Accepts query and parameters in the request body
 */
export const POST = withApiHandler(
  async (request: Request) => {
    // Parse request body
    const body = (await request.json()) as Partial<ApiRequest>

    // Validate required fields
    const validationError = validateApiRequest(body)
    if (validationError) {
      return createErrorResponse(
        validationError,
        400,
        { ...ROUTE_CONTEXT, method: 'POST' }
      )
    }

    const typedBody = body as ApiRequest
    const {
      query,
      queryParams,
      hostId,
      format = 'JSONEachRow',
      queryConfig,
    } = typedBody

    debug('[POST /api/v1/data]', { hostId, format, queryConfig: queryConfig?.name })

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
  },
  ROUTE_CONTEXT
)

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
