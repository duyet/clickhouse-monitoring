/**
 * Status Code Mapper Utilities
 *
 * Maps API error types to appropriate HTTP status codes and classifies errors.
 * Provides consistent error handling across all API routes.
 *
 * @module lib/api/shared/status-code-mapper
 */

import { ApiErrorType } from '@/lib/api/types'

/**
 * Extended error type classification for more granular error handling
 */
export type ExtendedApiErrorType =
  | ApiErrorType
  | 'unknown'
  | 'timeout'
  | 'rate_limit'

/**
 * Mapping of error types to their corresponding HTTP status codes
 */
const ERROR_TYPE_STATUS_MAP: Readonly<Record<ApiErrorType, number>> = {
  [ApiErrorType.ValidationError]: 400,
  [ApiErrorType.PermissionError]: 403,
  [ApiErrorType.TableNotFound]: 404,
  [ApiErrorType.NetworkError]: 503,
  [ApiErrorType.QueryError]: 500,
} as const

/**
 * Additional status codes for extended error types
 */
const EXTENDED_STATUS_MAP: Readonly<
  Record<'timeout' | 'rate_limit' | 'unknown', number>
> = {
  timeout: 408,
  rate_limit: 429,
  unknown: 500,
} as const

/**
 * Maps an ApiErrorType to its corresponding HTTP status code
 *
 * @param errorType - The error type to map
 * @returns The appropriate HTTP status code
 *
 * @example
 * ```ts
 * mapErrorTypeToStatusCode(ApiErrorType.ValidationError) // 400
 * mapErrorTypeToStatusCode(ApiErrorType.TableNotFound) // 404
 * mapErrorTypeToStatusCode(ApiErrorType.QueryError) // 500
 * ```
 */
export function mapErrorTypeToStatusCode(errorType: ApiErrorType): number {
  return ERROR_TYPE_STATUS_MAP[errorType] ?? 500
}

/**
 * Alias for backward compatibility
 * @deprecated Use mapErrorTypeToStatusCode instead
 */
export const getStatusCodeForError = mapErrorTypeToStatusCode

/**
 * Maps an extended error type (including non-ApiErrorType) to HTTP status code
 *
 * @param errorType - The extended error type to map
 * @returns The appropriate HTTP status code (defaults to 500 for unknown types)
 *
 * @example
 * ```ts
 * mapExtendedErrorTypeToStatusCode('timeout') // 408
 * mapExtendedErrorTypeToStatusCode('rate_limit') // 429
 * mapExtendedErrorTypeToStatusCode(ApiErrorType.ValidationError) // 400
 * mapExtendedErrorTypeToStatusCode('unknown') // 500
 * ```
 */
export function mapExtendedErrorTypeToStatusCode(
  errorType: ExtendedApiErrorType
): number {
  if (errorType in ERROR_TYPE_STATUS_MAP) {
    return ERROR_TYPE_STATUS_MAP[errorType as ApiErrorType]
  }
  if (errorType in EXTENDED_STATUS_MAP) {
    return EXTENDED_STATUS_MAP[errorType as keyof typeof EXTENDED_STATUS_MAP]
  }
  return 500
}

/**
 * Classifies an error into an ApiErrorType based on error message content
 * Uses pattern matching on common error messages from ClickHouse and network errors
 *
 * @param error - Error object or error message string
 * @returns The classified ApiErrorType
 *
 * @example
 * ```ts
 * classifyError(new Error('Table system.unknown_table doesn\'t exist'))
 * // Returns: ApiErrorType.TableNotFound
 *
 * classifyError(new Error('Permission denied'))
 * // Returns: ApiErrorType.PermissionError
 *
 * classifyError(new Error('Network timeout'))
 * // Returns: ApiErrorType.NetworkError
 *
 * classifyError('Missing required parameter')
 * // Returns: ApiErrorType.ValidationError
 * ```
 */
