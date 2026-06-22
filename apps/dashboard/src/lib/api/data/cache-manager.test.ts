import {
  clearHostCache,
  getCachedDashboardQueries,
  getCacheStats,
  getCacheTTL,
  updateDashboardQueryCache,
} from './cache-manager'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  setSystemTime,
  test,
} from 'bun:test'

/**
 * The module uses a module-level `cache` Map and `cacheTimestamp` (starts at 0).
 * `clearExpiredCache` runs on every `getCachedDashboardQueries` call.
 * When `Date.now() - cacheTimestamp > TTL` the entire cache is wiped and
 * `cacheTimestamp` is reset to the current Date.now().
 *
 * Because state is module-level we must:
 * 1. Control time via setSystemTime (bun:test) to drive TTL deterministically.
 * 2. Clear the cache before each test by jumping the clock far enough ahead to
 *    guarantee expiry (regardless of prior cacheTimestamp), then jumping to the
 *    test's chosen epoch and expiring again so cacheTimestamp equals BASE_TIME.
 *
 * Reset protocol:
 *   a. Set time to MAX_SAFE_INTEGER/2 — always > (cacheTimestamp + TTL).
 *      getCachedDashboardQueries triggers wipe; cacheTimestamp = MAX_SAFE.
 *   b. Set time to BASE_TIME + TTL + 1 — now > (MAX_SAFE + TTL) is false...
 *      Actually simpler: just wipe with a time that is always MAX_SAFE, then
 *      set time to BASE_TIME and ensure cacheTimestamp = BASE_TIME by making
 *      BASE_TIME always equal to the time set in step (a): use step-a time as BASE_TIME.
 *
 * Cleanest approach: BASE_TIME advances by 2*(TTL+1) per test, always ensuring
 * (currentEpoch - previousCacheTimestamp) > TTL when we reset.
 */

const TTL = getCacheTTL() // 300_000 ms (5 min)

/** Each test uses its own epoch, BASE_TIME steps forward so resets never fail. */
let BASE_TIME = 1_700_000_000_000

beforeEach(() => {
  // Advance the epoch by enough that it's always > previous cacheTimestamp + TTL.
  // On the very first run cacheTimestamp=0; afterwards it equals the prior BASE_TIME.
  // A step of (2*TTL + 2) guarantees: BASE_TIME_new - BASE_TIME_old = 2*TTL+2 > TTL ✓
  BASE_TIME += 2 * TTL + 2

  // Set clock to BASE_TIME and trigger clearExpiredCache.
  // Because BASE_TIME > (prior cacheTimestamp + TTL) the cache is wiped and
  // cacheTimestamp is set to exactly BASE_TIME.
  setSystemTime(BASE_TIME)
  getCachedDashboardQueries(0)
  // Now: cache is empty, cacheTimestamp = BASE_TIME, clock = BASE_TIME.
})

afterEach(() => {
  setSystemTime() // reset to real clock
})

// ---------------------------------------------------------------------------
// getCacheTTL
// ---------------------------------------------------------------------------
describe('getCacheTTL', () => {
  test('returns the default 5-minute TTL in milliseconds', () => {
    expect(getCacheTTL()).toBe(5 * 60 * 1000)
  })
})

