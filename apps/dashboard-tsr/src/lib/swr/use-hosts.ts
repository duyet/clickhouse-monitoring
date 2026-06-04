import { useQuery } from '@tanstack/react-query'

import type { HostInfo } from '@chm/types/host-info'

import { apiFetch } from './api-fetch'
import { ErrorLogger } from '@chm/logger'
import { useCallback } from 'react'

interface HostsResponse {
  success: boolean
  data?: HostInfo[]
}

/** Error carrying the HTTP status so callers can distinguish 401 from empty. */
class HostsFetchError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'HostsFetchError'
  }
}

/**
 * TanStack Query hook to fetch the list of configured ClickHouse hosts.
 * Provides automatic caching and deduplication.
 *
 * On failure the fetcher THROWS (rather than swallowing to `[]`) so callers can
 * tell "no hosts configured" (success, empty list) apart from "couldn't load /
 * unauthorized" (error). `hosts` still falls back to `[]` so existing consumers
 * are unaffected; new `error` / `isUnauthorized` surface the failure mode.
 *
 * @returns {Object} Query state: hosts, error, isLoading, isUnauthorized
 */
export function useHosts() {
  const fetcher = useCallback(async (): Promise<HostInfo[]> => {
    const response = await apiFetch('/api/v1/hosts')
    if (!response.ok) {
      ErrorLogger.logWarning(
        `Failed to fetch hosts: ${response.status} ${response.statusText}`,
        { component: 'useHosts' }
      )
      throw new HostsFetchError(
        `Failed to fetch hosts: ${response.status}`,
        response.status
      )
    }
    const result = (await response.json()) as HostsResponse
    return result.success && result.data ? result.data : []
  }, [])

  const { data, error, isLoading } = useQuery<HostInfo[]>({
    queryKey: ['/api/v1/hosts'],
    queryFn: fetcher,
    // Hosts list changes rarely, so cache for 5 minutes
    staleTime: 300000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    // Don't hammer the server when auth is the problem — a 401/403 won't change
    // on retry. Other failures keep the default-ish 2 retries.
    retry: (failureCount, err) => {
      const status = err instanceof HostsFetchError ? err.status : undefined
      if (status === 401 || status === 403) return false
      return failureCount < 2
    },
  })

  const status = error instanceof HostsFetchError ? error.status : undefined

  return {
    hosts: data ?? [],
    error,
    isLoading,
    isUnauthorized: status === 401 || status === 403,
  }
}
