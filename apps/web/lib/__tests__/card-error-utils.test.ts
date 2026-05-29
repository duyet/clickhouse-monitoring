/**
 * Tests for lib/card-error-utils.ts
 */

import {
  type CardError,
  detectCardErrorVariant,
  formatCardErrorForLogging,
  getCardErrorClassName,
  getCardErrorDescription,
  getCardErrorStyle,
  getCardErrorTitle,
  isCardErrorRetryable,
  shouldShowRetryButton,
} from '../card-error-utils'
import { describe, expect, it } from 'bun:test'
import { ApiErrorType } from '@/lib/api/types'

describe('card-error-utils', () => {
  // Helper to create ApiError
  const createApiError = (type: ApiErrorType, message: string): CardError => ({
    type,
    message,
  })

  // Helper to create FetchDataError
  const createFetchError = (type: string, message: string): CardError => ({
    type,
    message,
  })

  // Helper to create standard Error
  const createError = (message: string): CardError => new Error(message)

  describe('detectCardErrorVariant', () => {
    describe('ApiError with explicit type', () => {
      it('should detect table_not_found from ApiErrorType', () => {
        const error = createApiError(
          ApiErrorType.TableNotFound,
          'Table not found'
        )
        expect(detectCardErrorVariant(error)).toBe('table-missing')
      })

      it('should detect network_error from ApiErrorType', () => {
        const error = createApiError(ApiErrorType.NetworkError, 'Network error')
        expect(detectCardErrorVariant(error)).toBe('offline')
      })

      it('should detect validation_error', () => {
        const error = createApiError(
          ApiErrorType.ValidationError,
          'Invalid input'
        )
        expect(detectCardErrorVariant(error)).toBe('error')
      })

      it('should detect permission_error', () => {
        const error = createApiError(
          ApiErrorType.PermissionError,
          'Access denied'
        )
        expect(detectCardErrorVariant(error)).toBe('error')
      })

      it('should detect query_error', () => {
        const error = createApiError(ApiErrorType.QueryError, 'Query failed')
        expect(detectCardErrorVariant(error)).toBe('error')
      })
    })

    describe('FetchDataError with explicit type', () => {
      it('should detect table_not_found', () => {
        const error = createFetchError('table_not_found', 'Table missing')
        expect(detectCardErrorVariant(error)).toBe('table-missing')
      })

      it('should detect network_error', () => {
        const error = createFetchError('network_error', 'Connection failed')
        expect(detectCardErrorVariant(error)).toBe('offline')
      })
    })

    describe('Error detection from message content', () => {
      describe('timeout detection', () => {
        it('should detect "timeout"', () => {
          expect(detectCardErrorVariant(createError('Query timeout'))).toBe(
            'timeout'
          )
        })

        it('should detect "timed out"', () => {
          expect(detectCardErrorVariant(createError('Query timed out'))).toBe(
            'timeout'
          )
        })

        it('should detect "query timeout"', () => {
          expect(
            detectCardErrorVariant(createError('Database query timeout'))
          ).toBe('timeout')
        })
      })

      describe('offline/connection detection', () => {
        it('should detect "offline"', () => {
          expect(detectCardErrorVariant(createError('You are offline'))).toBe(
            'offline'
          )
        })

        it('should detect "network"', () => {
          expect(detectCardErrorVariant(createError('Network error'))).toBe(
            'offline'
          )
        })

        it('should detect "fetch"', () => {
          expect(detectCardErrorVariant(createError('Fetch failed'))).toBe(
            'offline'
          )
        })

        it('should detect "connection"', () => {
          expect(
            detectCardErrorVariant(createError('Connection refused'))
          ).toBe('offline')
        })

        it('should detect "connect"', () => {
          expect(detectCardErrorVariant(createError('Cannot connect'))).toBe(
            'offline'
          )
        })

        it('should detect "econnrefused"', () => {
          expect(detectCardErrorVariant(createError('ECONNREFUSED'))).toBe(
            'offline'
          )
        })

        it('should detect "enotfound"', () => {
          expect(detectCardErrorVariant(createError('ENOTFOUND'))).toBe(
            'offline'
          )
        })

        it('should detect "etimedout"', () => {
          expect(detectCardErrorVariant(createError('ETIMEDOUT'))).toBe(
            'offline'
          )
        })
      })

      describe('table missing detection', () => {
        it('should detect "table" with "doesn\'t exist"', () => {
          expect(
            detectCardErrorVariant(createError("Table doesn't exist"))
          ).toBe('table-missing')
        })

        it('should detect "missing" with "table"', () => {
          expect(
            detectCardErrorVariant(createError('Table system.test is missing'))
          ).toBe('table-missing')
        })

        it('should detect "unknown table"', () => {
          expect(detectCardErrorVariant(createError('Unknown table'))).toBe(
            'table-missing'
          )
        })

        it('should detect "table_not_found"', () => {
          expect(detectCardErrorVariant(createError('table_not_found'))).toBe(
            'table-missing'
          )
        })
      })
    })

    describe('default behavior', () => {
      it('should default to "error" for unknown errors', () => {
        expect(detectCardErrorVariant(createError('Unknown error'))).toBe(
          'error'
        )
      })

      it('should handle empty message', () => {
        expect(detectCardErrorVariant(createError(''))).toBe('error')
      })

      it('should be case insensitive', () => {
        expect(detectCardErrorVariant(createError('TIMEOUT'))).toBe('timeout')
        expect(detectCardErrorVariant(createError('Network Error'))).toBe(
          'offline'
        )
      })
    })
  })

  describe('getCardErrorDescription', () => {
    it('should return compact message when compact=true', () => {
      const error = createError('Network error')
      expect(getCardErrorDescription(error, 'offline', true)).toBe(
        'Cannot connect to server.'
      )
    })

    it('should return standard description when compact=false', () => {
      const error = createError('Network error')
      expect(getCardErrorDescription(error, 'offline', false)).toBe(
        'Unable to connect to the server. Check your network connection and try again.'
      )
    })

    it('should return standard description when compact not specified', () => {
      const error = createError('Network error')
      expect(getCardErrorDescription(error, 'offline')).toBe(
        'Unable to connect to the server. Check your network connection and try again.'
      )
    })

    it('should use original message if short and helpful', () => {
      // The message contains 'failed' which is in the generic messages list,
      // so it will use the standardized message instead
      const error = createError('Specific database connection issue')
      expect(getCardErrorDescription(error, 'error')).toBe(
        'Specific database connection issue'
      )
    })

    it('should not use original message if too long', () => {
      const longMessage =
        'This is a very long error message that exceeds one hundred characters and should not be used as the description'
      const error = createError(longMessage)
      expect(getCardErrorDescription(error, 'error')).not.toBe(longMessage)
    })

    it('should not use generic original messages', () => {
      expect(getCardErrorDescription(createError('error'), 'error')).not.toBe(
        'error'
      )
      expect(
        getCardErrorDescription(createError('An error occurred'), 'error')
      ).not.toBe('An error occurred')
      expect(
        getCardErrorDescription(createError('Unknown error'), 'error')
      ).not.toBe('Unknown error')
    })

    it('should return descriptions for all variants', () => {
      const error = createError('test')

      expect(getCardErrorDescription(error, 'table-missing')).toContain(
        'additional ClickHouse configuration'
      )

      expect(getCardErrorDescription(error, 'offline')).toContain(
        'network connection'
      )

      expect(getCardErrorDescription(error, 'timeout')).toContain(
        'took too long'
      )

      expect(getCardErrorDescription(error, 'error')).toContain(
        'unexpected error'
      )
    })
  })

  describe('getCardErrorTitle', () => {
    it('should return default title for each variant', () => {
      expect(getCardErrorTitle('error')).toBe('Failed to load')
      expect(getCardErrorTitle('timeout')).toBe('Request timed out')
      expect(getCardErrorTitle('offline')).toBe("You're offline")
      expect(getCardErrorTitle('table-missing')).toBe('Table not available')
    })

    it('should return custom title when provided', () => {
      expect(getCardErrorTitle('error', 'Custom Error')).toBe('Custom Error')
      expect(getCardErrorTitle('offline', 'Connection Lost')).toBe(
        'Connection Lost'
      )
    })

    it('should use default title when customTitle is empty string', () => {
      expect(getCardErrorTitle('error', '')).toBe('Failed to load')
    })
  })

  describe('getCardErrorStyle', () => {
    it('should return destructive styling for error variant', () => {
      const style = getCardErrorStyle('error')
      expect(style).toEqual({
        border: 'border-destructive/30',
        background: 'bg-destructive/5',
        isDestructive: true,
      })
    })

    it('should return warning styling for timeout variant', () => {
      const style = getCardErrorStyle('timeout')
      expect(style).toEqual({
        border: 'border-warning/30',
        background: 'bg-warning/5',
        isDestructive: false,
      })
    })

    it('should return warning styling for offline variant', () => {
      const style = getCardErrorStyle('offline')
      expect(style).toEqual({
        border: 'border-warning/30',
        background: 'bg-warning/5',
        isDestructive: false,
      })
    })

    it('should return muted styling for table-missing variant', () => {
      const style = getCardErrorStyle('table-missing')
      expect(style).toEqual({
        border: 'border-muted/30',
        background: 'bg-muted/30',
        isDestructive: false,
      })
    })
  })

  describe('getCardErrorClassName', () => {
    it('should return combined className for error variant', () => {
      expect(getCardErrorClassName('error')).toBe(
        'border-destructive/30 bg-destructive/5'
      )
    })

    it('should return combined className for timeout variant', () => {
      expect(getCardErrorClassName('timeout')).toBe(
        'border-warning/30 bg-warning/5'
      )
    })

    it('should return combined className for offline variant', () => {
      expect(getCardErrorClassName('offline')).toBe(
        'border-warning/30 bg-warning/5'
      )
    })

    it('should return combined className for table-missing variant', () => {
      expect(getCardErrorClassName('table-missing')).toBe(
        'border-muted/30 bg-muted/30'
      )
    })
  })

  describe('isCardErrorRetryable', () => {
    it('should return true for offline errors', () => {
      expect(isCardErrorRetryable(createError('Network error'))).toBe(true)
      expect(
        isCardErrorRetryable(
          createApiError(ApiErrorType.NetworkError, 'offline')
        )
      ).toBe(true)
    })

    it('should return true for timeout errors', () => {
      expect(isCardErrorRetryable(createError('Query timeout'))).toBe(true)
    })

    it('should return false for table-missing errors', () => {
      expect(isCardErrorRetryable(createError('Table not found'))).toBe(false)
      expect(
        isCardErrorRetryable(
          createApiError(ApiErrorType.TableNotFound, 'Missing table')
        )
      ).toBe(false)
    })

    it('should return false for permission errors', () => {
      expect(isCardErrorRetryable(createError('Permission denied'))).toBe(false)
    })

    it('should return false for generic errors', () => {
      expect(isCardErrorRetryable(createError('Unknown error'))).toBe(false)
    })
  })

  describe('shouldShowRetryButton', () => {
    it('should be alias for isCardErrorRetryable', () => {
      const offlineError = createError('Network error')
      const timeoutError = createError('Query timeout')
      const tableError = createError('Table not found')

      expect(shouldShowRetryButton(offlineError)).toBe(
        isCardErrorRetryable(offlineError)
      )
      expect(shouldShowRetryButton(timeoutError)).toBe(
        isCardErrorRetryable(timeoutError)
      )
      expect(shouldShowRetryButton(tableError)).toBe(
        isCardErrorRetryable(tableError)
      )
    })
  })

  describe('formatCardErrorForLogging', () => {
    it('should format ApiError correctly', () => {
      const error = createApiError(
        ApiErrorType.TableNotFound,
        'Table not found'
      )
      const formatted = formatCardErrorForLogging(error)

      expect(formatted).toEqual({
        variant: 'table-missing',
        type: ApiErrorType.TableNotFound,
        message: 'Table not found',
        hasApiType: true,
        hasFetchType: true, // ApiError has both type fields (duck-typing)
      })
    })

    it('should format FetchDataError correctly', () => {
      const error = createFetchError('network_error', 'Connection failed')
      const formatted = formatCardErrorForLogging(error)

      expect(formatted).toEqual({
        variant: 'offline',
        type: 'network_error',
        message: 'Connection failed',
        hasApiType: true, // Duck-typed as ApiError too
        hasFetchType: true,
      })
    })

    it('should format standard Error correctly', () => {
      const error = createError('Unknown error')
      const formatted = formatCardErrorForLogging(error)

      expect(formatted).toEqual({
        variant: 'error',
        type: 'unknown',
        message: 'Unknown error',
        hasApiType: false,
        hasFetchType: false,
      })
    })

    it('should handle error without message', () => {
      const error = new Error()
      const formatted = formatCardErrorForLogging(error)

      // Empty string message is expected
      expect(formatted.message).toBe('')
    })

    it('should correctly detect variant for logging', () => {
      const timeoutError = createError('Query timeout')
      const formatted = formatCardErrorForLogging(timeoutError)

      expect(formatted.variant).toBe('timeout')
    })
  })
})
