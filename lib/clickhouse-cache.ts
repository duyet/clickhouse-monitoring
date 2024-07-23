import { unstable_cache } from 'next/cache'
import { fetchData } from './clickhouse'

export const CLICKHOUSE_CACHE_TAG = 'clickhouse_results'

const NEXT_QUERY_CACHE_TTL = parseInt(
  process.env.NEXT_QUERY_CACHE_TTL || '3600'
) // 60 minutes by default

export const fetchDataWithCache = unstable_cache(
  fetchData,
  [CLICKHOUSE_CACHE_TAG],
  {
    tags: [CLICKHOUSE_CACHE_TAG],
    revalidate: NEXT_QUERY_CACHE_TTL,
  }
)
