/**
 * useOverviewData Hook
 *
 * SWR hook for fetching overview page metrics in a single batch request.
 * This replaces the 4+ separate SWR calls that were causing N+1 query problems.
 *
 * Returns all overview data needed for the 4 overview cards:
 * - Running queries count
 * - Today's query count
 * - Database and table counts
 * - Disk usage information
 * - ClickHouse version and uptime
 */

'use client'

import useSWR from 'swr'

import { useHostId } from './use-host'

/** Response from /api/v1/overview endpoint */
export interface OverviewData {
  runningQueries: number
  todayQueries: number
  databaseCount: number
  tableCount: number
  diskUsage: {
    used: string
    total: string
    percent: number
    usedBytes: number
    totalBytes: number
  }
  hostInfo: {
    version: string
    uptime: string
    hostname: string
  }
}

/** API response wrapper */
interface OverviewApiResponse {
  success: boolean
  data?: OverviewData
  error?: string
}

export interface UseOverviewDataResult {
  data: OverviewData | null
  error: Error | undefined
  isLoading: boolean
  isValidating: boolean
  mutate: () => Promise<unknown>
}

export interface UseOverviewDataOptions {
  /**
   * Refresh interval in milliseconds
   * @default 15000 (15 seconds - fast refresh for real-time metrics)
   */
  refreshInterval?: number
}

/**
 * Hook to fetch overview metrics using SWR
 * Makes GET request to /api/v1/overview?hostId=X
 *
 * @param options - SWR configuration options
 * @returns SWR state object with data, error, isLoading, isValidating, and mutate function
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useOverviewData({ refreshInterval: 15000 })
 * // data.runningQueries - current running query count
 * // data.todayQueries - total queries executed today
 * // ```
 */
export function useOverviewData(
  options: UseOverviewDataOptions = {}
): UseOverviewDataResult {
  const { refreshInterval = 15000 } = options
  const hostId = useHostId()

  const fetcher = async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      const errorData = (await response
        .json()
        .catch(() => ({}))) as OverviewApiResponse
      throw new Error(
        errorData.error || `Failed to fetch overview: ${response.statusText}`
      )
    }
    const json: OverviewApiResponse = await response.json()
    if (!json.success || !json.data) {
      throw new Error(json.error || 'No data returned')
    }
    return json.data
  }

  const { data, error, isLoading, isValidating, mutate } = useSWR<OverviewData>(
    hostId !== null ? `/api/v1/overview?hostId=${hostId}` : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  )

  return {
    data: data ?? null,
    error,
    isLoading,
    isValidating,
    mutate,
  }
}
