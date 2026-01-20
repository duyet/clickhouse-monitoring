/**
 * Tests for lib/table-existence-cache.ts
 */

import { describe, expect, it, mock, beforeEach } from 'bun:test'

// Mock dependencies
const mockDebug = mock(() => {})
const mockError = mock(() => {})
const mockWarn = mock(() => {})

mock.module('@/lib/logger', () => ({
  debug: mockDebug,
  error: mockError,
  warn: mockWarn,
}))

const mockClientQuery = mock(() => Promise.resolve({}))
const mockResultJson = mock(() => Promise.resolve([{ count: '1' }]))
const mockResultSet = {
  query: mockClientQuery,
  json: mockResultJson,
}
const mockClient = mock(() => Promise.resolve(mockResultSet))
const mockClientGet = mock(() => mockClient)

mock.module('@/lib/clickhouse', () => ({
  getClient: mockClientGet,
}))

import {
  checkTableExists,
  getCacheMetrics,
  invalidateTable,
  clearTableCache,
  tableCacheSize,
  tableExistenceCache,
} from '@/lib/table-existence-cache'

describe('table-existence-cache', () => {
  beforeEach(() => {
    mockDebug.mockReset()
    mockError.mockReset()
    mockClientQuery.mockReset()
    mockResultJson.mockReset()
    mockClientGet.mockReset()
  })

  describe('checkTableExists', () => {
    it('should return true when table exists', async () => {
      mockResultJson.mockResolvedValue([{ count: '5' }])

      const result = await checkTableExists(0, 'default', 'users')

      expect(result).toBe(true)
      expect(mockClientQuery).toHaveBeenCalled()
      expect(mockResultJson).toHaveBeenCalled()
      expect(mockClientGet).toHaveBeenCalledWith({ hostId: 0 })
    })

    it('should return false when table does not exist', async () => {
      mockResultJson.mockResolvedValue([{ count: '0' }])

      const result = await checkTableExists(0, 'default', 'nonexistent')

      expect(result).toBe(false)
    })

    it('should use cached value when available', async () => {
      mockResultJson.mockResolvedValue([{ count: '5' }])
      mockClientQuery.mockClear()

      const result1 = await checkTableExists(0, 'default', 'users')
      expect(mockClientQuery).toHaveBeenCalledTimes(1)

      const result2 = await checkTableExists(0, 'default', 'users')
      expect(mockClientQuery).toHaveBeenCalledTimes(1)

      expect(result1).toBe(true)
      expect(result2).toBe(true)
    })

    it('should return false on query error', async () => {
      mockClientQuery.mockRejectedValue(new Error('Connection failed'))

      const result = await checkTableExists(0, 'default', 'users')

      expect(result).toBe(false)
      expect(mockError).toHaveBeenCalled()
    })

    it('should handle invalid count format', async () => {
      mockResultJson.mockResolvedValue([{ count: 'invalid' }])

      const result = await checkTableExists(0, 'default', 'users')

      expect(result).toBe(false)
    })

    it('should handle empty response', async () => {
      mockResultJson.mockResolvedValue([])

      const result = await checkTableExists(0, 'default', 'users')

      expect(result).toBe(false)
    })
  })

  describe('getCacheMetrics', () => {
    it('should return cache metrics when empty', () => {
      const metrics = getCacheMetrics()

      expect(metrics).toEqual({
        size: 0,
        maxSize: 500,
        memoryLimit: '1MB',
        ttl: '5 minutes',
        hitRate: 'empty',
      })
    })

    it('should return correct hitRate when cache has entries', async () => {
      mockResultJson.mockResolvedValue([{ count: '1' }])

      await checkTableExists(0, 'default', 'users')
      const metrics = getCacheMetrics()

      expect(metrics.hitRate).toBe('available')
      expect(metrics.size).toBe(1)
    })
  })

  describe('invalidateTable', () => {
    it('should remove specific cache entry', async () => {
      mockResultJson.mockResolvedValue([{ count: '1' }])

      await checkTableExists(0, 'default', 'users')
      expect(tableCacheSize()).toBe(1)

      invalidateTable(0, 'default', 'users')
      expect(tableCacheSize()).toBe(0)
    })

    it('should not error when invalidating non-existent entry', () => {
      expect(() => invalidateTable(0, 'default', 'nonexistent')).not.toThrow()
    })
  })

  describe('clearTableCache', () => {
    it('should clear all cache entries', async () => {
      mockResultJson.mockResolvedValue([{ count: '1' }])

      await checkTableExists(0, 'default', 'users')
      await checkTableExists(0, 'system', 'tables')
      expect(tableCacheSize()).toBe(2)

      clearTableCache()
      expect(tableCacheSize()).toBe(0)
    })
  })

  describe('tableCacheSize', () => {
    it('should return 0 for empty cache', () => {
      expect(tableCacheSize()).toBe(0)
    })

    it('should return correct count for populated cache', async () => {
      mockResultJson.mockResolvedValue([{ count: '1' }])

      await checkTableExists(0, 'default', 'users')
      await checkTableExists(0, 'system', 'tables')
      await checkTableExists(1, 'default', 'orders')

      expect(tableCacheSize()).toBe(3)
    })
  })

  describe('tableExistenceCache backward compatibility', () => {
    it('should export checkTableExists function', () => {
      expect(tableExistenceCache.checkTableExists).toBeDefined()
      expect(tableExistenceCache.checkTableExists).toBe(checkTableExists)
    })

    it('should export invalidate function', () => {
      expect(tableExistenceCache.invalidate).toBeDefined()
      expect(tableExistenceCache.invalidate).toBe(invalidateTable)
    })

    it('should export clear function', () => {
      expect(tableExistenceCache.clear).toBeDefined()
      expect(tableExistenceCache.clear).toBe(clearTableCache)
    })

    it('should export getCacheSize function', () => {
      expect(tableExistenceCache.getCacheSize).toBeDefined()
      expect(tableExistenceCache.getCacheSize).toBe(tableCacheSize)
    })

    it('should export getMetrics function', () => {
      expect(tableExistenceCache.getMetrics).toBeDefined()
      expect(tableExistenceCache.getMetrics).toBe(getCacheMetrics)
    })
  })
})