// ---------------------------------------------------------------------------
// updateDashboardQueryCache / getCachedDashboardQueries — basic set/get
// ---------------------------------------------------------------------------
describe('updateDashboardQueryCache + getCachedDashboardQueries', () => {
  test('returns undefined for a host that was never cached', () => {
    expect(getCachedDashboardQueries(99)).toBeUndefined()
  })

  test('stores and retrieves a Set of queries for a host', () => {
    const queries = new Set(['SELECT 1', 'SELECT 2'])
    updateDashboardQueryCache(0, queries)

    const result = getCachedDashboardQueries(0)
    expect(result).toBeDefined()
    expect(result!.has('SELECT 1')).toBe(true)
    expect(result!.has('SELECT 2')).toBe(true)
    expect(result!.size).toBe(2)
  })

  test('stores independent entries per hostId', () => {
    updateDashboardQueryCache(0, new Set(['q-host0']))
    updateDashboardQueryCache(1, new Set(['q-host1']))

    expect(getCachedDashboardQueries(0)?.has('q-host0')).toBe(true)
    expect(getCachedDashboardQueries(0)?.has('q-host1')).toBe(false)
    expect(getCachedDashboardQueries(1)?.has('q-host1')).toBe(true)
    expect(getCachedDashboardQueries(1)?.has('q-host0')).toBe(false)
  })

  test('overwrites the previous cache entry on re-update', () => {
    updateDashboardQueryCache(0, new Set(['old']))
    updateDashboardQueryCache(0, new Set(['new']))

    const result = getCachedDashboardQueries(0)
    expect(result?.has('new')).toBe(true)
    expect(result?.has('old')).toBe(false)
  })

  test('stores a defensive copy — external mutation does not corrupt the cache', () => {
    const original = new Set(['q1', 'q2'])
    updateDashboardQueryCache(0, original)

    // Mutate the original set after caching
    original.add('injected')
    original.delete('q1')

    const cached = getCachedDashboardQueries(0)
    expect(cached?.has('q1')).toBe(true) // still present
    expect(cached?.has('injected')).toBe(false) // not injected
  })

  test('handles an empty Set', () => {
    updateDashboardQueryCache(0, new Set())
    const result = getCachedDashboardQueries(0)
    expect(result).toBeDefined()
    expect(result!.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// TTL / expiry
// ---------------------------------------------------------------------------
describe('TTL expiry', () => {
  test('cached value is available within the TTL window', () => {
    // Time: BASE_TIME (cache was just cleared → cacheTimestamp = BASE_TIME)
    updateDashboardQueryCache(0, new Set(['q']))

    // Advance to just before expiry
    setSystemTime(BASE_TIME + TTL - 1)
    expect(getCachedDashboardQueries(0)).toBeDefined()
  })

  test('cache is cleared when TTL is exceeded on the next read', () => {
    updateDashboardQueryCache(0, new Set(['q']))

    // Advance strictly past TTL: now - cacheTimestamp > TTL  ↔  TTL+1 > TTL ✓
    setSystemTime(BASE_TIME + TTL + 1)
    expect(getCachedDashboardQueries(0)).toBeUndefined()
  })

  test('boundary: exactly at TTL (not >, so not expired)', () => {
    // now - cacheTimestamp == TTL → NOT > TTL → still fresh
    updateDashboardQueryCache(0, new Set(['q']))
    setSystemTime(BASE_TIME + TTL)
    expect(getCachedDashboardQueries(0)).toBeDefined()
  })

  test('after TTL expiry, newly cached entries are accessible', () => {
    // Prime and expire the cache
    updateDashboardQueryCache(0, new Set(['stale']))
    setSystemTime(BASE_TIME + TTL + 1)

    // This get triggers clearExpiredCache, resetting cacheTimestamp to BASE_TIME+TTL+1
    getCachedDashboardQueries(0)

    // Now cache is fresh again at BASE_TIME+TTL+1
    updateDashboardQueryCache(1, new Set(['fresh']))
    expect(getCachedDashboardQueries(1)?.has('fresh')).toBe(true)
  })

  test('all hosts are evicted together when the global TTL expires', () => {
    updateDashboardQueryCache(0, new Set(['h0']))
    updateDashboardQueryCache(1, new Set(['h1']))
    updateDashboardQueryCache(2, new Set(['h2']))

    setSystemTime(BASE_TIME + TTL + 1)

    // One read triggers the global wipe
    getCachedDashboardQueries(0)

    expect(getCachedDashboardQueries(1)).toBeUndefined()
    expect(getCachedDashboardQueries(2)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// clearHostCache
// ---------------------------------------------------------------------------
describe('clearHostCache', () => {
  test('removes the entry for the specified host', () => {
    updateDashboardQueryCache(0, new Set(['q']))
    clearHostCache(0)
    expect(getCachedDashboardQueries(0)).toBeUndefined()
  })

  test('only removes the targeted host, leaving others intact', () => {
    updateDashboardQueryCache(0, new Set(['q0']))
    updateDashboardQueryCache(1, new Set(['q1']))

    clearHostCache(0)

    expect(getCachedDashboardQueries(0)).toBeUndefined()
    expect(getCachedDashboardQueries(1)?.has('q1')).toBe(true)
  })

  test('is a no-op for a host that was never cached', () => {
    expect(() => clearHostCache(999)).not.toThrow()
    expect(getCachedDashboardQueries(999)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// getCacheStats
// ---------------------------------------------------------------------------
describe('getCacheStats', () => {
  test('reports zero entries when cache is empty', () => {
    const stats = getCacheStats()
    expect(stats.entryCount).toBe(0)
    expect(stats.entries).toHaveLength(0)
  })

  test('reports correct entryCount after adding hosts', () => {
    updateDashboardQueryCache(0, new Set(['a', 'b']))
    updateDashboardQueryCache(1, new Set(['c']))

    const stats = getCacheStats()
    expect(stats.entryCount).toBe(2)
  })

  test('reports correct queryCount per host', () => {
    updateDashboardQueryCache(0, new Set(['q1', 'q2', 'q3']))
    updateDashboardQueryCache(1, new Set(['x']))

    const stats = getCacheStats()
    const host0Entry = stats.entries.find((e) => e.hostId === '0')
    const host1Entry = stats.entries.find((e) => e.hostId === '1')

    expect(host0Entry?.queryCount).toBe(3)
    expect(host1Entry?.queryCount).toBe(1)
  })

  test('returns the correct TTL value', () => {
    expect(getCacheStats().ttl).toBe(TTL)
  })

  test('lastClear reflects the cacheTimestamp set during clearExpiredCache', () => {
    // resetModuleState triggered getCachedDashboardQueries at BASE_TIME,
    // which set cacheTimestamp = BASE_TIME (inside clearExpiredCache).
    const stats = getCacheStats()
    expect(stats.lastClear).toBe(BASE_TIME)
  })

  test('entryCount decreases after clearHostCache', () => {
    updateDashboardQueryCache(0, new Set(['q']))
    updateDashboardQueryCache(1, new Set(['q']))
    clearHostCache(0)

    expect(getCacheStats().entryCount).toBe(1)
  })

  test('entryCount drops to zero after TTL expiry', () => {
    updateDashboardQueryCache(0, new Set(['q']))
    setSystemTime(BASE_TIME + TTL + 1)
    getCachedDashboardQueries(0) // triggers wipe

    expect(getCacheStats().entryCount).toBe(0)
  })
})
