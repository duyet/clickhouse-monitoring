'use client'

import useSWR, { type SWRConfiguration } from 'swr'

import type { ApiResponseMetadata } from '@/lib/api/types'
import type { StaleError } from './use-chart-data'

import { useMemo, useRef } from 'react'
import { useUserSettings } from '@/lib/hooks/use-user-settings'

/**
 * Table data response structure from the API
 * Extends the standard ApiResponse with table-specific metadata
 */
interface TableDataResponse<T = unknown> {
  /** Array of table row data */
  data: T[]
  /** Response metadata including query execution info */
  metadata: ApiResponseMetadata & {
    /** Additional ClickHouse-specific metadata */
    rows_before_limit_at_least?: number
    exception?: string
  }
}

/**
 * Query parameters for table data requests
 */
interface TableQueryParams {
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
  [key: string]: string | number | boolean | undefined
}

/**
 * Hook to fetch table data using SWR
 * Makes GET request to /api/v1/tables/[queryConfigName]
 *
 * @template T - The table row data type
 * @param {string} queryConfigName - Name of the query configuration to use
 * @param {number} [hostId] - Host ID for the request
 * @param {TableQueryParams} [searchParams] - Query parameters (search, sort, pagination, etc.)
 * @param {number} [refreshInterval] - Auto-refresh interval in milliseconds (disabled if 0 or undefined)
 * @param {SWRConfiguration} [swrConfig] - Additional SWR configuration options
 * @returns {Object} SWR state object with data array, metadata, error, isLoading, isValidating, and refresh function
 *
 * @example
 * ```typescript
 * const { data, metadata, error, isLoading, isValidating, mutate } = useTableData(
 *   'tables',
 *   1,
 *   { search: 'log', page: 1, limit: 10 }
 * )
 * ```
 */
export function useTableData<T = unknown>(
  queryConfigName: string,
  hostId?: number,
  searchParams?: TableQueryParams,
  refreshInterval?: number,
  swrConfig?: SWRConfiguration
) {
  // Get user settings (including timezone) for API requests
  const { settings } = useUserSettings()

  // Build query string from search parameters
  const params = new URLSearchParams()
  if (hostId !== undefined) params.append('hostId', String(hostId))

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
  }

  // Pass timezone to ClickHouse for session-level time conversion
  if (settings.timezone) params.append('timezone', settings.timezone)

  const queryString = params.toString()
  const url = `/api/v1/tables/${queryConfigName}${queryString ? `?${queryString}` : ''}`

  // Build cache key - include all parameters that affect the data
  // Include timezone so cache invalidates when user changes timezone
  const key = [
    '/api/v1/tables',
    queryConfigName,
    hostId,
    JSON.stringify(searchParams || {}),
    settings.timezone,
  ]

  // Fetcher function
  const fetcher = async () => {
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
          `Failed to fetch table data: ${response.statusText}`
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

    return response.json() as Promise<TableDataResponse<T>>
  }

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    TableDataResponse<T>,
    Error
  >(key, fetcher, {
    revalidateIfStale: true,
    revalidateOnReconnect: true,
    dedupingInterval: 3000,
    focusThrottleInterval: 5000,
    refreshInterval:
      refreshInterval && refreshInterval > 0 ? refreshInterval : 0,
    ...swrConfig,
  })

  // Check if we have valid data (even if there's an error from revalidation)
  const dataArray = data?.data || []
  const hasData = dataArray.length > 0

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
    error,
    isLoading,
    isValidating,
    refresh: mutate,
    /** True when data exists (even if stale due to revalidation error) */
    hasData,
    /** Error from failed revalidation (only set when data exists but refresh failed) */
    staleError,
  }
}
