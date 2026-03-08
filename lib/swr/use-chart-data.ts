'use client'

import useSWR, { type SWRConfiguration } from 'swr'

import type { ApiResponseMetadata } from '@/lib/api/types'
import type {
  ChartDataPoint,
  ChartQueryParams as TypedChartQueryParams,
} from '@/types/chart-data'

import { fetchViaBrowserProxy } from './browser-proxy-fetcher'
import {
  onErrorRetry,
  REFRESH_INTERVAL,
  type RefreshInterval,
  visibilityAwareInterval,
} from './config'
import { useCallback, useMemo, useRef } from 'react'
import { getChartQuery } from '@/lib/api/chart-registry'
import { useBrowserConnectionsContext } from '@/lib/context/browser-connections-context'
import { useUserSettings } from '@/lib/hooks/use-user-settings'
import { getSqlForDisplay } from '@/types/query-config'

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

/** Error from a failed revalidation (data is stale) */
export interface StaleError extends Error {
  timestamp: number
  type?: string
  details?: { missingTables?: readonly string[]; [key: string]: unknown }
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
  /** True when data exists (even if stale due to revalidation error) */
  hasData: boolean
  /** Error from failed revalidation (only set when data exists but refresh failed) */
  staleError?: StaleError
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
 *   refreshInterval: REFRESH_INTERVAL.FAST_15S,
 * })
 * ```
 */
export function useChartData<T extends ChartDataPoint = ChartDataPoint>({
  chartName,
  hostId,
  interval,
  lastHours,
  params,
  refreshInterval = REFRESH_INTERVAL.DEFAULT_60S,
  swrConfig,
}: UseChartDataParams): UseChartResult<T> {
  // Get user settings (including timezone) for API requests
  const { settings } = useUserSettings()

  // Browser connections context (for negative hostId proxy routing)
  const { getConnection } = useBrowserConnectionsContext()

  const isBrowserConnection = hostId !== undefined && Number(hostId) < 0

  // --- Browser connection proxy path (negative hostId) ---
  // Build proxy fetcher key and function when hostId is negative
  const browserConnection = isBrowserConnection
    ? getConnection(Number(hostId))
    : undefined

  // Early error when browser connection is expected but missing
  const browserConnectionMissing = isBrowserConnection && !browserConnection
  const browserConnectionError = useMemo(
    () =>
      browserConnectionMissing
        ? new Error(`Browser connection not found for hostId ${String(hostId)}`)
        : undefined,
    [browserConnectionMissing, hostId]
  )

  const browserProxyKey = useMemo(() => {
    if (!isBrowserConnection || !browserConnection) return null
    return [
      '/api/v1/browser-connections/proxy',
      'chart',
      chartName,
      browserConnection.id,
      interval,
      lastHours,
      JSON.stringify(params || null),
    ]
  }, [
    isBrowserConnection,
    browserConnection,
    chartName,
    interval,
    lastHours,
    params,
  ])

  const browserProxyFetcher = useCallback(async () => {
    if (!browserConnection) {
      throw new Error(
        `Browser connection not found for hostId ${String(hostId)}`
      )
    }

    // Build SQL from the chart registry client-side
    const queryDef = getChartQuery(chartName, {
      interval: interval as TypedChartQueryParams['interval'],
      lastHours,
      params,
    })

    if (!queryDef || 'queries' in queryDef) {
      throw new Error(
        `Chart "${chartName}" not found or is a multi-query chart (not supported for browser connections)`
      )
    }

    // Resolve SQL: prefer versioned sql array (pick latest), fall back to query string
    const resolvedQuery =
      queryDef.sql && queryDef.sql.length > 0
        ? getSqlForDisplay(queryDef.sql)
        : queryDef.query

    const result = await fetchViaBrowserProxy<T>({
      connection: browserConnection,
      query: resolvedQuery!,
      queryParams: queryDef.queryParams as
        | Record<string, string | number | boolean>
        | undefined,
    })

    return result as unknown as ChartDataResponse<T>
  }, [browserConnection, chartName, interval, lastHours, params, hostId])

  // --- Normal path (non-negative hostId) ---
  // Build query parameters
  const searchParams = new URLSearchParams()
  if (hostId !== undefined) searchParams.append('hostId', String(hostId))
  if (interval) searchParams.append('interval', interval)
  // Only include lastHours if it's defined (undefined = "all" range, no time filter)
  if (lastHours !== undefined)
    searchParams.append('lastHours', String(lastHours))
  if (params) searchParams.append('params', JSON.stringify(params))
  // Pass timezone to ClickHouse for session-level time conversion
  if (settings.timezone) searchParams.append('timezone', settings.timezone)

  const queryString = searchParams.toString()
  const url = `/api/v1/charts/${chartName}${queryString ? `?${queryString}` : ''}`

  // Build cache key - stringify params to ensure consistent caching
  // (identical param objects with different references should share cache)
  // Include timezone so cache invalidates when user changes timezone
  const normalKey = [
    '/api/v1/charts',
    chartName,
    hostId,
    interval,
    lastHours,
    JSON.stringify(params || null),
    settings.timezone,
  ]

  // Fetcher function (memoized with useCallback to prevent recreation on every render)
  const normalFetcher = useCallback(async () => {
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
        status?: number
        type?: string
        details?: { missingTables?: readonly string[]; [key: string]: unknown }
      }

      // Attach HTTP status so onErrorRetry can skip retrying 4xx errors
      error.status = response.status

      // Attach error metadata if available
      if (errorData.error) {
        error.type = errorData.error.type
        error.details = errorData.error.details
      }

      throw error
    }

    return response.json() as Promise<ChartDataResponse<T>>
  }, [url])

  // Select which key/fetcher to use based on hostId sign
  const key = isBrowserConnection ? browserProxyKey : normalKey
  const fetcher = isBrowserConnection ? browserProxyFetcher : normalFetcher

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ChartDataResponse<T>,
    Error
  >(key, fetcher, {
    revalidateIfStale: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    focusThrottleInterval: 5000,
    refreshInterval:
      refreshInterval > 0 ? visibilityAwareInterval(refreshInterval) : 0,
    onErrorRetry,
    ...swrConfig,
  })

  // Handle both array (single query) and object (multi-query) data structures
  // Multi-query charts return: { main: [...], totalMem: [...], ... }
  // Single-query charts return: [{ ... }, { ... }, ... ]
  const dataArray =
    Array.isArray(data?.data) || !data?.data
      ? (data?.data as T[])
      : ([data.data] as T[])

  // Check if we have valid data (even if there's an error from revalidation)
  const hasData = Boolean(dataArray && dataArray.length > 0)

  // Track timestamp for stale errors - use ref to persist across renders
  const staleErrorTimestampRef = useRef<number>(0)

  // Create staleError only when we have data but revalidation failed
  // This distinguishes "initial load error" from "revalidation error"
  const staleError = useMemo<StaleError | undefined>(() => {
    if (!error || !hasData || isLoading) {
      // No error, no data, or still loading - clear stale error
      staleErrorTimestampRef.current = 0
      return undefined
    }

    // We have data AND an error (revalidation failed)
    // Use existing timestamp if this is the same error, otherwise create new
    if (staleErrorTimestampRef.current === 0) {
      staleErrorTimestampRef.current = Date.now()
    }

    return {
      ...error,
      name: error.name,
      message: error.message,
      timestamp: staleErrorTimestampRef.current,
      type: (error as Error & { type?: string }).type,
      details: (error as Error & { details?: StaleError['details'] }).details,
    }
  }, [error, hasData, isLoading])

  return {
    data: dataArray,
    metadata: data?.metadata,
    sql: data?.metadata?.sql,
    error: browserConnectionError || error,
    isLoading: browserConnectionError ? false : isLoading,
    isValidating,
    mutate,
    hasData,
    staleError,
  }
}
