import { CLICKHOUSE_CACHE_TAG, getQueryCache } from './cache'
import { fetchData } from './clickhouse'

export { CLICKHOUSE_CACHE_TAG }

const rawTtl = parseInt(process.env.NEXT_QUERY_CACHE_TTL || '3600', 10)
const NEXT_QUERY_CACHE_TTL = Number.isNaN(rawTtl) ? 3600 : rawTtl

export async function fetchDataWithCache(
  param: Parameters<typeof fetchData>[0]
) {
  const cache = getQueryCache()

  // Build a unique cache key from query + params + hostId to prevent collisions
  const queryKey = typeof param.query === 'string' ? param.query : ''
  const paramsKey = param.query_params ? JSON.stringify(param.query_params) : ''
  const hostKey = String(param.hostId)

  return cache.wrap(() => fetchData(param), {
    key: [hostKey, queryKey, paramsKey],
    tags: [CLICKHOUSE_CACHE_TAG],
    ttlSeconds: NEXT_QUERY_CACHE_TTL,
  })
}
