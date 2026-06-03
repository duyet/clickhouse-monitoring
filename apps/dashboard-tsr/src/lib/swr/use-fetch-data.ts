import {
  type UseQueryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { apiFetch } from './api-fetch'
import { throwIfNotOk } from './fetch-error'

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
 * Hook to fetch generic data using TanStack Query
 * Makes POST request to /api/v1/data with query and parameters
 *
 * @template T - The data type being fetched
 * @param {string} query - SQL query or query name
 * @param {Record<string, string | number | boolean>} [queryParams] - Query parameters
 * @param {number} [hostId] - Host ID for the request
 * @param {number} [refreshInterval] - Auto-refresh interval in milliseconds (disabled if 0 or undefined)
 * @param {Object} [queryOptions] - Additional TanStack Query configuration options
 * @returns {Object} Query state object with data, metadata, error, isLoading, and refresh function
 *
 * @example
 * ```typescript
 * const { data, metadata, error, isLoading, refresh } = useFetchData(
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
  queryOptions?: Partial<UseQueryOptions<DataResponse<T>, Error>>
) {
  const queryClient = useQueryClient()

  // Build cache key based on parameters
  const key = ['/api/v1/data', query, JSON.stringify(queryParams || {}), hostId]

  // Fetcher function that sends POST request
  const fetcher = async () => {
    const response = await apiFetch('/api/v1/data', {
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

    await throwIfNotOk(response, 'Failed to fetch data')

    return response.json() as Promise<DataResponse<T>>
  }

  const { data, error, isLoading } = useQuery<DataResponse<T>, Error>({
    queryKey: key,
    queryFn: fetcher,
    refetchOnReconnect: true,
    staleTime: 3000,
    refetchInterval:
      refreshInterval && refreshInterval > 0 ? refreshInterval : false,
    ...queryOptions,
  })

  const mutate = () => queryClient.invalidateQueries({ queryKey: key })

  return {
    data: data?.data,
    metadata: data?.metadata,
    error,
    isLoading,
    refresh: mutate,
  }
}
