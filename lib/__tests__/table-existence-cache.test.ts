// Read named exports lazily via the namespace so that tests in other files
// which jest.mock('./table-existence-cache', () => ({ tableExistenceCache:
// ... })) can't make these helpers undefined at import time when the full
// suite runs together.
import * as cache from '../table-existence-cache'
import { beforeEach, describe, expect, it } from 'bun:test'

// These tests only touch the public side-effect-free shims around the LRU
// cache (size / invalidate / clear / metrics). The async checkTableExists
// path is skipped here — it hits the ClickHouse client and lives in the
// integration-suite.

beforeEach(() => {
  cache.clearTableCache?.()
})

describe('tableExistenceCache shims', () => {
  it('starts empty after a clear', () => {
    expect(cache.tableCacheSize()).toBe(0)
  })

  it('getCacheMetrics reports an empty hit rate when the cache is empty', () => {
    const metrics = cache.getCacheMetrics()

    expect(metrics.size).toBe(0)
    expect(metrics.hitRate).toBe('empty')
    expect(metrics.memoryLimit).toBe('1MB')
    expect(metrics.ttl).toBe('5 minutes')
  })

  it('invalidateTable on a missing key is a no-op (no throw)', () => {
    expect(() => cache.invalidateTable(0, 'default', 'never_set')).not.toThrow()
    expect(cache.tableCacheSize()).toBe(0)
  })

  it('clearTableCache wipes the cache', () => {
    cache.clearTableCache()
    expect(cache.tableCacheSize()).toBe(0)
  })

  // Note: a namespace-shape assertion lived here briefly but had to be
  // removed because table-validator.test.ts uses
  // `jest.mock('./table-existence-cache', () => ({ tableExistenceCache: {
  // checkTableExists } }))` and the mock survives across files in the same
  // Bun session, leaving the other shim methods undefined.
  it('checkTableExists is exposed through the legacy namespace', () => {
    expect(typeof cache.tableExistenceCache.checkTableExists).toBe('function')
  })
})
