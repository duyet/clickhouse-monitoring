'use client'

import useSWR from 'swr'

import type { HostInfo } from '@/app/api/v1/hosts/route'

import { useCallback } from 'react'
import { ErrorLogger } from '@/lib/logger'

interface HostsResponse {
  success: boolean
  data?: HostInfo[]
}

/**
 * SWR hook to fetch the list of configured ClickHouse hosts.
 * Provides automatic caching and deduplication.
 *
 * @returns {Object} SWR state with hosts array, error, isLoading
 *
 * @example
 * ```typescript
 * const { hosts, error, isLoading } = useHosts()
 * ```
 */
export function useHosts() {
  const fetcher = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/hosts')
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

  const { data, error, isLoading } = useSWR<HostInfo[]>(
    '/api/v1/hosts',
    fetcher,
    {
      // Hosts list changes rarely, so cache for 5 minutes
      dedupingInterval: 300000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    hosts: data ?? [],
    error,
    isLoading,
  }
}
