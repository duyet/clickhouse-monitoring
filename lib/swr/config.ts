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
 */
export const REFRESH_INTERVAL = {
  /** Never refresh (static data) */
  NEVER: 0,
  /** Refresh every 10 seconds - for frequently changing data */
  FAST_10S: 10_000,
  /** Refresh every 30 seconds - default for real-time metrics */
  DEFAULT_30S: 30_000,
  /** Refresh every minute - for slower changing data */
  SLOW_1M: 60_000,
  /** Refresh every 5 minutes - for relatively static data */
  VERY_SLOW_5M: 300_000,
} as const

/**
 * SWR configuration presets for common use cases
 */
export const swrConfig = {
  /**
   * Default polling - refresh every 30 seconds
   * Use for: Real-time metrics, system stats, query counts
   */
  polling30s: {
    refreshInterval: REFRESH_INTERVAL.DEFAULT_30S,
  } satisfies SWRConfiguration,

  /**
   * Fast polling - refresh every 10 seconds
   * Use for: Critical metrics that update frequently
   */
  polling10s: {
    refreshInterval: REFRESH_INTERVAL.FAST_10S,
  } satisfies SWRConfiguration,

  /**
   * Slow polling - refresh every minute
   * Use for: Less critical data that doesn't change often
   */
  polling1m: {
    refreshInterval: REFRESH_INTERVAL.SLOW_1M,
  } satisfies SWRConfiguration,

  /**
   * Very slow polling - refresh every 5 minutes
   * Use for: Configuration data, static metrics
   */
  polling5m: {
    refreshInterval: REFRESH_INTERVAL.VERY_SLOW_5M,
  } satisfies SWRConfiguration,

  /**
   * Static - no refresh after initial fetch
   * Use for: Historical data, configuration, metadata
   */
  static: {
    refreshInterval: REFRESH_INTERVAL.NEVER,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  } satisfies SWRConfiguration,

  /**
   * One-time fetch - no refresh, no revalidation
   * Use for: Data that should only be fetched once per session
   */
  once: {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  } satisfies SWRConfiguration,
} as const

/**
 * Type-safe refresh interval values
 */
export type RefreshInterval = (typeof REFRESH_INTERVAL)[keyof typeof REFRESH_INTERVAL]

/**
 * Create a custom SWR config with a specific refresh interval
 */
export function createPollingConfig(interval: RefreshInterval): SWRConfiguration {
  return {
    refreshInterval: interval,
  }
}