export function classifyError(error: Error | string): ApiErrorType {
  const message = typeof error === 'string' ? error : error.message
  const lowerMessage = message.toLowerCase()

  // Check for table/database not found errors
  if (
    lowerMessage.includes('table') &&
    (lowerMessage.includes('not found') ||
      lowerMessage.includes("doesn't exist") ||
      lowerMessage.includes('missing') ||
      lowerMessage.includes('unknown table'))
  ) {
    return ApiErrorType.TableNotFound
  }

  // Check for permission/authentication errors
  if (
    lowerMessage.includes('permission') ||
    lowerMessage.includes('access denied') ||
    lowerMessage.includes('authentication') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('forbidden')
  ) {
    return ApiErrorType.PermissionError
  }

  // Check for network/connection errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('enotfound') ||
    lowerMessage.includes('etimedout')
  ) {
    return ApiErrorType.NetworkError
  }

  // Check for validation errors
  if (
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('missing required') ||
    lowerMessage.includes('required parameter') ||
    lowerMessage.includes('must be') ||
    lowerMessage.includes('expected') ||
    lowerMessage.includes('validation')
  ) {
    return ApiErrorType.ValidationError
  }

  // Check for syntax errors (classify as query error)
  if (
    lowerMessage.includes('syntax error') ||
    lowerMessage.includes('parse error') ||
    lowerMessage.includes('unexpected token')
  ) {
    return ApiErrorType.QueryError
  }

  // Default to query error for unknown errors
  return ApiErrorType.QueryError
}

/**
 * Determines if an error type should result in a client error (4xx) status
 *
 * @param errorType - The error type to check
 * @returns True if the error is a client error (4xx)
 *
 * @example
 * ```ts
 * isClientError(ApiErrorType.ValidationError) // true (400)
 * isClientError(ApiErrorType.TableNotFound) // true (404)
 * isClientError(ApiErrorType.QueryError) // false (500)
 * ```
 */
export function isClientErrorCode(errorType: ApiErrorType): boolean {
  const statusCode = mapErrorTypeToStatusCode(errorType)
  return statusCode >= 400 && statusCode < 500
}

/**
 * Determines if an error type should result in a server error (5xx) status
 *
 * @param errorType - The error type to check
 * @returns True if the error is a server error (5xx)
 *
 * @example
 * ```ts
 * isServerErrorCode(ApiErrorType.QueryError) // true (500)
 * isServerErrorCode(ApiErrorType.NetworkError) // true (503)
 * isServerErrorCode(ApiErrorType.ValidationError) // false (400)
 * ```
 */
export function isServerErrorCode(errorType: ApiErrorType): boolean {
  const statusCode = mapErrorTypeToStatusCode(errorType)
  return statusCode >= 500 && statusCode < 600
}

/**
 * Gets a human-readable description for an error type
 * Useful for error messages and documentation
 *
 * @param errorType - The error type to describe
 * @returns A human-readable description of the error
 *
 * @example
 * ```ts
 * getErrorDescription(ApiErrorType.ValidationError)
 * // Returns: "Invalid request parameters or data format"
 *
 * getErrorDescription(ApiErrorType.TableNotFound)
 * // Returns: "Requested table or resource does not exist"
 * ```
 */
export function getErrorDescription(errorType: ApiErrorType): string {
  const descriptions: Readonly<Record<ApiErrorType, string>> = {
    [ApiErrorType.ValidationError]: 'Invalid request parameters or data format',
    [ApiErrorType.PermissionError]:
      'Insufficient permissions to access the requested resource',
    [ApiErrorType.TableNotFound]: 'Requested table or resource does not exist',
    [ApiErrorType.NetworkError]:
      'Network connection error or service unavailable',
    [ApiErrorType.QueryError]: 'Error executing the database query',
  } as const

  return descriptions[errorType] ?? 'Unknown error'
}

// ===== Legacy status code utilities =====

/**
 * Type guard to check if a number is a valid HTTP status code
 *
 * @example
 * ```ts
 * if (isValidStatusCode(404)) {
 *   // Handle 404
 * }
 * ```
 */
export function isValidStatusCode(status: number): boolean {
  return (
    typeof status === 'number' &&
    status >= 100 &&
    status < 600 &&
    Number.isInteger(status)
  )
}

/**
 * Check if a status code represents a successful response
 *
 * @example
 * ```ts
 * if (isSuccessStatusCode(200)) {
 *   // Handle success
 * }
 * ```
 */
export function isSuccessStatusCode(status: number): boolean {
  return status >= 200 && status < 300
}

/**
 * Check if a status code represents a client error (by status code)
 *
 * @example
 * ```ts
 * if (isClientError(400)) {
 *   // Handle client error
 * }
 * ```
 */
export function isClientError(status: number): boolean {
  return status >= 400 && status < 500
}

/**
 * Check if a status code represents a server error (by status code)
 *
 * @example
 * ```ts
 * if (isServerError(500)) {
 *   // Handle server error
 * }
 * ```
 */
export function isServerError(status: number): boolean {
  return status >= 500 && status < 600
}

/**
 * Common HTTP status codes
 */
export const HttpStatusCode = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const
