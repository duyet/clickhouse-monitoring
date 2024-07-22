'use server'

import { revalidateTag, unstable_cache } from 'next/cache'
import { fetchData } from './clickhouse'

const CLICKHOUSE_CACHE_TAG = 'clickhouse_results'

export const fetchDataWithCache = unstable_cache(fetchData, [
  CLICKHOUSE_CACHE_TAG,
])

export const revalidateClickHouse = async () => {
  revalidateTag(CLICKHOUSE_CACHE_TAG)
}
