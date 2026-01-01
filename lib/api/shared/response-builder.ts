/**
 * Response Builder Utilities
 *
 * Provides standardized response building functions for API routes.
 * Extracts common patterns from existing route handlers to ensure consistency.
 *
 * @module lib/api/shared/response-builder
 */

import type {
  ApiErrorType,
  ApiResponse,
  ApiResponseMetadata,
} from '@/lib/api/types'

/**
 * Additional metadata that can be included in success responses
 */
export interface SuccessResponseMeta {
  /** SQL query that generated this response (for display purposes) */
  readonly sql?: string
  /** Number of rows returned */
  readonly rows?: number
  /** Whether the response was cached */
  readonly cached?: boolean
  /** Cache timestamp */
  readonly cachedAt?: number
  /** Query execution duration in milliseconds */
  readonly duration?: number
  /** Unique query identifier */
  readonly queryId?: string
}

/**
 * HTTP status code for the response (default: 200)
 */
export type HttpStatus = number

/**
 * Default cache control headers for API responses
 */
const DEFAULT_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
}

/**
 * Creates a standardized success response with consistent structure
 *
 * @template T - Type of data being returned
 * @param data - The response data payload
 * @param meta - Optional metadata about the response
 * @param status - HTTP status code (default: 200)
 * @param headers - Optional additional headers
 * @returns A Response object with standardized structure
 *
 * @example
 * ```ts
 * // Simple success response
 * return createSuccessResponse({ users: [] })
 *
 * // With metadata
 * return createSuccessResponse(
 *   { users: [...] },
 *   { rows: 100, sql: 'SELECT * FROM users' }
 * )
 *
 * // With custom status
 * return createSuccessResponse(
 *   { created: true },
 *   undefined,
 *   201
 * )
 * ```
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: SuccessResponseMeta,
  status: HttpStatus = 200,
  headers?: HeadersInit
): Response {
  const responseMetadata: ApiResponseMetadata = {
    queryId: meta?.queryId ? String(meta.queryId) : '',
    duration: meta?.duration ? Number(meta.duration) : 0,
    rows: meta?.rows ? Number(meta.rows) : 0,
    host: '', // Will be populated by route handler
    ...(meta?.cachedAt && { cachedAt: Number(meta.cachedAt) }),
    ...(meta?.sql && { sql: String(meta.sql) }),
  }

  const response: ApiResponse<T> = {
    success: true,
    data,
    metadata: responseMetadata,
  }

  const responseHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  }

  // Add cache headers for successful GET-like responses
  if (status >= 200 && status < 300) {
    Object.assign(responseHeaders, DEFAULT_CACHE_HEADERS)
  }

  return Response.json(response, {
    status,
    headers: responseHeaders,
  })
}

/**
 * Creates a standardized error response with proper HTTP status
 *
 * @param error - The error details including type, message, and optional details
 * @param status - HTTP status code for the error
 * @param context - Optional context information for logging (route, method, etc.)
 * @returns A Response object with error information
 *
 * @example
 * ```ts
 * // Basic error response
 * return createErrorResponse(
 *   {
 *     type: ApiErrorType.ValidationError,
 *     message: 'Invalid hostId parameter',
 *   },
 *   400
 * )
 *
 * // With additional details
 * return createErrorResponse(
 *   {
 *     type: ApiErrorType.TableNotFound,
 *     message: 'Table not found',
 *     details: { table: 'system.unknown_table', availableTables: 'a, b, c' },
 *   },
 *   404,
 *   { route: '/api/v1/charts', method: 'GET', hostId: 0 }
 * )
 * ```
 */
export function createErrorResponse(
  error: {
    readonly type: ApiErrorType
    readonly message: string
    readonly details?: {
      readonly [key: string]: string | number | boolean | undefined
    }
  },
  status: HttpStatus,
  context?: {
    readonly route?: string
    readonly method?: string
    readonly hostId?: number | string
  }
): Response {
  const response: ApiResponse = {
    success: false,
    metadata: {
      queryId: '',
      duration: 0,
      rows: 0,
      host: String(context?.hostId || 'unknown'),
    },
    error,
  }

  return Response.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Creates a response with custom caching strategy
 *
 * @template T - Type of data being returned
 * @param data - The response data payload
 * @param cacheControl - Cache-Control header value
 * @param meta - Optional metadata about the response
 * @returns A Response object with custom cache headers
 *
 * @example
 * ```ts
 * // No-cache response
 * return createCachedResponse(
 *   { data: [...] },
 *   'no-store, no-cache, must-revalidate'
 * )
 *
 * // Long cache response
 * return createCachedResponse(
 *   { data: [...] },
 *   'public, s-maxage=300, stale-while-revalidate=600'
 * )
 * ```
 */
export function createCachedResponse<T>(
  data: T,
  cacheControl: string,
  meta?: SuccessResponseMeta
): Response {
  return createSuccessResponse(data, meta, 200, {
    'Cache-Control': cacheControl,
  })
}

/**
 * Creates a JSON response without the standard API wrapper
 * Use this for simple endpoints that don't need the full ApiResponse structure
 *
 * @template T - Type of data being returned
 * @param data - The response data payload
 * @param status - HTTP status code (default: 200)
 * @returns A plain JSON Response object
 *
 * @example
 * ```ts
 * // Simple JSON response
 * return createPlainResponse({ hosts: ['0', '1', '2'] })
 * ```
 */
export function createPlainResponse<T>(
  data: T,
  status: HttpStatus = 200
): Response {
  return Response.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
