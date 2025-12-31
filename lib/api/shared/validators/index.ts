/**
 * Validators Module
 *
 * Shared validation utilities for API requests.
 * Centralizes validation logic to ensure consistency across API routes.
 *
 * @module lib/api/shared/validators
 */

// Type definitions
export type { ValidationError, ValidationResult } from './types'

// Host ID validators
export {
  validateHostId,
  getAndValidateHostId,
  validateHostIdWithError,
} from './host-id'

// SQL validators
export { validateSqlQuery } from './sql'

// Format validators
export { validateFormat, isSupportedFormat } from './format'

// Request validators
export {
  validateDataRequest,
  validateSearchParams,
  validateRequiredString,
  validateEnumValue,
} from './request'

// Utility functions
export { sanitizeQueryParams } from './utils'
