/**
 * Cache Manager for Dashboard Queries
 *
 * Manages in-memory caching of valid dashboard queries to avoid repeated
 * database lookups. Uses time-based cache invalidation (TTL).
 *
 * @module app/api/v1/data/utils/cache-manager
 */

/** Cache entry for dashboard queries with timestamp */
interface CacheEntry {
  readonly queries: Set<string>
  readonly timestamp: number
}

/** Cache storage map */
const cache = new Map<string, CacheEntry>()

/** Cache timestamp for tracking last invalidation */
let cacheTimestamp = 0

/** Default cache TTL: 5 minutes */
const DEFAULT_CACHE_TTL = 5 * 60 * 1000

/** Current TTL value (can be configured) */
let currentCacheTTL = DEFAULT_CACHE_TTL

/**
 * Get the current cache TTL in milliseconds
 */
export function getCacheTTL(): number {
  return currentCacheTTL
}

/**
 * Set a custom cache TTL (for testing or configuration)
 *
 * @param ttl - Time to live in milliseconds
 */
export function setCacheTTL(ttl: number): void {
  currentCacheTTL = ttl
}

/**
 * Reset the cache TTL to default
 */
export function resetCacheTTL(): void {
  currentCacheTTL = DEFAULT_CACHE_TTL
}

/**
 * Check if the cache has expired and needs to be cleared
 *
 * @returns True if cache is stale and should be cleared
 */
function isCacheExpired(): boolean {
  const now = Date.now()
  return now - cacheTimestamp > currentCacheTTL
}

/**
 * Clear expired cache entries
 * Called automatically when accessing cached data
 */
function clearExpiredCache(): void {
  if (isCacheExpired()) {
    cache.clear()
    cacheTimestamp = Date.now()
  }
}

/**
 * Get cached dashboard queries for a specific host
 *
 * @param hostId - The host identifier
 * @returns Set of valid queries or undefined if not cached/expired
 *
 * @example
 * ```ts
 * const queries = getCachedDashboardQueries(0)
 * if (queries?.has('SELECT count() FROM system.tables')) {
 *   // Query is valid
 * }
 * ```
 */
export function getCachedDashboardQueries(
  hostId: number
): Set<string> | undefined {
  clearExpiredCache()

  const cacheKey = String(hostId)
  const entry = cache.get(cacheKey)

  return entry?.queries
}

/**
 * Update the cache with new queries for a specific host
 *
 * @param hostId - The host identifier
 * @param queries - Set of valid queries to cache
 *
 * @example
 * ```ts
 * const queries = new Set(['SELECT count() FROM system.tables'])
 * updateDashboardQueryCache(0, queries)
 * ```
 */
export function updateDashboardQueryCache(
  hostId: number,
  queries: Set<string>
): void {
  const cacheKey = String(hostId)

  cache.set(cacheKey, {
    queries: new Set(queries), // Create a copy to prevent external mutation
    timestamp: Date.now(),
  })
}

/**
 * Clear all cached dashboard queries
 * Useful for testing or manual cache invalidation
 *
 * @example
 * ```ts
 * clearAllCache()
 * ```
 */
export function clearAllCache(): void {
  cache.clear()
  cacheTimestamp = Date.now()
}

/**
 * Clear cache for a specific host
 *
 * @param hostId - The host identifier
 *
 * @example
 * ```ts
 * clearHostCache(0)
 * ```
 */
export function clearHostCache(hostId: number): void {
  const cacheKey = String(hostId)
  cache.delete(cacheKey)
}

/**
 * Get cache statistics for monitoring/debugging
 *
 * @returns Object with cache stats
 *
 * @example
 * ```ts
 * const stats = getCacheStats()
 * console.log(`Cache entries: ${stats.entryCount}, TTL: ${stats.ttl}ms`)
 * ```
 */
export function getCacheStats(): {
  readonly entryCount: number
  readonly ttl: number
  readonly lastClear: number
  readonly entries: ReadonlyArray<{
    readonly hostId: string
    readonly queryCount: number
  }>
} {
  return {
    entryCount: cache.size,
    ttl: currentCacheTTL,
    lastClear: cacheTimestamp,
    entries: Array.from(cache.entries()).map(([hostId, entry]) => ({
      hostId,
      queryCount: entry.queries.size,
    })),
  }
}

/**
 * Check if a specific query is cached for a host
 *
 * @param hostId - The host identifier
 * @param query - The query string to check
 * @returns True if the query is in the cache
 *
 * @example
 * ```ts
 * if (isQueryCached(0, 'SELECT count() FROM system.tables')) {
 *   // Query is cached
 * }
 * ```
 */
export function isQueryCached(hostId: number, query: string): boolean {
  const queries = getCachedDashboardQueries(hostId)
  return queries?.has(query) ?? false
}
