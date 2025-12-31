/**
 * Validator Type Definitions
 *
 * Common types used across all validators.
 *
 * @module lib/api/shared/validators/types
 */

import type { ApiError } from '@/lib/api/types'

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
