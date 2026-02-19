'use client'

import useSWR from 'swr'

import type { HostInfo } from '@/app/api/v1/hosts/route'

import { useCallback, useMemo } from 'react'
import { useCustomHosts } from '@/lib/hooks/use-custom-hosts'
import { ErrorLogger } from '@/lib/logger'

export type ExtendedHostInfo = HostInfo & {
  source: 'env' | 'custom'
  customConnection?: { host: string; user: string; password: string }
}

interface HostsResponse {
  success: boolean
  data?: HostInfo[]
}

/**
 * SWR hook to fetch the list of configured ClickHouse hosts.
 * Merges environment-configured hosts with user-added custom hosts.
 *
 * @returns {Object} SWR state with hosts array, error, isLoading
 *
 * @example
 * ```typescript
 * const { hosts, error, isLoading } = useHosts()
 * ```
 */
export function useHosts() {
  const { hosts: customHosts } = useCustomHosts()

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

  const envHosts = data ?? []

  // Merge env hosts with custom hosts from localStorage
  const hosts: ExtendedHostInfo[] = useMemo(() => {
    const env: ExtendedHostInfo[] = envHosts.map((h) => ({
      ...h,
      source: 'env' as const,
    }))

    const custom: ExtendedHostInfo[] = customHosts.map((ch, index) => ({
      id: envHosts.length + index,
      name: ch.name || ch.host,
      host: ch.host,
      user: ch.user,
      source: 'custom' as const,
      customConnection: {
        host: ch.host,
        user: ch.user,
        password: ch.password,
      },
    }))

    return [...env, ...custom]
  }, [envHosts, customHosts])

  return {
    hosts,
    error,
    isLoading,
  }
}
