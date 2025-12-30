'use client'

import { useCallback } from 'react'
import useSWR from 'swr'

/** API response format for chart data */
type ChartApiResponse = {
  success: boolean
  data?: Array<{ val: string }>
}

/** Host status information */
export type HostStatus = {
  uptime: string
  hostName: string
  version: string
}

/**
 * Fetch host status (uptime, hostname, version) from API
 */
async function fetchHostStatus(hostId: number): Promise<HostStatus | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    // Fetch all three values in parallel
    const [hostnameRes, versionRes, uptimeRes] = await Promise.all([
      fetch(`/api/v1/charts/hostname?hostId=${hostId}`, {
        signal: controller.signal,
      }),
      fetch(`/api/v1/charts/version?hostId=${hostId}`, {
        signal: controller.signal,
      }),
      fetch(`/api/v1/charts/uptime-readable?hostId=${hostId}`, {
        signal: controller.signal,
      }),
    ])

    clearTimeout(timeoutId)

    if (!hostnameRes.ok || !versionRes.ok || !uptimeRes.ok) {
      return null
    }

    const [hostnameData, versionData, uptimeData] = await Promise.all([
      hostnameRes.json() as Promise<ChartApiResponse>,
      versionRes.json() as Promise<ChartApiResponse>,
      uptimeRes.json() as Promise<ChartApiResponse>,
    ])

    // Extract values from API response format
    const hostName = hostnameData?.data?.[0]?.val ?? ''
    const version = versionData?.data?.[0]?.val ?? ''
    const uptime = uptimeData?.data?.[0]?.val ?? ''

    if (!hostName && !version && !uptime) {
      return null
    }

    return { hostName, version, uptime }
  } catch {
    return null
  }
}

interface UseHostStatusOptions {
  /**
   * Refresh interval in milliseconds.
   * @default 60000 (1 minute)
   */
  refreshInterval?: number
  /**
   * Whether to revalidate on window focus.
   * @default false
   */
  revalidateOnFocus?: boolean
}

/**
 * SWR hook to fetch host status (version, uptime, hostname).
 * Provides automatic caching and deduplication.
 *
 * @param hostId - The host ID to fetch status for
 * @param options - SWR configuration options
 * @returns {Object} SWR state with status data, error, isLoading, and online state
 *
 * @example
 * ```typescript
 * const { status, error, isLoading, isOnline } = useHostStatus(0)
 * ```
 */
export function useHostStatus(
  hostId: number | null,
  options: UseHostStatusOptions = {}
) {
  const { refreshInterval = 60000, revalidateOnFocus = false } = options

  const fetcher = useCallback(
    async (url: string) => {
      // Extract hostId from the cache key
      const id = parseInt(url.split('/').pop() ?? '0', 10)
      return fetchHostStatus(id)
    },
    []
  )

  const { data, error, isLoading } = useSWR<HostStatus | null>(
    hostId !== null ? `/api/v1/host-status/${hostId}` : null,
    fetcher,
    {
      dedupingInterval: 10000,
      refreshInterval,
      revalidateOnFocus,
      revalidateOnReconnect: true,
    }
  )

  return {
    status: data ?? null,
    error,
    isLoading,
    isOnline: data !== null,
  }
}
