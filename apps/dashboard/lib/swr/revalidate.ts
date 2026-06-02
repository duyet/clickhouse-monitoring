'use client'

import { mutate } from 'swr'

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

export async function revalidateAllData() {
  await mutate(() => true, undefined, { revalidate: true })
}

export async function revalidateCharts() {
  await mutate((key) => keyMatchesPath(key, '/api/v1/charts'), undefined, {
    revalidate: true,
  })
}

export async function revalidateTables() {
  await mutate((key) => keyMatchesPath(key, '/api/v1/tables'), undefined, {
    revalidate: true,
  })
}

export async function revalidateByPattern(pattern: string) {
  await mutate(
    (key) => {
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
    undefined,
    { revalidate: true }
  )
}
