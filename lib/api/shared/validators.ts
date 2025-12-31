/**
 * Shared Validators
 *
 * Provides common validation utilities for API requests.
 * Centralizes validation logic to ensure consistency across API routes.
 *
 * @module lib/api/shared/validators
 */

import type { DataFormat } from '@clickhouse/client'
import type { ApiError, ApiRequest } from '@/lib/api/types'
import { ApiErrorType } from '@/lib/api/types'

/**
 * Validation error with details
 */
export interface ValidationError {
  readonly field: string
  readonly message: string
  readonly value?: unknown
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  readonly valid: boolean
  readonly error?: ApiError
}

/**
 * Supported data formats for ClickHouse queries
 */
const SUPPORTED_FORMATS = ['JSONEachRow', 'JSON', 'CSV', 'TSV'] as const

/**
 * SQL injection patterns to detect and prevent
 */
const SQL_INJECTION_PATTERNS = [
  /\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE)\b/i,
  /\b(EXEC|EXECUTE|SCRIPT)\b/i,
  /--(\s|$)/,
  /\/\*/, // Block comment start
  /\*\//, // Block comment end
  /;\s*(DROP|DELETE|INSERT|UPDATE)/i,
  /';.*--/,
  /'.*OR.*'.*=.*'/i,
  /".*OR.*".*=.*"/i,
  /\bor\s+1\s*=\s*1\b/i,
  /\bunion\s+select\b/i,
]

/**
 * Type guard for supported data formats
 */
export function isSupportedFormat(format: string): format is DataFormat {
  return SUPPORTED_FORMATS.includes(format as typeof SUPPORTED_FORMATS[number])
}

/**
 * Validate and extract hostId from URL search params
 *
 * @param hostId - The hostId value from URLSearchParams (can be null)
 * @returns Parsed hostId as number
 * @throws {Error} If hostId is missing, null, or invalid
 *
 * @example
 * ```ts
 * const url = new URL(request.url)
 * const hostId = validateHostId(url.searchParams.get('hostId'))
 * // Returns: 0, 1, 2, etc.
 * // Throws: "Missing required parameter: hostId"
 * // Throws: "Invalid hostId: must be a non-negative number"
 * ```
 */
export function validateHostId(hostId: string | null): number {
  if (!hostId) {
    throw new Error('Missing required parameter: hostId')
  }

  const parsed = parseInt(hostId, 10)

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error('Invalid hostId: must be a non-negative number')
  }

  return parsed
}

/**
 * Validate SQL query for basic safety and correctness
 * Detects common SQL injection patterns and ensures the query is non-empty
 *
 * @param sql - The SQL query string to validate
 * @throws {Error} If the query contains suspicious patterns or is invalid
 *
 * @example
 * ```ts
 * // Valid queries
 * validateSqlQuery('SELECT * FROM system.users')
 * validateSqlQuery('SELECT count() FROM system.tables WHERE name = {name:String}')
 *
 * // Invalid queries - throws errors
 * validateSqlQuery('') // Throws: "SQL query cannot be empty"
 * validateSqlQuery('   ') // Throws: "SQL query cannot be empty"
 * validateSqlQuery('DROP TABLE users') // Throws: "Potentially dangerous SQL detected"
 * validateSqlQuery("SELECT * FROM users WHERE name = '' OR 1=1 --'") // Throws
 * ```
 */
export function validateSqlQuery(sql: string): void {
  // Check for empty query
  if (!sql || sql.trim().length === 0) {
    throw new Error('SQL query cannot be empty')
  }

  // Check for SQL injection patterns
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(sql)) {
      throw new Error(
        'Potentially dangerous SQL detected. Only SELECT queries are allowed.'
      )
    }
  }

  // Ensure query starts with SELECT or WITH (CTE)
  const trimmed = sql.trim().toUpperCase()
  if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH')) {
    throw new Error('Only SELECT queries are allowed')
  }
}

/**
 * Sanitize query parameters by converting values to strings and validating types
 * Removes undefined values and ensures proper types for ClickHouse parameterized queries
 *
 * @param params - Raw query parameters from request
 * @returns Sanitized parameters with string values
 *
 * @example
 * ```ts
 * sanitizeQueryParams({
 *   name: 'users',
 *   limit: 100,
 *   offset: undefined,
 *   active: true,
 * })
 * // Returns: { name: 'users', limit: '100', active: 'true' }
 * ```
 */
export function sanitizeQueryParams(
  params: Record<string, unknown>
): Record<string, string> {
  const sanitized: Record<string, string> = {}

  for (const [key, value] of Object.entries(params)) {
    // Skip undefined values
    if (value === undefined) {
      continue
    }

    // Convert null to empty string
    if (value === null) {
      sanitized[key] = ''
      continue
    }

    // Convert primitives to string
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      sanitized[key] = String(value)
      continue
    }

    // For arrays, join with commas (useful for IN clauses)
    if (Array.isArray(value)) {
      sanitized[key] = value.map((v) => String(v)).join(',')
      continue
    }

    // For objects, stringify as JSON (useful for complex parameters)
    if (typeof value === 'object') {
      sanitized[key] = JSON.stringify(value)
      continue
    }

    // Fallback: convert to string
    sanitized[key] = String(value)
  }

  return sanitized
}

