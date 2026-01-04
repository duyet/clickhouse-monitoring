/**
 * SWR Configuration Presets
 *
 * Centralized SWR configuration options for consistent data fetching behavior.
 * Import these presets instead of hardcoding values in components.
 *
 * Usage:
 *   import { swrConfig } from '@/lib/swr/config'
 *   useSWR(key, fetcher, swrConfig.polling30s)
 */

import type { SWRConfiguration } from 'swr'

/**
 * Default refresh intervals in milliseconds
 *
 * PERFORMANCE NOTE: Longer intervals reduce API load significantly.
 * - 60s default provides good balance of freshness vs server load
 * - Use FAST_15S only for critical real-time data (running queries)
 * - Use SLOW_2M or VERY_SLOW_5M for historical/trend data
 */
export const REFRESH_INTERVAL = {
  /** Never refresh (static data) */
  NEVER: 0,
  /** Refresh every 15 seconds - for critical real-time data only */
  FAST_15S: 15_000,
  /** Refresh every 30 seconds - for important real-time metrics */
  MEDIUM_30S: 30_000,
  /** Refresh every 60 seconds - default for most metrics */
  DEFAULT_60S: 60_000,
  /** Refresh every 2 minutes - for slower changing data */
  SLOW_2M: 120_000,
  /** Refresh every 5 minutes - for historical/trend data */
  VERY_SLOW_5M: 300_000,
} as const

/**
 * SWR configuration presets for common use cases
 */
export const swrConfig = {
  polling15s: {
    refreshInterval: REFRESH_INTERVAL.FAST_15S,
  } satisfies SWRConfiguration,

  polling30s: {
    refreshInterval: REFRESH_INTERVAL.MEDIUM_30S,
  } satisfies SWRConfiguration,

  polling60s: {
    refreshInterval: REFRESH_INTERVAL.DEFAULT_60S,
  } satisfies SWRConfiguration,

  polling2m: {
    refreshInterval: REFRESH_INTERVAL.SLOW_2M,
  } satisfies SWRConfiguration,

  polling5m: {
    refreshInterval: REFRESH_INTERVAL.VERY_SLOW_5M,
  } satisfies SWRConfiguration,

  static: {
    refreshInterval: REFRESH_INTERVAL.NEVER,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  } satisfies SWRConfiguration,

  once: {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  } satisfies SWRConfiguration,
} as const

/**
 * Type-safe refresh interval values
 */
export type RefreshInterval =
  (typeof REFRESH_INTERVAL)[keyof typeof REFRESH_INTERVAL]

/**
 * Create a custom SWR config with a specific refresh interval
 */
export function createPollingConfig(
  interval: RefreshInterval
): SWRConfiguration {
  return {
    refreshInterval: interval,
  }
}
