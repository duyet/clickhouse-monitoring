/**
 * Shared API Utilities
 *
 * Barrel export for all shared API utilities.
 */

// Response builders
export {
  createCachedResponse,
  createErrorResponse,
  createPlainResponse,
  createSuccessResponse,
  type HttpStatus,
  type SuccessResponseMeta,
} from './response-builder'
// Status code mapping
export { mapErrorTypeToStatusCode } from './status-code-mapper'
// Validators
export {
  getAndValidateHostId,
  isSupportedFormat,
  sanitizeQueryParams,
  type ValidationError,
  type ValidationResult,
  validateDataRequest,
  validateEnumValue,
  validateFormat,
  validateHostId,
  validateHostIdWithError,
  validateRequiredString,
  validateSearchParams,
  validateSqlQuery,
} from './validators'
