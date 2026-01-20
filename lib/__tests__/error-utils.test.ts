/**
 * Tests for lib/error-utils.ts
 */

import { describe, expect, it } from 'bun:test'

import type { FetchDataError } from '@/lib/clickhouse'
import {
  formatErrorMessage,
  formatErrorTitle,
  shouldDisplayError,
  getErrorDocumentation,
  getErrorVariant,
} from '@/lib/error-utils'

describe('error-utils', () => {
  describe('formatErrorMessage', () => {
    it('should format table_not_found error with missing tables', () => {
      const error: FetchDataError = {
        type: 'table_not_found',
        message: 'Table not found',
        details: {
          missingTables: ['system.backup_log', 'system.error_log'],
        },
      }

      const result = formatErrorMessage(error)

      expect(result).toContain('Required tables not found')
      expect(result).toContain('system.backup_log, system.error_log')
    })

    it('should format table_not_found error without missing tables', () => {
      const error: FetchDataError = {
        type: 'table_not_found',
        message: 'Table not found',
      }

      const result = formatErrorMessage(error)

      expect(result).toContain('Required tables not found')
      expect(result).toContain('getting-started')
    })

    it('should format permission_error', () => {
      const error: FetchDataError = {
        type: 'permission_error',
        message: 'Access denied',
      }

      const result = formatErrorMessage(error)

      expect(result).toContain('Permission denied')
      expect(result).toContain('user permissions')
    })

    it('should format network_error', () => {
      const error: FetchDataError = {
        type: 'network_error',
        message: 'Connection failed',
      }

      const result = formatErrorMessage(error)

      expect(result).toContain('Network connection error')
      expect(result).toContain('connectivity')
    })

    it('should format validation_error', () => {
      const error: FetchDataError = {
        type: 'validation_error',
        message: 'Invalid hostId',
      }

      const result = formatErrorMessage(error)

      expect(result).toContain('Validation error')
      expect(result).toContain('Invalid hostId')
    })

    it('should format query_error with message', () => {
      const error: FetchDataError = {
        type: 'query_error',
        message: 'Syntax error in query',
      }

      const result = formatErrorMessage(error)

      expect(result).toBe('Syntax error in query')
    })
  })

  describe('formatErrorTitle', () => {
    it('should format table_not_found title', () => {
      const error: FetchDataError = {
        type: 'table_not_found',
        message: 'Table not found',
      }

      const result = formatErrorTitle(error)

      expect(result).toBe('Table Not Found')
    })

    it('should format permission_error title', () => {
      const error: FetchDataError = {
        type: 'permission_error',
        message: 'Access denied',
      }

      const result = formatErrorTitle(error)

      expect(result).toBe('Permission Denied')
    })

    it('should format network_error title', () => {
      const error: FetchDataError = {
        type: 'network_error',
        message: 'Connection failed',
      }

      const result = formatErrorTitle(error)

      expect(result).toBe('Connection Error')
    })

    it('should format validation_error title', () => {
      const error: FetchDataError = {
        type: 'validation_error',
        message: 'Invalid input',
      }

      const result = formatErrorTitle(error)

      expect(result).toBe('Validation Error')
    })

    it('should format query_error title', () => {
      const error: FetchDataError = {
        type: 'query_error',
        message: 'Query failed',
      }

      const result = formatErrorTitle(error)

      expect(result).toBe('Query Error')
    })
  })

  describe('shouldDisplayError', () => {
    it('should return false for table_not_found errors', () => {
      const error: FetchDataError = {
        type: 'table_not_found',
        message: 'Table not found',
      }

      const result = shouldDisplayError(error)

      expect(result).toBe(false)
    })

    it('should return true for permission_error', () => {
      const error: FetchDataError = {
        type: 'permission_error',
        message: 'Access denied',
      }

      const result = shouldDisplayError(error)

      expect(result).toBe(true)
    })

    it('should return true for network_error', () => {
      const error: FetchDataError = {
        type: 'network_error',
        message: 'Connection failed',
      }

      const result = shouldDisplayError(error)

      expect(result).toBe(true)
    })

    it('should return true for validation_error', () => {
      const error: FetchDataError = {
        type: 'validation_error',
        message: 'Invalid input',
      }

      const result = shouldDisplayError(error)

      expect(result).toBe(true)
    })

    it('should return true for query_error', () => {
      const error: FetchDataError = {
        type: 'query_error',
        message: 'Query failed',
      }

      const result = shouldDisplayError(error)

      expect(result).toBe(true)
    })
  })

  describe('getErrorDocumentation', () => {
    it('should return backup_log docs for missing backup table', () => {
      const error: FetchDataError = {
        type: 'table_not_found',
        message: 'Table not found',
        details: {
          missingTables: ['system.backup_log'],
        },
      }

      const result = getErrorDocumentation(error)

      expect(result).toContain('Backup logging is not enabled')
      expect(result).toContain('clickhouse.com/docs')
    })

    it('should return error_log docs for missing error table', () => {
      const error: FetchDataError = {
        type: 'table_not_found',
        message: 'Table not found',
        details: {
          missingTables: ['system.error_log'],
        },
      }

      const result = getErrorDocumentation(error)

      expect(result).toContain('Error logging is not enabled')
      expect(result).toContain('clickhouse.com/docs')
    })

    it('should return zookeeper docs for missing zookeeper table', () => {
      const error: FetchDataError = {
        type: 'table_not_found',
        message: 'Table not found',
        details: {
          missingTables: ['system.zookeeper'],
        },
      }

      const result = getErrorDocumentation(error)

      expect(result).toContain('ZooKeeper is not configured')
      expect(result).toContain('replication')
    })

    it('should return general docs for other missing tables', () => {
      const error: FetchDataError = {
        type: 'table_not_found',
        message: 'Table not found',
        details: {
          missingTables: ['system.unknown_table'],
        },
      }

      const result = getErrorDocumentation(error)

      expect(result).toContain('specific ClickHouse configuration')
      expect(result).toContain('getting-started')
    })

    it('should return permission docs for permission errors', () => {
      const error: FetchDataError = {
        type: 'permission_error',
        message: 'Access denied',
      }

      const result = getErrorDocumentation(error)

      expect(result).toContain('Grant required permissions')
      expect(result).toContain('ClickHouse user account')
    })

    it('should return null for network errors', () => {
      const error: FetchDataError = {
        type: 'network_error',
        message: 'Connection failed',
      }

      const result = getErrorDocumentation(error)

      expect(result).toBeNull()
    })

    it('should return null for validation errors', () => {
      const error: FetchDataError = {
        type: 'validation_error',
        message: 'Invalid input',
      }

      const result = getErrorDocumentation(error)

      expect(result).toBeNull()
    })

    it('should return null for query errors', () => {
      const error: FetchDataError = {
        type: 'query_error',
        message: 'Query failed',
      }

      const result = getErrorDocumentation(error)

      expect(result).toBeNull()
    })
  })

  describe('getErrorVariant', () => {
    it('should return warning for table_not_found', () => {
      const error: FetchDataError = {
        type: 'table_not_found',
        message: 'Table not found',
      }

      const result = getErrorVariant(error)

      expect(result).toBe('warning')
    })

    it('should return destructive for permission_error', () => {
      const error: FetchDataError = {
        type: 'permission_error',
        message: 'Access denied',
      }

      const result = getErrorVariant(error)

      expect(result).toBe('destructive')
    })

    it('should return info for network_error', () => {
      const error: FetchDataError = {
        type: 'network_error',
        message: 'Connection failed',
      }

      const result = getErrorVariant(error)

      expect(result).toBe('info')
    })

    it('should return warning for validation_error', () => {
      const error: FetchDataError = {
        type: 'validation_error',
        message: 'Invalid input',
      }

      const result = getErrorVariant(error)

      expect(result).toBe('warning')
    })

    it('should return destructive for query_error', () => {
      const error: FetchDataError = {
        type: 'query_error',
        message: 'Query failed',
      }

      const result = getErrorVariant(error)

      expect(result).toBe('destructive')
    })
  })
})
