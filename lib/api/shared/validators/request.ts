/**
 * Request Validators
 *
 * Validation utilities for API request bodies and search parameters.
 *
 * @module lib/api/shared/validators/request
 */

import type { ApiError, ApiRequest } from '@/lib/api/types'
import { ApiErrorType } from '@/lib/api/types'
import { validateHostIdWithError } from './host-id'
import { validateFormat } from './format'

/**
 * Validate that a required string field is present and non-empty
 *
 * @param value - The value to validate
 * @param fieldName - The name of the field for error messages
 * @returns ApiError if validation fails, undefined otherwise
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
 * Validate an API request body for the /api/v1/data endpoint
 *
 * Validates that required fields (query, hostId) are present and valid.
 * Optionally validates the format field if provided.
 *
 * @param body - Partial API request body to validate
 * @returns ApiError if validation fails, undefined otherwise
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
 * Ensures that all required parameters are present and non-empty.
 *
 * @param searchParams - URLSearchParams object from request URL
 * @param requiredParams - Array of required parameter names
 * @returns ApiError if validation fails, undefined otherwise
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
 * Validate that a query parameter is one of the allowed values
 *
 * Generic validator for enum-like parameters. Useful for validating
 * formats, sort orders, and other finite-value parameters.
 *
 * @param value - The value to validate
 * @param allowedValues - Array of allowed string values
 * @param fieldName - The name of the field for error messages
 * @returns ApiError if validation fails, undefined otherwise
 *
 * @example
 * ```ts
 * const error = validateEnumValue(format, ['JSONEachRow', 'JSON', 'CSV'], 'format')
 * if (error) return createErrorResponse(error, 400)
 *
 * const error = validateEnumValue(order, ['asc', 'desc'], 'order')
 * if (error) return createErrorResponse(error, 400)
 * ```
 */
export function validateEnumValue<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string
): ApiError | undefined {
  // Optional field - undefined/null is allowed
  if (value === undefined || value === null) {
    return undefined
  }

  // Type check
  if (typeof value !== 'string') {
    return {
      type: ApiErrorType.ValidationError,
      message: `Invalid ${fieldName}: must be a string`,
    }
  }

  // Value check
  if (!allowedValues.includes(value as T)) {
    return {
      type: ApiErrorType.ValidationError,
      message: `Invalid ${fieldName}: must be one of ${allowedValues.join(', ')}`,
    }
  }

  return undefined
}
