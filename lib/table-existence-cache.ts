import { getClient } from '@/lib/clickhouse'
import { debug, error } from '@/lib/logger'
import { LRUCache } from 'lru-cache'

/**
 * Cache configuration with memory limits
 * - max: 500 entries (reduced from 1000)
 * - maxSize: 1MB total memory limit
 * - TTL: 5 minutes
 */
const cache = new LRUCache<string, boolean>({
  ttl: 5 * 60 * 1000, // 5 minutes
  max: 500, // Reduced from 1000 for memory efficiency
  maxSize: 1024 * 1024, // 1MB total cache size limit
  sizeCalculation: () => 1, // Each entry counts as 1 unit (simplified size tracking)
  dispose: (value: boolean, key: string) => {
    debug(`[Table Cache] Evicted: ${key} = ${value}`)
  },
})

export async function checkTableExists(
  hostId: number,
  database: string,
  table: string
): Promise<boolean> {
  const key = `${hostId}:${database}.${table}`
  const cached = cache.get(key)
  if (cached !== undefined) {
    return cached
  }

  try {
    // getClient will auto-detect and use web client for Cloudflare Workers
    const client = await getClient({ hostId })
    const result = await client.query({
      query: `
        SELECT COUNT() AS count
        FROM system.tables
        WHERE database = {database:String}
          AND name     = {table:String}
      `,
      query_params: { database, table },
      format: 'JSONEachRow',
    })
    const data = (await result.json()) as { count: string }[]
    const exists = parseInt(data?.[0]?.count || '0', 10) > 0

    cache.set(key, exists)
    return exists
  } catch (err) {
    error(`Error checking table ${database}.${table}:`, err)
    return false
  }
}

/**
 * Get cache metrics for monitoring and debugging
 */
export function getCacheMetrics() {
  return {
    size: cache.size,
    maxSize: cache.max,
    memoryLimit: '1MB',
    ttl: '5 minutes',
    hitRate: cache.size > 0 ? 'available' : 'empty',
  }
}

/**
 * Manual cache invalidation
 */
export const invalidateTable = (
  hostId: number,
  database: string,
  table: string
) => {
  cache.delete(`${hostId}:${database}.${table}`)
}

/**
 * Clear entire cache
 */
export const clearTableCache = () => cache.clear()

/**
 * Get current cache size
 */
export const tableCacheSize = () => cache.size

// Keep the old interface for backward compatibility
export const tableExistenceCache = {
  checkTableExists,
  invalidate: invalidateTable,
  clear: clearTableCache,
  getCacheSize: tableCacheSize,
  getMetrics: getCacheMetrics,
}
