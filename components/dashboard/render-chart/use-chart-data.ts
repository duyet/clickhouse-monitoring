/**
 * Custom hook for fetching and validating chart data
 */

import { useFetchData } from '@/lib/swr'
import type { ChartParams, TimeSeriesDataPoint } from './types'

interface UseChartDataOptions {
  query: string
  params: ChartParams
  hostId: number
  refreshInterval?: number
}

/**
 * Validates that chart data has the required event_time field
 */
function validateChartData(data: TimeSeriesDataPoint[] | undefined): boolean {
  return !!(data && data[0]?.event_time)
}

/**
 * Extracts categories (all columns except event_time) from chart data
 */
export function extractCategories(data: TimeSeriesDataPoint[]): string[] {
  return Object.keys(data[0]).filter((c) => c !== 'event_time')
}

/**
 * Hook for fetching and validating chart data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, categories, isValid, refresh } = useChartData({
 *   query: 'SELECT event_time, value FROM...',
 *   params: { lastHours: 24 },
 *   hostId: 0,
 * })
 * ```
 */
export function useChartData({
  query,
  params,
  hostId,
  refreshInterval = 30000,
}: UseChartDataOptions) {
  // Filter out undefined values from params to match useFetchData type
  const queryParams = Object.fromEntries(
    Object.entries(params || {}).filter(([_, v]) => v !== undefined)
  ) as Record<string, string | number | boolean>

  const { data, isLoading, error, refresh } = useFetchData<
    TimeSeriesDataPoint[]
  >(query, queryParams, hostId, refreshInterval)

  const isValid = validateChartData(data)
  const categories = isValid && data ? extractCategories(data) : []

  return {
    data,
    isLoading,
    error,
    categories,
    isValid,
    refresh,
  }
}
