import type { QueryClient } from '@tanstack/react-query'

/**
 * Helper to check if a cache key matches a path prefix.
 * Handles both string keys and array keys (used by useChartData/useTableData).
 *
 * @example
 * // String key: '/api/v1/charts/query-count'
 * // Array key: ['/api/v1/charts', 'query-count', 0, 'toStartOfHour', 24, {...}]
 */
function keyMatchesPath(key: unknown, pathPrefix: string): boolean {
  if (typeof key === 'string') {
    return key.startsWith(pathPrefix)
  }
  if (Array.isArray(key) && key.length > 0) {
    return key[0] === pathPrefix
  }
  return false
}

export async function revalidateAllData(queryClient: QueryClient) {
  await queryClient.invalidateQueries()
}

export async function revalidateCharts(queryClient: QueryClient) {
  await queryClient.invalidateQueries({
    predicate: (query) => keyMatchesPath(query.queryKey, '/api/v1/charts'),
  })
}

export async function revalidateTables(queryClient: QueryClient) {
  await queryClient.invalidateQueries({
    predicate: (query) => keyMatchesPath(query.queryKey, '/api/v1/tables'),
  })
}

export async function revalidateByPattern(
  queryClient: QueryClient,
  pattern: string
) {
  await queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey
      if (typeof key === 'string') {
        return key.includes(pattern)
      }
      if (Array.isArray(key)) {
        return key.some(
          (part) => typeof part === 'string' && part.includes(pattern)
        )
      }
      return false
    },
  })
}
