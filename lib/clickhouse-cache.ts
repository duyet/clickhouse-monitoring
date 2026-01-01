import { fetchData } from './clickhouse'
import { unstable_cache as cache } from 'next/cache'

export const CLICKHOUSE_CACHE_TAG = 'clickhouse_results'

const NEXT_QUERY_CACHE_TTL = parseInt(
  process.env.NEXT_QUERY_CACHE_TTL || '3600',
  10 // Specify radix parameter
) // 60 minutes by default

export const fetchDataWithCache = cache(
  (param: (typeof fetchData.arguments)[0]) => fetchData(param),
  undefined,
  {
    tags: [CLICKHOUSE_CACHE_TAG],
    revalidate: NEXT_QUERY_CACHE_TTL,
  }
)
