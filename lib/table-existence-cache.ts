import { getClient } from '@/lib/clickhouse'

export type TableExistenceEntry = {
  exists: boolean
  timestamp: number
}

export type TableExistenceCache = Map<string, TableExistenceEntry>

const TABLE_EXISTENCE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

class TableExistenceCacheManager {
  private cache: TableExistenceCache = new Map()

  private getCacheKey(hostId: number, database: string, table: string): string {
    return `${hostId}:${database}.${table}`
  }

  private isExpired(entry: TableExistenceEntry): boolean {
    return Date.now() - entry.timestamp > TABLE_EXISTENCE_CACHE_TTL
  }

  async checkTableExists(
    hostId: number,
    database: string,
    table: string
  ): Promise<boolean> {
    const cacheKey = this.getCacheKey(hostId, database, table)
    const cachedEntry = this.cache.get(cacheKey)

    if (cachedEntry && !this.isExpired(cachedEntry)) {
      return cachedEntry.exists
    }

    try {
      const client = await getClient({ web: false, hostId })
      const result = await client.query({
        query: `SELECT COUNT() as count FROM system.tables WHERE database = {database: String} AND name = {table: String}`,
        query_params: { database, table },
        format: 'JSONEachRow',
      })

      const data = (await result.json()) as { count: string }[]
      const exists = parseInt(data?.[0]?.count || '0') > 0

      this.cache.set(cacheKey, {
        exists,
        timestamp: Date.now(),
      })

      return exists
    } catch (error) {
      console.error(
        `Error checking table existence for ${database}.${table}:`,
        error
      )
      return false
    }
  }

  invalidate(hostId: number, database: string, table: string): void {
    const cacheKey = this.getCacheKey(hostId, database, table)
    this.cache.delete(cacheKey)
  }

  clear(): void {
    this.cache.clear()
  }

  getCacheSize(): number {
    return this.cache.size
  }
}

export const tableExistenceCache = new TableExistenceCacheManager()
