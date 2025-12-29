'use client'

import useSWR, { type SWRConfiguration } from 'swr'

/**
 * Generic data response structure from the API
 */
interface DataResponse<T> {
  data: T
  metadata: {
    duration?: number
    rows?: number
    rows_before_limit_at_least?: number
    exception?: string
    message?: string
  }
}

/**
 * Hook to fetch generic data using SWR
 * Makes POST request to /api/v1/data with query and parameters
 *
 * @template T - The data type being fetched
 * @param {string} query - SQL query or query name
 * @param {Record<string, string | number | boolean>} [queryParams] - Query parameters
 * @param {number} [hostId] - Host ID for the request
 * @param {number} [refreshInterval] - Auto-refresh interval in milliseconds (disabled if 0 or undefined)
 * @param {SWRConfiguration} [swrConfig] - Additional SWR configuration options
 * @returns {Object} SWR state object with data, metadata, error, isLoading, and refresh function
 *
 * @example
 * ```typescript
 * const { data, metadata, error, isLoading, mutate } = useFetchData(
 *   'SELECT * FROM system.tables',
 *   { database: 'default' },
 *   1,
 *   30000 // refresh every 30 seconds
 * )
 * ```
 */
export function useFetchData<T = unknown>(
  query: string,
  queryParams?: Record<string, string | number | boolean>,
  hostId?: number,
  refreshInterval?: number,
  swrConfig?: SWRConfiguration
) {
  // Build cache key based on parameters
  const key = ['/api/v1/data', query, JSON.stringify(queryParams || {}), hostId]

  // Fetcher function that sends POST request
  const fetcher = async () => {
    const response = await fetch('/api/v1/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        queryParams: queryParams || {},
        hostId,
      }),
    })

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
          `Failed to fetch data: ${response.statusText}`
      ) as Error & { type?: string; details?: Record<string, unknown> }

      // Attach error metadata if available
      if (errorData.error) {
        error.type = errorData.error.type
        error.details = errorData.error.details
      }

      throw error
    }

    return response.json() as Promise<DataResponse<T>>
  }

  const { data, error, isLoading, mutate } = useSWR<DataResponse<T>, Error>(
    key,
    fetcher,
    {
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 3000,
      focusThrottleInterval: 5000,
      refreshInterval:
        refreshInterval && refreshInterval > 0 ? refreshInterval : 0,
      ...swrConfig,
    }
  )

  return {
    data: data?.data,
    metadata: data?.metadata,
    error,
    isLoading,
    refresh: mutate,
  }
}
