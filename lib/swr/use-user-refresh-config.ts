/**
 * User-Configurable SWR Refresh Config
 *
 * Creates SWR configuration based on user's refresh interval preference.
 */

import useSWR, { type SWRConfiguration } from 'swr'

import { useMemo } from 'react'
import { useUserSettings } from '@/lib/hooks/use-user-settings'

/**
 * Get SWR configuration based on user settings
 *
 * @param overrideInterval - Optional override to use a specific interval instead of user preference
 * @returns SWR configuration with refresh interval from user settings
 */
export function useUserRefreshConfig(
  overrideInterval?: number
): SWRConfiguration {
  const { settings } = useUserSettings()

  return useMemo(() => {
    const interval = overrideInterval ?? settings.refreshInterval

    // If auto-refresh is disabled and no override, don't refresh
    if (!settings.autoRefresh && !overrideInterval) {
      return {
        refreshInterval: 0,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    }

    return {
      refreshInterval: interval,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  }, [settings.refreshInterval, settings.autoRefresh, overrideInterval])
}

/**
 * SWR hook with user-configurable refresh interval
 *
 * This is a convenience wrapper around useSWR that automatically applies
 * the user's refresh interval preference from settings.
 *
 * @example
 * ```tsx
 * const { data, error } = useUserSWR('/api/data', fetcher)
 * // Uses refresh interval from user settings
 *
 * // Override with specific interval
 * const { data } = useUserSWR('/api/fast', fetcher, { overrideInterval: 5000 })
 * ```
 */
export function useUserSWR<Data = unknown, Error = unknown>(
  key: string | null | undefined,
  fetcher: ((key: string) => Promise<Data>) | null,
  options?: {
    /** Override the user's refresh interval preference */
    overrideInterval?: number
    /** Additional SWR configuration options */
    swrConfig?: SWRConfiguration
  }
) {
  const userConfig = useUserRefreshConfig(options?.overrideInterval)

  return useSWR<Data, Error>(
    key,
    fetcher,
    useMemo(
      () => ({
        ...userConfig,
        ...options?.swrConfig,
      }),
      [userConfig, options?.swrConfig]
    )
  )
}
