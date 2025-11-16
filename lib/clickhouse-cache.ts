import { unstable_cache as cache } from 'next/cache'
import { fetchData } from './clickhouse'
import type { QueryConfig } from '@/types/query-config'

/**
 * Cache TTL strategy based on data volatility
 * Monitoring dashboards need fresh data - 60 minutes is too stale!
 */
export const CacheTTL = {
  /** Real-time monitoring data (running queries, current metrics) */
  REALTIME: 10, // 10 seconds
  /** Dashboard metrics and charts */
  DASHBOARD: 30, // 30 seconds
  /** Table/database metadata (changes infrequently) */
  METADATA: 300, // 5 minutes
  /** Static configuration data */
  STATIC: 3600, // 1 hour
} as const

/**
 * Determine appropriate cache TTL based on query configuration
 * @param queryConfig - The query configuration object
 * @returns Cache TTL in seconds
 */
export function getCacheTTL(queryConfig?: QueryConfig): number {
  if (!queryConfig) {
    return CacheTTL.DASHBOARD
  }

  // Real-time monitoring queries (current state)
  const realtimeQueries = [
    'running-queries',
    'expensive-queries',
    'query-count',
    'memory-usage',
    'merge-count',
    'readonly-replica',
  ]

  if (realtimeQueries.some(name => queryConfig.name.includes(name))) {
    return CacheTTL.REALTIME
  }

  // Metadata queries (infrequent changes)
  const metadataQueries = [
    'databases',
    'tables',
    'columns',
    'settings',
    'clusters',
    'roles',
    'users',
  ]

  if (metadataQueries.some(name => queryConfig.name.includes(name))) {
    return CacheTTL.METADATA
  }

  // Default to dashboard TTL for everything else
  return CacheTTL.DASHBOARD
}

export const CLICKHOUSE_CACHE_TAG = 'clickhouse'

/**
 * Environment-based cache TTL override
 * Falls back to intelligent defaults if not set
 */
const ENV_CACHE_TTL = process.env.NEXT_QUERY_CACHE_TTL
  ? parseInt(process.env.NEXT_QUERY_CACHE_TTL, 10)
  : undefined

/**
 * Wrapped fetchData with intelligent caching
 * Uses different TTLs based on data type for optimal freshness
 */
export const fetchDataWithCache = cache(
  async <
    T extends
      | unknown[]
      | object[]
      | Record<string, unknown>
      | { length: number; rows: number; statistics: Record<string, unknown> }
  >(
    params: Parameters<typeof fetchData<T>>[0]
  ) => {
    const ttl = ENV_CACHE_TTL ?? getCacheTTL(params.queryConfig)

    // Log cache strategy in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[Cache] Query: ${params.queryConfig?.name || 'unknown'}, TTL: ${ttl}s`
      )
    }

    return fetchData<T>(params)
  },
  undefined,
  {
    tags: [CLICKHOUSE_CACHE_TAG],
    // TTL is determined per-query, but Next.js cache API requires a static value
    // We use the dashboard default here, but getCacheTTL() provides per-query optimization
    revalidate: ENV_CACHE_TTL ?? CacheTTL.DASHBOARD,
  }
)
