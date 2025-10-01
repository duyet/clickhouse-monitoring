import { getClient } from '@/lib/clickhouse'
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, boolean>({
  ttl: 5 * 60 * 1000, // 5 minutes
  max: 1000, // optional max entries
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
    const client = await getClient({ web: false, hostId })
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
    console.error(`Error checking table ${database}.${table}:`, err)
    return false
  }
}

// If you still need manual invalidation/metrics:
export const invalidateTable = (
  hostId: number,
  database: string,
  table: string
) => {
  cache.delete(`${hostId}:${database}.${table}`)
}
export const clearTableCache = () => cache.clear()
export const tableCacheSize = () => cache.size

// Keep the old interface for backward compatibility
export const tableExistenceCache = {
  checkTableExists,
  invalidate: invalidateTable,
  clear: clearTableCache,
  getCacheSize: tableCacheSize,
}
