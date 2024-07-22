import { unstable_cache } from 'next/cache'
import { fetchData } from './clickhouse'

export const CLICKHOUSE_CACHE_TAG = 'clickhouse_results'

export const fetchDataWithCache = unstable_cache(fetchData, [
  CLICKHOUSE_CACHE_TAG,
])
