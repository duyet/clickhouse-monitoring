'use client'

import useSWR, { type SWRConfiguration } from 'swr'

import type { ApiResponseMetadata } from '@/lib/api/types'
import type {
  ChartDataPoint,
  ChartQueryParams as TypedChartQueryParams,
} from '@/types/chart-data'

import { REFRESH_INTERVAL, type RefreshInterval } from './config'
import { useCallback } from 'react'

/**
 * Chart metadata - re-export ApiResponseMetadata for convenience
 * This ensures the same type is used on both API and frontend
 */
export type ChartMetadata = ApiResponseMetadata

/**
 * Chart data response structure from the API
 * Can be either an array (single query) or an object (multi-query)
 */
interface ChartDataResponse<T = unknown> {
  data: T[] | Record<string, unknown>
  metadata: ChartMetadata
}

/** Return type from useChartData hook */
export interface UseChartResult<TData extends ChartDataPoint = ChartDataPoint> {
  data: TData[]
  metadata?: ChartMetadata
  sql?: string
  error?: Error
  isLoading: boolean
  isValidating: boolean
  mutate: () => Promise<undefined | unknown>
}

export type SwrConfigPreset = keyof typeof REFRESH_INTERVAL | SWRConfiguration

export interface UseChartDataParams {
  chartName: string
  hostId?: number | string
  interval?: string
  lastHours?: number
  params?: TypedChartQueryParams['params']
  /** Refresh interval in ms OR use REFRESH_INTERVAL constants */
  refreshInterval?: RefreshInterval | number
  /** Additional SWR config options */
  swrConfig?: SWRConfiguration
}

/**
 * Hook to fetch chart data using SWR
 * Makes GET request to /api/v1/charts/[chartName]
 *
 * @template T - The chart data point type
 * @param {UseChartDataParams} params - Configuration object
 * @returns {UseChartResult<T>} SWR state object with data array, metadata, error, isLoading, isValidating, and mutate function
 *
 * @example
 * ```typescript
 * // Using default refresh interval (30s)
 * const { data, metadata, error, isLoading } = useChartData({
 *   chartName: 'query-performance',
 *   hostId: 1,
 *   interval: 'toStartOfHour',
 *   lastHours: 24,
 * })
 *
 * // Using preset refresh interval
 * import { REFRESH_INTERVAL } from '@/lib/swr/config'
 * const { data } = useChartData({
 *   chartName: 'query-performance',
 *   refreshInterval: REFRESH_INTERVAL.FAST_10S,
 * })
 * ```
 */
export function useChartData<T extends ChartDataPoint = ChartDataPoint>({
  chartName,
  hostId,
  interval,
  lastHours,
  params,
  refreshInterval = REFRESH_INTERVAL.DEFAULT_30S,
  swrConfig,
}: UseChartDataParams): UseChartResult<T> {
  // Build query parameters
  const searchParams = new URLSearchParams()
  if (hostId !== undefined) searchParams.append('hostId', String(hostId))
  if (interval) searchParams.append('interval', interval)
  // Only include lastHours if it's defined (undefined = "all" range, no time filter)
  if (lastHours !== undefined)
    searchParams.append('lastHours', String(lastHours))
  if (params) searchParams.append('params', JSON.stringify(params))

  const queryString = searchParams.toString()
  const url = `/api/v1/charts/${chartName}${queryString ? `?${queryString}` : ''}`

  // Build cache key
  const key = ['/api/v1/charts', chartName, hostId, interval, lastHours, params]

  // Fetcher function (memoized with useCallback to prevent recreation on every render)
  const fetcher = useCallback(async () => {
    const response = await fetch(url)

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: {
          message?: string
          type?: string
          details?: {
            missingTables?: readonly string[]
            [key: string]: unknown
          }
        }
      }
      const error = new Error(
        errorData.error?.message ||
          `Failed to fetch chart data: ${response.statusText}`
      ) as Error & {
        type?: string
        details?: { missingTables?: readonly string[]; [key: string]: unknown }
      }

      // Attach error metadata if available
      if (errorData.error) {
        error.type = errorData.error.type
        error.details = errorData.error.details
      }

      throw error
    }

    return response.json() as Promise<ChartDataResponse<T>>
  }, [url])

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ChartDataResponse<T>,
    Error
  >(key, fetcher, {
    revalidateIfStale: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    focusThrottleInterval: 5000,
    refreshInterval: refreshInterval > 0 ? refreshInterval : 0,
    ...swrConfig,
  })

  // Handle both array (single query) and object (multi-query) data structures
  // Multi-query charts return: { main: [...], totalMem: [...], ... }
  // Single-query charts return: [{ ... }, { ... }, ... ]
  const dataArray =
    Array.isArray(data?.data) || !data?.data
      ? (data?.data as T[])
      : ([data.data] as T[])

  return {
    data: dataArray,
    metadata: data?.metadata,
    sql: data?.metadata?.sql,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
