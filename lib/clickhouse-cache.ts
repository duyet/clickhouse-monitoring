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

  // Build a unique cache key from query + params + hostId to prevent collisions
  const queryKey = typeof param.query === 'string' ? param.query : ''
  const paramsKey = param.query_params ? JSON.stringify(param.query_params) : ''
  const hostKey = String(param.hostId ?? 0)

  return cache.wrap(() => fetchData(param), {
    key: [hostKey, queryKey, paramsKey],
    tags: [CLICKHOUSE_CACHE_TAG],
    ttlSeconds: NEXT_QUERY_CACHE_TTL,
  })
}
