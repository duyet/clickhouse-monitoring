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
  createCachedResponse,
  createErrorResponse,
  createPlainResponse,
  createSuccessResponse,
  type HttpStatus,
  type SuccessResponseMeta,
} from './response-builder'
// Status code mapping
export {
  classifyError,
  type ExtendedApiErrorType,
  getErrorDescription,
  getStatusCodeForError,
  HttpStatusCode,
  isClientError,
  isClientErrorCode,
  isServerError,
  isServerErrorCode,
  isSuccessStatusCode,
  isValidStatusCode,
  mapErrorTypeToStatusCode,
  mapExtendedErrorTypeToStatusCode,
} from './status-code-mapper'
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
