'use client'

import { mutate } from 'swr'

import type { PrefetchConfig } from './route-prefetch-map'

import { routePrefetchMap } from './route-prefetch-map'

/**
 * Prefetch chart data and seed the SWR cache.
 * Uses the same cache key structure as useChartData:
 * ['/api/v1/charts', chartName, hostId, interval, lastHours, JSON.stringify(params || null), timezone]
 *
 * For prefetching we use undefined for optional params (interval, lastHours, params, timezone)
 * since the default overview charts are fetched without these params.
 */
function prefetchChart(chartName: string, hostId: number): void {
  const url = `/api/v1/charts/${chartName}?hostId=${hostId}`
  const key = [
    '/api/v1/charts',
    chartName,
    hostId,
    undefined, // interval
    undefined, // lastHours
    JSON.stringify(null), // params
    null, // timezone (null = no timezone preference)
  ]

  fetch(url)
    .then((res) => {
      if (!res.ok) return
      return res.json()
    })
    .then((data) => {
      if (data === undefined) return
      mutate(key, data, { revalidate: false })
    })
    .catch(() => {
      // Silently ignore prefetch failures — they're best-effort
    })
}

/**
 * Prefetch table data and seed the SWR cache.
 * Uses the same cache key structure as useTableData:
 * ['/api/v1/tables', queryConfigName, hostId, JSON.stringify(searchParams || {}), timezone]
 */
function prefetchTable(tableName: string, hostId: number): void {
  const url = `/api/v1/tables/${tableName}?hostId=${hostId}`
  const key = [
    '/api/v1/tables',
    tableName,
    hostId,
    JSON.stringify({}), // searchParams
    null, // timezone (null = no timezone preference)
  ]

  fetch(url)
    .then((res) => {
      if (!res.ok) return
      return res.json()
    })
    .then((data) => {
      if (data === undefined) return
      mutate(key, data, { revalidate: false })
    })
    .catch(() => {
      // Silently ignore prefetch failures — they're best-effort
    })
}

/** Dedup guard: tracks in-flight prefetches to avoid flooding on rapid mouse movements */
const inflight = new Set<string>()

/**
 * Prefetch all data for a route by pre-populating the SWR cache.
 * Called on nav link hover via requestIdleCallback to avoid blocking interaction.
 *
 * No-ops if the route has no prefetch config or a prefetch for the same
 * route+host is already in flight.
 */
export function prefetchRoute(route: string, hostId: number): void {
  const config: PrefetchConfig | undefined = routePrefetchMap[route]
  if (!config) return

  const dedupKey = `${route}:${hostId}`
  if (inflight.has(dedupKey)) return
  inflight.add(dedupKey)

  // Clear dedup key after 5s (matches SWR global dedupingInterval)
  setTimeout(() => inflight.delete(dedupKey), 5000)

  config.charts?.forEach((name) => prefetchChart(name, hostId))
  config.tables?.forEach((name) => prefetchTable(name, hostId))
}
