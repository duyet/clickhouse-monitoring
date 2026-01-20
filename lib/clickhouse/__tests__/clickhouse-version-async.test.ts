/**
 * Tests for async functions in lib/clickhouse-version.ts
 */

import { describe, expect, it, mock, beforeEach } from 'bun:test'

// Mock dependencies
const mockDebug = mock(() => {})
const mockLogError = mock(() => {})
const mockWarn = mock(() => {})

mock.module('@/lib/logger', () => ({
  debug: mockDebug,
  error: mockLogError,
  warn: mockWarn,
}))

import {
  clearVersionCache,
  getTableInfoMessage,
  SYSTEM_TABLE_INFO,
} from '@/lib/clickhouse-version'

describe('clickhouse-version-async', () => {
  beforeEach(() => {
    mockDebug.mockReset()
    mockLogError.mockReset()
    mockWarn.mockReset()
    clearVersionCache()
  })

  describe('clearVersionCache', () => {
    it('should clear version cache', () => {
      clearVersionCache()

      expect(mockDebug).toHaveBeenCalledWith(
        '[clickhouse-version] Version cache cleared'
      )
    })
  })

  describe('getTableInfoMessage', () => {
    it('should return message for optional table with description', () => {
      const tableName = 'system.backup_log'
      const message = getTableInfoMessage(tableName)

      expect(message).toContain(tableName)
      expect(message).toContain('optional')
      expect(message).toContain('backup')
    })

    it('should return message for monitoring table', () => {
      const tableName = 'system.monitoring_events'
      const message = getTableInfoMessage(tableName)

      expect(message).toContain(tableName)
      expect(message).toContain('monitoring')
      expect(message).toContain('custom table')
    })

    it('should return message for error log table', () => {
      const tableName = 'system.error_log'
      const message = getTableInfoMessage(tableName)

      expect(message).toContain(tableName)
      expect(message).toContain('error')
      expect(message).toContain('logging')
    })

    it('should return message for zookeeper table', () => {
      const tableName = 'system.zookeeper'
      const message = getTableInfoMessage(tableName)

      expect(message).toContain(tableName)
      expect(message).toContain('zookeeper')
      expect(message).toContain('ZooKeeper')
    })

    it('should return generic message for unknown table', () => {
      const tableName = 'unknown.table'
      const message = getTableInfoMessage(tableName)

      expect(message).toContain(tableName)
      expect(message).toContain('not available')
    })

    it('should handle empty table name', () => {
      const tableName = ''
      const message = getTableInfoMessage(tableName)

      expect(message).toContain('not available')
    })

    it('should handle null/undefined table name', () => {
      const message = getTableInfoMessage(null as any)

      expect(message).toContain('not available')
    })
  })

  describe('SYSTEM_TABLE_INFO', () => {
    it('should have info for backup_log', () => {
      expect(SYSTEM_TABLE_INFO['system.backup_log']).toBeDefined()
      expect(SYSTEM_TABLE_INFO['system.backup_log']).toContain('backup')
    })

    it('should have info for error_log', () => {
      expect(SYSTEM_TABLE_INFO['system.error_log']).toBeDefined()
      expect(SYSTEM_TABLE_INFO['system.error_log']).toContain('error')
    })

    it('should have info for zookeeper', () => {
      expect(SYSTEM_TABLE_INFO['system.zookeeper']).toBeDefined()
      expect(SYSTEM_TABLE_INFO['system.zookeeper']).toContain('zookeeper')
    })

    it('should have info for monitoring_events', () => {
      expect(SYSTEM_TABLE_INFO['system.monitoring_events']).toBeDefined()
      expect(SYSTEM_TABLE_INFO['system.monitoring_events']).toContain(
        'monitoring'
      )
    })

    it('should return generic message for unlisted table', () => {
      const result = SYSTEM_TABLE_INFO['unknown.table']
      expect(result).toBeUndefined()
    })
  })
})
