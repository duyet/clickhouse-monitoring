import {
  clearTableCache,
  getCacheMetrics,
  invalidateTable,
  tableCacheSize,
  tableExistenceCache,
} from '../table-existence-cache'
import { beforeEach, describe, expect, it } from 'bun:test'

// These tests only touch the public side-effect-free shims around the LRU
// cache (size / invalidate / clear / metrics). The async checkTableExists
// path is skipped here — it hits the ClickHouse client and lives in the
// integration-suite.

beforeEach(() => {
  clearTableCache()
})

describe('tableExistenceCache shims', () => {
  it('starts empty after a clear', () => {
    expect(tableCacheSize()).toBe(0)
  })

  it('getCacheMetrics reports an empty hit rate when the cache is empty', () => {
    const metrics = getCacheMetrics()

    expect(metrics.size).toBe(0)
    expect(metrics.hitRate).toBe('empty')
    expect(metrics.memoryLimit).toBe('1MB')
    expect(metrics.ttl).toBe('5 minutes')
  })

  it('invalidateTable on a missing key is a no-op (no throw)', () => {
    expect(() => invalidateTable(0, 'default', 'never_set')).not.toThrow()
    expect(tableCacheSize()).toBe(0)
  })

  it('clearTableCache wipes the cache', () => {
    clearTableCache()
    expect(tableCacheSize()).toBe(0)
  })

  it('the legacy tableExistenceCache namespace re-exports the same helpers', () => {
    expect(tableExistenceCache.getCacheSize).toBe(tableCacheSize)
    expect(tableExistenceCache.invalidate).toBe(invalidateTable)
    expect(tableExistenceCache.clear).toBe(clearTableCache)
    expect(tableExistenceCache.getMetrics).toBe(getCacheMetrics)
  })
})
