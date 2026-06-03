import { useQuery } from '@tanstack/react-query'

import type { HostInfo } from '@chm/types/host-info'

import { apiFetch } from './api-fetch'
import { ErrorLogger } from '@chm/logger'
import { useCallback } from 'react'

interface HostsResponse {
  success: boolean
  data?: HostInfo[]
}

/**
 * TanStack Query hook to fetch the list of configured ClickHouse hosts.
 * Provides automatic caching and deduplication.
 *
 * @returns {Object} Query state with hosts array, error, isLoading
 *
 * @example
 * ```typescript
 * const { hosts, error, isLoading } = useHosts()
 * ```
 */
export function useHosts() {
  const fetcher = useCallback(async () => {
    try {
      const response = await apiFetch('/api/v1/hosts')
      if (!response.ok) {
        ErrorLogger.logWarning(
          `Failed to fetch hosts: ${response.status} ${response.statusText}`,
          { component: 'useHosts' }
        )
        return []
      }
      const result = (await response.json()) as HostsResponse
      return result.success && result.data ? result.data : []
    } catch (err) {
      ErrorLogger.logError(
        err instanceof Error ? err : new Error('Failed to fetch hosts'),
        { component: 'useHosts' }
      )
      return []
    }
  }, [])

  const { data, error, isLoading } = useQuery<HostInfo[]>({
    queryKey: ['/api/v1/hosts'],
    queryFn: fetcher,
    // Hosts list changes rarely, so cache for 5 minutes
    staleTime: 300000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })

  return {
    hosts: data ?? [],
    error,
    isLoading,
  }
}
