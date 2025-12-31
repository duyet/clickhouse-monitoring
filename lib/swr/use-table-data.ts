'use client'

import useSWR, { type SWRConfiguration } from 'swr'

import type { ApiResponse, ApiResponseMetadata } from '@/lib/api/types'

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

  const queryString = params.toString()
  const url = `/api/v1/tables/${queryConfigName}${queryString ? `?${queryString}` : ''}`

  // Build cache key - include all parameters that affect the data
  const key = [
    '/api/v1/tables',
    queryConfigName,
    hostId,
    JSON.stringify(searchParams || {}),
  ]

  // Fetcher function
  const fetcher = async () => {
    const response = await fetch(url)

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: {
          message?: string
          type?: string
          details?: Record<string, unknown>
        }
      }
      const error = new Error(
        errorData.error?.message ||
          `Failed to fetch table data: ${response.statusText}`
      ) as Error & { type?: string; details?: Record<string, unknown> }

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

  return {
    data: data?.data || [],
    metadata: data?.metadata,
    error,
    isLoading,
    isValidating,
    refresh: mutate,
  }
}
