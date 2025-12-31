/**
 * Format Validators
 *
 * Validation utilities for ClickHouse data format parameter.
 *
 * @module lib/api/shared/validators/format
 */

import type { DataFormat } from '@clickhouse/client'
import type { ApiError } from '@/lib/api/types'
import { ApiErrorType } from '@/lib/api/types'

/**
 * Supported data formats for ClickHouse queries
 *
 * These formats are validated against the ClickHouse client's DataFormat type.
 * JSONEachRow is the default and recommended format for most use cases.
 *
 * @constant
 * @readonly
 */
export const SUPPORTED_FORMATS = ['JSONEachRow', 'JSON', 'CSV', 'TSV'] as const

/**
 * Type guard for supported data formats
 *
 * @param format - The format string to check
 * @returns True if the format is supported, false otherwise
 *
 * @example
 * ```ts
 * isSupportedFormat('JSONEachRow') // true
 * isSupportedFormat('JSON') // true
 * isSupportedFormat('XML') // false
 * ```
 */
export function isSupportedFormat(format: string): format is DataFormat {
  return SUPPORTED_FORMATS.includes(format as typeof SUPPORTED_FORMATS[number])
}

/**
 * Validate data format parameter
 *
 * @param format - The format value to validate (can be any type)
 * @returns ApiError if validation fails, undefined otherwise
 *
 * @example
 * ```ts
 * const error = validateFormat('JSONEachRow')
 * if (error) return createErrorResponse(error, 400)
 * // No error - format is valid
 *
 * const error = validateFormat('XML')
 * if (error) return createErrorResponse(error, 400)
 * // Returns error: "Invalid format. Supported formats: ..."
 * ```
 */
export function validateFormat(format: unknown): ApiError | undefined {
  // Format is optional - undefined/null is allowed
  if (format === undefined || format === null) {
    return undefined
  }

  // Type check
  if (typeof format !== 'string') {
    return {
      type: ApiErrorType.ValidationError,
      message:
        'Invalid format: must be a string. Supported formats: JSONEachRow, JSON, CSV, TSV',
    }
  }

  // Value check
  if (!isSupportedFormat(format)) {
    return {
      type: ApiErrorType.ValidationError,
      message: 'Invalid format. Supported formats: JSONEachRow, JSON, CSV, TSV',
    }
  }

  return undefined
}
