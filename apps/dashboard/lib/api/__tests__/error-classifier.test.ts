/**
 * Tests for error-classifier
 * Covers classifyError for all error type patterns and edge cases.
 */

import { describe, expect, it } from 'bun:test'
import { classifyError } from '@/lib/api/error-handler/error-classifier'
import { ApiErrorType } from '@/lib/api/types'

describe('classifyError', () => {
  // ─── TableNotFound ──────────────────────────────────────────────

  describe('TableNotFound', () => {
    it('classifies "table not found" message', () => {
      const result = classifyError(new Error('Table not found: system.unknown'))
      expect(result.type).toBe(ApiErrorType.TableNotFound)
    })

    it('classifies "table doesn\'t exist" message', () => {
      const result = classifyError(new Error("Table doesn't exist"))
      expect(result.type).toBe(ApiErrorType.TableNotFound)
    })

    it('classifies "table does not exist" message', () => {
      const result = classifyError(new Error('table does not exist in catalog'))
      expect(result.type).toBe(ApiErrorType.TableNotFound)
    })

    it('classifies "missing table" (table + missing)', () => {
      const result = classifyError(
        new Error('Missing table: system.backup_log')
      )
      expect(result.type).toBe(ApiErrorType.TableNotFound)
    })

    it('preserves the original message', () => {
      const result = classifyError(new Error('Table not found: xyz'))
      expect(result.message).toBe('Table not found: xyz')
    })
  })

  // ─── PermissionError ────────────────────────────────────────────

  describe('PermissionError', () => {
    it('classifies "permission" keyword', () => {
      const result = classifyError(new Error('Permission denied for user'))
      expect(result.type).toBe(ApiErrorType.PermissionError)
    })

    it('classifies "access denied" keyword', () => {
      const result = classifyError(new Error('Access denied'))
      expect(result.type).toBe(ApiErrorType.PermissionError)
    })

    it('classifies "unauthorized" keyword', () => {
      const result = classifyError(new Error('Unauthorized access'))
      expect(result.type).toBe(ApiErrorType.PermissionError)
    })

    it('classifies "forbidden" keyword', () => {
      const result = classifyError(new Error('Forbidden resource'))
      expect(result.type).toBe(ApiErrorType.PermissionError)
    })
  })

  // ─── NetworkError ───────────────────────────────────────────────

  describe('NetworkError', () => {
    it('classifies "network" keyword', () => {
      const result = classifyError(new Error('network error'))
      expect(result.type).toBe(ApiErrorType.NetworkError)
    })

    it('classifies "connection refused" keyword', () => {
      const result = classifyError(new Error('connection refused by host'))
      expect(result.type).toBe(ApiErrorType.NetworkError)
    })

    it('classifies "ECONNREFUSED" keyword', () => {
      const result = classifyError(new Error('ECONNREFUSED 127.0.0.1:9000'))
      expect(result.type).toBe(ApiErrorType.NetworkError)
    })

    it('classifies "ENOTFOUND" keyword', () => {
      const result = classifyError(new Error('ENOTFOUND host.example.com'))
      expect(result.type).toBe(ApiErrorType.NetworkError)
    })

    it('classifies "connect failed" keyword', () => {
      const result = classifyError(new Error('Connect failed to host'))
      expect(result.type).toBe(ApiErrorType.NetworkError)
    })
  })

  // ─── TimeoutError ───────────────────────────────────────────────

  describe('TimeoutError', () => {
    it('classifies "timeout" keyword', () => {
      const result = classifyError(new Error('Query timeout exceeded'))
      expect(result.type).toBe(ApiErrorType.TimeoutError)
    })

    it('classifies "ETIMEDOUT" keyword', () => {
      // "ETIMEDOUT" contains "timeout" but "ETIMEDOUT" alone (without "connection") is needed
      // because "connection" in the message matches NetworkError first
      const result = classifyError(new Error('ETIMEDOUT'))
      expect(result.type).toBe(ApiErrorType.TimeoutError)
    })

    it('classifies "socket timeout" keyword', () => {
      const result = classifyError(new Error('socket timeout after 30s'))
      expect(result.type).toBe(ApiErrorType.TimeoutError)
    })
  })

  // ─── SslError ──────────────────────────────────────────────────

  describe('SslError', () => {
    it('classifies "ssl" keyword', () => {
      const result = classifyError(new Error('SSL handshake failed'))
      expect(result.type).toBe(ApiErrorType.SslError)
    })

    it('classifies "tls" keyword', () => {
      const result = classifyError(new Error('TLS certificate invalid'))
      expect(result.type).toBe(ApiErrorType.SslError)
    })

    it('classifies "certificate" keyword', () => {
      const result = classifyError(new Error('certificate verify failed'))
      expect(result.type).toBe(ApiErrorType.SslError)
    })

    it('classifies "handshake" keyword', () => {
      const result = classifyError(new Error('handshake error'))
      expect(result.type).toBe(ApiErrorType.SslError)
    })

    it('classifies "525" status code', () => {
      const result = classifyError(new Error('525 SSL handshake failed'))
      expect(result.type).toBe(ApiErrorType.SslError)
    })

    it('classifies "526" status code', () => {
      const result = classifyError(new Error('526 invalid certificate'))
      expect(result.type).toBe(ApiErrorType.SslError)
    })
  })

  // ─── ValidationError ────────────────────────────────────────────

  describe('ValidationError', () => {
    it('classifies "invalid" keyword', () => {
      const result = classifyError(new Error('Invalid parameter value'))
      expect(result.type).toBe(ApiErrorType.ValidationError)
    })

    it('classifies "missing" keyword as TableNotFound (matches pattern before validation)', () => {
      // "missing" is a keyword in the TableNotFound classification pattern,
      // so even without "table" in the message it maps to TableNotFound
      const result = classifyError(new Error('Missing required field'))
      expect(result.type).toBe(ApiErrorType.TableNotFound)
    })

    it('classifies "required" keyword as TableNotFound (message contains "missing")', () => {
      // "required parameter missing" contains "missing" which is a TableNotFound keyword
      const result = classifyError(new Error('required parameter missing'))
      expect(result.type).toBe(ApiErrorType.TableNotFound)
    })

    it('classifies "malformed" keyword', () => {
      const result = classifyError(new Error('malformed request body'))
      expect(result.type).toBe(ApiErrorType.ValidationError)
    })

    it('classifies "syntax error" keyword', () => {
      const result = classifyError(new Error('syntax error in query'))
      expect(result.type).toBe(ApiErrorType.ValidationError)
    })

    it('classifies "parse error" keyword', () => {
      const result = classifyError(new Error('parse error at position 5'))
      expect(result.type).toBe(ApiErrorType.ValidationError)
    })
  })

  // ─── QueryError (default fallback) ──────────────────────────────

  describe('QueryError (default)', () => {
    it('defaults to QueryError for unrecognized errors', () => {
      const result = classifyError(new Error('Something unexpected happened'))
      expect(result.type).toBe(ApiErrorType.QueryError)
    })

    it('defaults to QueryError for empty message', () => {
      const result = classifyError(new Error(''))
      expect(result.type).toBe(ApiErrorType.QueryError)
    })
  })

  // ─── Input type variations ──────────────────────────────────────

  describe('input types', () => {
    it('handles string input', () => {
      const result = classifyError('Plain string error')
      expect(result.type).toBe(ApiErrorType.QueryError)
      expect(result.message).toBe('Plain string error')
    })

    it('handles null input', () => {
      const result = classifyError(null)
      expect(result.type).toBe(ApiErrorType.QueryError)
      expect(result.message).toBe('Unknown error occurred')
    })

    it('handles undefined input', () => {
      const result = classifyError(undefined)
      expect(result.type).toBe(ApiErrorType.QueryError)
      expect(result.message).toBe('Unknown error occurred')
    })

    it('handles number input', () => {
      const result = classifyError(42)
      expect(result.type).toBe(ApiErrorType.QueryError)
      expect(result.message).toBe('Unknown error occurred')
    })

    it('handles object input', () => {
      const result = classifyError({ code: 500 })
      expect(result.type).toBe(ApiErrorType.QueryError)
      expect(result.message).toBe('Unknown error occurred')
    })
  })

  // ─── Case insensitivity ─────────────────────────────────────────

  describe('case insensitivity', () => {
    it('matches uppercase keywords', () => {
      const result = classifyError(new Error('TIMEOUT EXCEEDED'))
      expect(result.type).toBe(ApiErrorType.TimeoutError)
    })

    it('matches mixed case keywords', () => {
      const result = classifyError(new Error('Network Error'))
      expect(result.type).toBe(ApiErrorType.NetworkError)
    })

    it('matches title case TableNotFound pattern', () => {
      const result = classifyError(new Error('Table Not Found'))
      expect(result.type).toBe(ApiErrorType.TableNotFound)
    })
  })
})
