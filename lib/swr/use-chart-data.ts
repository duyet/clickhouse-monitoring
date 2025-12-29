'use client'

import useSWR, { type SWRConfiguration } from 'swr'

/**
 * Chart data response structure from the API
 */
interface ChartDataResponse<T = unknown> {
  data: T[]
  metadata: {
    duration?: number
    rows?: number
    rows_before_limit_at_least?: number
    exception?: string
    message?: string
  }
}

export interface UseChartDataParams {
  chartName: string
  hostId?: number | string
  interval?: string
  lastHours?: number
  params?: Record<string, unknown>
  refreshInterval?: number
  swrConfig?: SWRConfiguration
}

/**
 * Hook to fetch chart data using SWR
 * Makes GET request to /api/v1/charts/[chartName]
 *
 * @template T - The chart data point type
 * @param {UseChartDataParams} params - Configuration object
 * @returns {Object} SWR state object with data array, metadata, error, isLoading, and refresh function
 *
 * @example
 * ```typescript
 * const { data, metadata, error, isLoading, mutate } = useChartData({
 *   chartName: 'query-performance',
 *   hostId: 1,
 *   interval: 'toStartOfHour',
 *   lastHours: 24,
 *   refreshInterval: 30000
 * })
 * ```
 */
export function useChartData<T = unknown>({
  chartName,
  hostId,
  interval,
  lastHours,
  params,
  refreshInterval = 30000,
  swrConfig,
}: UseChartDataParams) {
  // Build query parameters
  const searchParams = new URLSearchParams()
  if (hostId !== undefined) searchParams.append('hostId', String(hostId))
  if (interval) searchParams.append('interval', interval)
  if (lastHours !== undefined)
    searchParams.append('lastHours', String(lastHours))
  if (params) searchParams.append('params', JSON.stringify(params))

  const queryString = searchParams.toString()
  const url = `/api/v1/charts/${chartName}${queryString ? `?${queryString}` : ''}`

  // Build cache key
  const key = ['/api/v1/charts', chartName, hostId, interval, lastHours, params]

  // Fetcher function
  const fetcher = async () => {
    const response = await fetch(url)

    if (!response.ok) {
      const errorData = (await response
        .json()
        .catch(() => ({}))) as {
        error?: { message?: string; type?: string; details?: Record<string, unknown> }
      }
      const error = new Error(
        errorData.error?.message ||
          `Failed to fetch chart data: ${response.statusText}`
      ) as Error & { type?: string; details?: Record<string, unknown> }

      // Attach error metadata if available
      if (errorData.error) {
        error.type = errorData.error.type
        error.details = errorData.error.details
      }

      throw error
    }

    return response.json() as Promise<ChartDataResponse<T>>
  }

  const { data, error, isLoading, mutate } = useSWR<
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

  return {
    data: data?.data || [],
    metadata: data?.metadata,
    error,
    isLoading,
    refresh: mutate,
  }
}
