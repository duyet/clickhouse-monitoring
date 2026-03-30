import { CLICKHOUSE_CACHE_TAG, getQueryCache } from './cache'
import { fetchData } from './clickhouse'

export { CLICKHOUSE_CACHE_TAG }

const NEXT_QUERY_CACHE_TTL = parseInt(
  process.env.NEXT_QUERY_CACHE_TTL || '3600',
  10
)

export async function fetchDataWithCache(
  param: Parameters<typeof fetchData>[0]
) {
  const cache = getQueryCache()
  return cache.wrap(() => fetchData(param), {
    tags: [CLICKHOUSE_CACHE_TAG],
    ttlSeconds: NEXT_QUERY_CACHE_TTL,
  })
}
