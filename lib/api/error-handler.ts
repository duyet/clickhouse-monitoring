/**
 * API Error Handler Middleware
 *
 * Provides consistent error handling and logging for API routes.
 * - Wraps route handlers with try-catch
 * - Logs errors with context
 * - Returns standardized error responses
 * - Maps error types to HTTP status codes
 */

import type { ApiResponse } from '@/lib/api/types'
import { ApiErrorType } from '@/lib/api/types'
import { ErrorLogger, error } from '@/lib/logger'

/**
 * API route handler with automatic error handling
 */
export type ApiHandler = (request: Request) => Promise<Response>

/**
 * Route context for logging
 */
export interface RouteContext {
  route?: string
  method?: string
  hostId?: number | string
}

/**
 * Error response with logging
 */
export function createErrorResponse(
  errorDetails: {
    type: ApiErrorType
    message: string
    details?: Record<string, string | number | boolean | undefined>
  },
  status: number,
  context?: RouteContext
): Response {
  // Log the error with context
  ErrorLogger.logError(new Error(errorDetails.message), {
    component: `API:${context?.route || 'unknown'}`,
    action: context?.method || 'unknown',
    hostId: typeof context?.hostId === 'string' ? parseInt(context.hostId, 10) : context?.hostId,
  })

  // Also log to console for immediate visibility
  error(
    `[API ${context?.method || ''} ${context?.route || ''}] ${errorDetails.message}`,
    new Error(errorDetails.message),
    {
      component: `API:${context?.route || 'unknown'}`,
      action: context?.method || 'unknown',
      errorType: errorDetails.type,
    }
  )

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

  return Response.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
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
 * Wrap an API route handler with error handling
 *
 * @example
 * ```ts
 * export const GET = withApiHandler(
 *   async (request) => {
 *     // Your route logic here
 *     return Response.json({ data: 'success' })
 *   },
 *   { route: '/api/v1/data', method: 'GET' }
 * )
 * ```
 */
export function withApiHandler(
  handler: ApiHandler,
  context?: RouteContext
): ApiHandler {
  return async (request: Request): Promise<Response> => {
    try {
      return await handler(request)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'

      // Determine error type from error message
      let errorType = ApiErrorType.QueryError

      if (err instanceof Error) {
        const message = err.message.toLowerCase()

        if (
          message.includes('permission') ||
          message.includes('access denied')
        ) {
          errorType = ApiErrorType.PermissionError
        } else if (
          message.includes('table') &&
          (message.includes('not found') ||
            message.includes("doesn't exist") ||
            message.includes('missing'))
        ) {
          errorType = ApiErrorType.TableNotFound
        } else if (
          message.includes('network') ||
          message.includes('connection') ||
          message.includes('timeout')
        ) {
          errorType = ApiErrorType.NetworkError
        } else if (
          message.includes('invalid') ||
          message.includes('missing') ||
          message.includes('required')
        ) {
          errorType = ApiErrorType.ValidationError
        }
      }

      return createErrorResponse(
        {
          type: errorType,
          message: errorMessage,
          details: {
            timestamp: new Date().toISOString(),
          },
        },
        mapErrorTypeToStatusCode(errorType),
        context
      )
    }
  }
}

/**
 * Create a standardized validation error response
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
 * Create a standardized not found error response
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
 * Extract hostId from URLSearchParams
 */
export function getHostIdFromParams(
  searchParams: URLSearchParams,
  _context?: RouteContext
): number | string {
  const hostId = searchParams.get('hostId')

  if (!hostId) {
    throw new Error('Missing required parameter: hostId')
  }

  const parsed = parseInt(hostId, 10)
  return Number.isNaN(parsed) ? hostId : parsed
}
