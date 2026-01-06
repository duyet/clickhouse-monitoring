/**
 * Tests for lib/logger.ts
 */

import {
  debug,
  type ErrorContext,
  ErrorLogger,
  error,
  formatErrorForDisplay,
  log,
  warn,
} from '../logger'

describe('logger', () => {
  describe('formatErrorForDisplay', () => {
    // Note: NODE_ENV is set to 'test' in jest.setup.js at module load time
    // The logger checks NODE_ENV at import time, so we can't change it per test
    // Tests are written for the 'test' environment (production-like behavior)

    it('should format generic error for users', () => {
      const err = new Error('Test error')
      const formatted = formatErrorForDisplay(err)

      expect(formatted.title).toBe('Something went wrong')
      expect(formatted.message).toContain('unexpected error')
      expect(formatted.message).toContain('try again')
      expect(formatted.details?.stack).toBeUndefined()
    })

    it('should format CLICKHOUSE_HOST configuration error', () => {
      const err = new Error('No ClickHouse hosts configured')
      const formatted = formatErrorForDisplay(err)

      expect(formatted.message).toContain('Server configuration error')
      expect(formatted.message).toContain('administrator')
      expect(formatted.message).toContain('Note for administrator:')
      expect(formatted.message).toContain('CLICKHOUSE_HOST')
    })

    it('should format Invalid hostId error', () => {
      const err = new Error('Invalid hostId: test')
      const formatted = formatErrorForDisplay(err)

      expect(formatted.message).toContain('Invalid server configuration')
      expect(formatted.message).toContain('administrator')
      expect(formatted.message).toContain('Invalid hostId: test')
    })

    it('should format table errors', () => {
      const err = new Error('Table system.test not found')
      const formatted = formatErrorForDisplay(err)

      // This error doesn't match specific patterns, so it gets the generic message
      expect(formatted.message).toContain('unexpected error')
    })

    it('should format network/connection errors', () => {
      const err = new Error('Network connection failed')
      const formatted = formatErrorForDisplay(err)

      expect(formatted.message).toContain('Unable to connect')
      expect(formatted.message).toContain('network connection')
      expect(formatted.message).toContain('try again')
    })

    it('should include digest in details', () => {
      const err = new Error('Test error')
      err.digest = 'test-digest-123'
      const formatted = formatErrorForDisplay(err)

      expect(formatted.details?.digest).toBe('test-digest-123')
    })
  })

  describe('log functions', () => {
    it('should have debug function', () => {
      expect(debug).toBeDefined()
      expect(typeof debug).toBe('function')
    })

    it('should have log function', () => {
      expect(log).toBeDefined()
      expect(typeof log).toBe('function')
    })

    it('should have warn function', () => {
      expect(warn).toBeDefined()
      expect(typeof warn).toBe('function')
    })

    it('should have error function', () => {
      expect(error).toBeDefined()
      expect(typeof error).toBe('function')
    })

    it('should accept error and context parameters', () => {
      const err = new Error('Test')
      const context: ErrorContext = { component: 'Test' }
      // Should not throw
      error('message', err, context)
      warn('message', context)
      debug('message', { data: 'test' })
      log('message', { data: 'test' })
    })
  })

  describe('ErrorLogger', () => {
    it('should have logError method', () => {
      expect(ErrorLogger.logError).toBeDefined()
      expect(typeof ErrorLogger.logError).toBe('function')
    })

    it('should have logWarning method', () => {
      expect(ErrorLogger.logWarning).toBeDefined()
      expect(typeof ErrorLogger.logWarning).toBe('function')
    })

    it('should have logDebug method', () => {
      expect(ErrorLogger.logDebug).toBeDefined()
      expect(typeof ErrorLogger.logDebug).toBe('function')
    })

    it('should log error with context', () => {
      const err = new Error('Test error')
      const context: ErrorContext = {
        component: 'TestComponent',
        action: 'testAction',
      }
      // Should not throw
      ErrorLogger.logError(err, context)
    })

    it('should log warning with context', () => {
      const context: ErrorContext = { component: 'TestComponent' }
      // Should not throw
      ErrorLogger.logWarning('Test warning', context)
    })

    it('should log debug message', () => {
      // Should not throw
      ErrorLogger.logDebug('debug message', { key: 'value' })
    })
  })
})
