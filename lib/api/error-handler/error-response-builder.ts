/**
 * Error Response Builder
 *
 * Builds standardized HTTP error responses with proper logging,
 * status codes, and JSON formatting.
 */

import type { ApiResponse } from '@/lib/api/types'
import type { ErrorDetails, RouteContext, StatusCodeMap } from './types'

import { ApiErrorType } from '@/lib/api/types'
import { ErrorLogger, error } from '@/lib/logger'

/**
 * Maps API error types to HTTP status codes
 */
const STATUS_CODE_MAP: StatusCodeMap = {
  [ApiErrorType.ValidationError]: 400,
  [ApiErrorType.PermissionError]: 403,
  [ApiErrorType.TableNotFound]: 404,
  [ApiErrorType.NetworkError]: 503,
  [ApiErrorType.QueryError]: 500,
} as const

/**
 * Gets the HTTP status code for a given error type
 *
 * @param errorType - The API error type
 * @returns Appropriate HTTP status code (defaults to 500)
 */
export function getStatusCodeForErrorType(errorType: ApiErrorType): number {
  return STATUS_CODE_MAP[errorType] || 500
}

/**
 * Creates a standardized error response with logging
 *
 * @param errorDetails - Error information including type, message, and details
 * @param status - HTTP status code
 * @param context - Route context for logging
 * @returns JSON Response with error information
 *
 * @example
 * ```ts
 * const response = createErrorResponse(
 *   {
 *     type: ApiErrorType.ValidationError,
 *     message: 'Missing required parameter',
 *     details: { parameter: 'hostId' }
 *   },
 *   400,
 *   { route: '/api/v1/data', method: 'GET' }
 * )
 * ```
 */
export function createErrorResponse(
  errorDetails: ErrorDetails,
  status: number,
  context?: RouteContext
): Response {
  // Log the error with context using structured logger
  ErrorLogger.logError(new Error(errorDetails.message), {
    component: `API:${context?.route || 'unknown'}`,
    action: context?.method || 'unknown',
    hostId: parseHostId(context?.hostId),
    errorType: errorDetails.type,
  })

  // Also log to console for immediate visibility during development
  error(
    `[API ${context?.method || ''} ${context?.route || ''}] ${errorDetails.message}`,
    new Error(errorDetails.message),
    {
      component: `API:${context?.route || 'unknown'}`,
      action: context?.method || 'unknown',
      errorType: errorDetails.type,
    }
  )

  // Build standardized response body
  const response: ApiResponse = {
    success: false,
    metadata: {
      queryId: '',
      duration: 0,
      rows: 0,
      host: String(context?.hostId || 'unknown'),
    },
    error: errorDetails,
  }

  // Return JSON response with appropriate status code
  return Response.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Creates a validation error response (400 status)
 *
 * @param message - Validation error message
 * @param context - Route context for logging
 * @returns 400 Bad Request response
 *
 * @example
 * ```ts
 * return createValidationError(
 *   'Missing required parameter: hostId',
 *   { route: '/api/v1/data', method: 'GET' }
 * )
 * ```
 */
export function createValidationError(
  message: string,
  context?: RouteContext
): Response {
  return createErrorResponse(
    {
      type: ApiErrorType.ValidationError,
      message,
    },
    400,
    context
  )
}

/**
 * Creates a not found error response (404 status)
 *
 * @param message - Not found error message
 * @param context - Route context for logging
 * @returns 404 Not Found response
 *
 * @example
 * ```ts
 * return createNotFoundError(
 *   'Chart not found: unknown-chart',
 *   { route: '/api/v1/charts/[name]', method: 'GET' }
 * )
 * ```
 */
export function createNotFoundError(
  message: string,
  context?: RouteContext
): Response {
  return createErrorResponse(
    {
      type: ApiErrorType.TableNotFound,
      message,
    },
    404,
    context
  )
}

/**
 * Safely parses hostId from context
 *
 * @param hostId - Host ID (string or number)
 * @returns Parsed number or undefined
 */
function parseHostId(hostId?: string | number): number | undefined {
  if (typeof hostId === 'number') {
    return hostId
  }

  if (typeof hostId === 'string') {
    const parsed = parseInt(hostId, 10)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  return undefined
}
