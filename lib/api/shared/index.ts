/**
 * Shared API Utilities
 *
 * Barrel export for all shared API utilities.
 * Import from this module for access to response builders, validators, and status code mapping.
 *
 * @module lib/api/shared
 *
 * @example
 * ```ts
 * import {
 *   createSuccessResponse,
 *   createErrorResponse,
 *   validateHostId,
 *   validateSqlQuery,
 *   sanitizeQueryParams,
 *   mapErrorTypeToStatusCode,
 *   classifyError,
 * } from '@/lib/api/shared'
 * ```
 */

// Response builders
export {
  createSuccessResponse,
  createErrorResponse,
  createCachedResponse,
  createPlainResponse,
  type SuccessResponseMeta,
  type HttpStatus,
} from './response-builder'

// Status code mapping
export {
  mapErrorTypeToStatusCode,
  mapExtendedErrorTypeToStatusCode,
  classifyError,
  isClientErrorCode,
  isServerErrorCode,
  getErrorDescription,
  getStatusCodeForError,
  isValidStatusCode,
  isSuccessStatusCode,
  isClientError,
  isServerError,
  HttpStatusCode,
  type ExtendedApiErrorType,
} from './status-code-mapper'

// Validators
export {
  validateHostId,
  validateSqlQuery,
  sanitizeQueryParams,
  validateRequiredString,
  validateHostIdWithError,
  validateFormat,
  validateDataRequest,
  validateSearchParams,
  getAndValidateHostId,
  validateEnumValue,
  isSupportedFormat,
  type ValidationError,
  type ValidationResult,
} from './validators'
