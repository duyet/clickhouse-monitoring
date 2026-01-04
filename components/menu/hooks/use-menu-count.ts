/**
 * Menu Count Hook
 *
 * Fetches menu item counts via SWR with lazy loading and caching.
 * Uses a 2-minute refresh interval to minimize API load while keeping counts fresh.
 */

'use client'

import useSWR from 'swr'

import { REFRESH_INTERVAL } from '@/lib/swr/config'

interface MenuCountResult {
  count: number | null
  isLoading: boolean
  error?: Error
}

interface MenuCountResponse {
  success: boolean
  data: { count: number | null }
  error?: { message: string }
}

/**
 * Fetches a menu count by key for a specific host.
 *
 * Features:
 * - 2-minute refresh interval (non-critical data)
 * - 1-minute deduping to prevent duplicate requests
 * - No revalidation on focus/reconnect (reduces API load)
 * - Silent failure - returns null on error
 *
 * @param countKey - The count key from menu-count-registry
 * @param hostId - The current host ID
 */
export function useMenuCount(
  countKey: string | undefined,
  hostId: number
): MenuCountResult {
  const { data, error, isLoading } = useSWR<MenuCountResponse>(
    // Only fetch if countKey is provided
    countKey ? [`/api/v1/menu-counts`, countKey, hostId] : null,
    async () => {
      const res = await fetch(
        `/api/v1/menu-counts/${countKey}?hostId=${hostId}`
      )
      if (!res.ok) {
        throw new Error('Failed to fetch menu count')
      }
      return res.json()
    },
    {
      refreshInterval: REFRESH_INTERVAL.SLOW_2M,
      dedupingInterval: 60_000, // 1 minute deduping
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false, // Don't retry on error (non-critical)
    }
  )

  return {
    count: data?.data?.count ?? null,
    isLoading,
    error,
  }
}