// ===== Legacy validators =====

/**
 * Validate that a required string field is present and non-empty
 *
 * @example
 * ```ts
 * const error = validateRequiredString(body.query, 'query')
 * if (error) return createErrorResponse(error, 400)
 * ```
 */
export function validateRequiredString(
  value: unknown,
  fieldName: string
): ApiError | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    return {
      type: ApiErrorType.ValidationError,
      message: `Missing required field: ${fieldName}`,
    }
  }
  return undefined
}

/**
 * Validate hostId parameter (returns ApiError instead of throwing)
 *
 * @example
 * ```ts
 * const error = validateHostIdWithError(body.hostId)
 * if (error) return createErrorResponse(error, 400)
 * ```
 */
export function validateHostIdWithError(hostId: unknown): ApiError | undefined {
  if (hostId === undefined || hostId === null || hostId === '') {
    return {
      type: ApiErrorType.ValidationError,
      message: 'Missing required field: hostId',
    }
  }

  const parsed =
    typeof hostId === 'number'
      ? hostId
      : typeof hostId === 'string'
        ? parseInt(hostId, 10)
        : NaN

  if (Number.isNaN(parsed) || parsed < 0) {
    return {
      type: ApiErrorType.ValidationError,
      message: 'Invalid hostId: must be a non-negative number',
    }
  }

  return undefined
}

/**
 * Validate data format
 *
 * @example
 * ```ts
 * const error = validateFormat(format)
 * if (error) return createErrorResponse(error, 400)
 * ```
 */
export function validateFormat(format: unknown): ApiError | undefined {
  if (format === undefined || format === null) {
    return undefined // Format is optional
  }

  if (typeof format !== 'string') {
    return {
      type: ApiErrorType.ValidationError,
      message:
        'Invalid format: must be a string. Supported formats: JSONEachRow, JSON, CSV, TSV',
    }
  }

  if (!isSupportedFormat(format)) {
    return {
      type: ApiErrorType.ValidationError,
      message: 'Invalid format. Supported formats: JSONEachRow, JSON, CSV, TSV',
    }
  }

  return undefined
}

/**
 * Validate an API request body for the /api/v1/data endpoint
 *
 * @example
 * ```ts
 * const body = await request.json()
 * const error = validateDataRequest(body)
 * if (error) return createErrorResponse(error, 400)
 * ```
 */
export function validateDataRequest(
  body: Partial<ApiRequest>
): ApiError | undefined {
  // Validate required query field
  const queryError = validateRequiredString(body.query, 'query')
  if (queryError) return queryError

  // Validate required hostId field
  const hostIdError = validateHostIdWithError(body.hostId)
  if (hostIdError) return hostIdError

  // Validate optional format field
  const formatError = validateFormat(body.format)
  if (formatError) return formatError

  return undefined
}

/**
 * Validate URL search parameters for GET requests
 *
 * @example
 * ```ts
 * const url = new URL(request.url)
 * const error = validateSearchParams(url.searchParams, ['hostId', 'sql'])
 * if (error) return createErrorResponse(error, 400)
 * ```
 */
export function validateSearchParams(
  searchParams: URLSearchParams,
  requiredParams: string[]
): ApiError | undefined {
  for (const param of requiredParams) {
    const value = searchParams.get(param)
    if (!value || value.trim() === '') {
      return {
        type: ApiErrorType.ValidationError,
        message: `Missing required parameter: ${param}`,
      }
    }
  }
  return undefined
}

/**
 * Validate and parse hostId from URL search params (returns ApiError instead of throwing)
 *
 * @example
 * ```ts
 * const url = new URL(request.url)
 * const result = getAndValidateHostId(url.searchParams)
 * if (result instanceof Error) {
 *   return createErrorResponse({ type: ApiErrorType.ValidationError, message: result.message }, 400)
 * }
 * const hostId = result as number
 * ```
 */
export function getAndValidateHostId(
  searchParams: URLSearchParams
): number | ApiError {
  const hostId = searchParams.get('hostId')

  if (!hostId) {
    return {
      type: ApiErrorType.ValidationError,
      message: 'Missing required parameter: hostId',
    }
  }

  const parsed = parseInt(hostId, 10)

  if (Number.isNaN(parsed) || parsed < 0) {
    return {
      type: ApiErrorType.ValidationError,
      message: 'Invalid hostId: must be a non-negative number',
    }
  }

  return parsed
}

/**
 * Validate that a query parameter is one of the allowed values
 *
 * @example
 * ```ts
 * const error = validateEnumValue(format, ['JSONEachRow', 'JSON', 'CSV'], 'format')
 * if (error) return createErrorResponse(error, 400)
 * ```
 */
export function validateEnumValue<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string
): ApiError | undefined {
  if (value === undefined || value === null) {
    return undefined // Optional field
  }

  if (typeof value !== 'string') {
    return {
      type: ApiErrorType.ValidationError,
      message: `Invalid ${fieldName}: must be a string`,
    }
  }

  if (!allowedValues.includes(value as T)) {
    return {
      type: ApiErrorType.ValidationError,
      message: `Invalid ${fieldName}: must be one of ${allowedValues.join(', ')}`,
    }
  }

  return undefined
}
