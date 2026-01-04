'use client'

import useSWR from 'swr'

/** API response format for host status */
type HostStatusApiResponse = {
  success: boolean
  data?: {
    version: string
    uptime: string
    hostname: string
  }
  error?: string
}

/** Host status information */
export type HostStatus = {
  version: string
  uptime: string
  hostname: string
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
 * Uses a unified API endpoint for better caching efficiency.
 *
 * @param hostId - The host ID to fetch status for
 * @param options - SWR configuration options
 * @returns {Object} SWR state with data, error, isLoading, and online state
 *
 * @example
 * ```typescript
 * const { data, error, isLoading } = useHostStatus(0)
 * // data: { version: '24.3.1.1', uptime: '1 day 2 hours', hostname: 'clickhouse-01' }
 * ```
 */
export function useHostStatus(
  hostId: number | null,
  options: UseHostStatusOptions = {}
) {
  const { refreshInterval = 60000, revalidateOnFocus = false } = options

  const { data, error, isLoading } = useSWR<HostStatus>(
    hostId !== null ? `/api/v1/host-status?hostId=${hostId}` : null,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Failed to fetch host status: ${res.statusText}`)
      }
      const json: HostStatusApiResponse = await res.json()
      if (!json.success || !json.data) {
        throw new Error(json.error || 'No data returned')
      }
      return {
        version: json.data.version,
        uptime: json.data.uptime,
        hostname: json.data.hostname,
      }
    },
    {
      dedupingInterval: 10000,
      refreshInterval,
      revalidateOnFocus,
      revalidateOnReconnect: true,
    }
  )

  return {
    data: data ?? null,
    error,
    isLoading,
    isOnline: data?.version !== '' && data?.version !== undefined,
  }
}
