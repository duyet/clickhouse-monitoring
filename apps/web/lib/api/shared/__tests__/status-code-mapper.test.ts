/**
 * Tests for lib/api/shared/status-code-mapper.ts
 */

import { mapErrorTypeToStatusCode } from '../status-code-mapper'
import { describe, expect, it } from 'bun:test'
import { ApiErrorType } from '@/lib/api/types'

describe('status-code-mapper', () => {
  describe('mapErrorTypeToStatusCode', () => {
    it('should map ValidationError to 400', () => {
      expect(mapErrorTypeToStatusCode(ApiErrorType.ValidationError)).toBe(400)
    })

    it('should map PermissionError to 403', () => {
      expect(mapErrorTypeToStatusCode(ApiErrorType.PermissionError)).toBe(403)
    })

    it('should map TableNotFound to 404', () => {
      expect(mapErrorTypeToStatusCode(ApiErrorType.TableNotFound)).toBe(404)
    })

    it('should map NetworkError to 503', () => {
      expect(mapErrorTypeToStatusCode(ApiErrorType.NetworkError)).toBe(503)
    })

    it('should map QueryError to 500', () => {
      expect(mapErrorTypeToStatusCode(ApiErrorType.QueryError)).toBe(500)
    })

    it('should map SslError to 503', () => {
      expect(mapErrorTypeToStatusCode(ApiErrorType.SslError)).toBe(503)
    })

    it('should map TimeoutError to 504', () => {
      expect(mapErrorTypeToStatusCode(ApiErrorType.TimeoutError)).toBe(504)
    })

    it('should default to 500 for unknown types', () => {
      // @ts-expect-error - Testing unknown type
      expect(mapErrorTypeToStatusCode('unknown_type')).toBe(500)
    })
  })
})
