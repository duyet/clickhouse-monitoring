import type { QueryCacheAdapter } from './types'

import { MemoryCacheAdapter } from './adapters/memory-cache'
import { NextCacheAdapter } from './adapters/next-cache'
import { debug } from '@/lib/logger'

export const CLICKHOUSE_CACHE_TAG = 'clickhouse_results'

export type { CacheOptions, QueryCacheAdapter } from './types'

let cacheInstance: QueryCacheAdapter | null = null
let memoryCacheInstance: MemoryCacheAdapter | null = null

export function getQueryCache(): QueryCacheAdapter {
  if (cacheInstance) return cacheInstance

  debug('[query-cache] Initializing query cache adapter')
  cacheInstance = new NextCacheAdapter()
  return cacheInstance
}

export function getMemoryCache(): QueryCacheAdapter {
  if (memoryCacheInstance) return memoryCacheInstance
  memoryCacheInstance = new MemoryCacheAdapter()
  return memoryCacheInstance
}

export function resetQueryCacheInstance(): void {
  cacheInstance = null
}
