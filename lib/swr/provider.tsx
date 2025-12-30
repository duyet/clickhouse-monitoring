'use client'

import { useEffect } from 'react'
import { SWRConfig, type SWRConfiguration, useSWRConfig } from 'swr'
import type React from 'react'

import { ErrorLogger } from '@/lib/error-logger'
import { isDevelopment } from '@/lib/env-utils'

// Re-export config for convenience
export { REFRESH_INTERVAL, swrConfig } from './config'

/**
 * Performance metrics for SWR fetches
 */
interface FetchMetrics {
  url: string
  duration: number
  timestamp: number
  size?: number
  cached?: boolean
}

// Performance tracking (development only)
const fetchMetrics: FetchMetrics[] = []
const MAX_METRICS = 100

/**
 * Track fetch performance metrics
 */
function trackFetchMetrics(metrics: FetchMetrics) {
  if (!isDevelopment()) return

  fetchMetrics.push(metrics)
  if (fetchMetrics.length > MAX_METRICS) {
    fetchMetrics.shift()
  }

  // Log slow requests (> 1s)
  if (metrics.duration > 1000) {
    ErrorLogger.logWarning(
      `Slow fetch: ${metrics.url} took ${metrics.duration}ms`,
      {
        component: 'SWR',
        action: 'slow-fetch',
      }
    )
  }
}

/**
 * Get recent fetch metrics (for debugging)
 */
export function getRecentFetchMetrics(): FetchMetrics[] {
  return [...fetchMetrics]
}

/**
 * Global SWR fetcher function with performance tracking
 * Handles JSON responses from fetch calls
 */
const globalFetcher = async (url: string) => {
  const startTime = performance.now()

  const res = await fetch(url)
  const duration = Math.round(performance.now() - startTime)

  if (!res.ok) {
    const error = new Error(`Failed to fetch data: ${res.statusText}`)
    throw error
  }

  const data = await res.json()

  // Track metrics
  trackFetchMetrics({
    url,
    duration,
    timestamp: Date.now(),
    size: JSON.stringify(data).length,
    cached: res.headers.get('x-cache') === 'HIT',
  })

  return data
}

/**
 * Differentiated retry logic based on error type
 * - Don't retry: 404 (not found), 403 (permission), 400 (validation)
 * - Retry: 503 (service unavailable), 502 (bad gateway), network errors
 */
const onErrorRetry: SWRConfiguration['onErrorRetry'] = (
  error,
  key,
  config,
  revalidate,
  { retryCount }
) => {
  // Don't retry on 4xx client errors (except 429)
  if ('status' in error && typeof error.status === 'number') {
    const status = error.status
    if (status >= 400 && status < 500 && status !== 429) {
      return
    }
  }

  // Don't retry if we've exceeded the max retry count
  if (retryCount >= (config.errorRetryCount || 3)) {
    return
  }

  // Exponential backoff: 1s, 2s, 4s, 8s...
  const retryDelay = Math.min(1000 * 2 ** retryCount, 30000)

  setTimeout(() => revalidate({ retryCount }), retryDelay)
}

/**
 * Global error logging for SWR
 */
const onError: SWRConfiguration['onError'] = (error, key) => {
  // Log SWR errors using ErrorLogger
  ErrorLogger.logError(error as Error, {
    component: 'SWR',
    action: 'fetch',
    digest: key,
  })
}

/**
 * SWR provider configuration with sensible defaults
 *
 * Global defaults applied to all SWR hooks:
 * - revalidateOnFocus: false - Don't refetch when window regains focus
 * - dedupingInterval: 5000ms - Deduplicate requests within 5 seconds
 * - errorRetryCount: 3 - Retry failed requests up to 3 times
 * - onErrorRetry: Custom retry logic with exponential backoff
 *
 * For per-request config, use the config presets from './config':
 * - swrConfig.polling30s - 30 second refresh (default for charts)
 * - swrConfig.polling10s - 10 second refresh (fast metrics)
 * - swrConfig.static - No refresh (static data)
 *
 * @example
 * ```tsx
 * import { swrConfig } from '@/lib/swr'
 * useSWR(key, fetcher, swrConfig.polling30s)
 * ```
 */
const swrConfig: SWRConfiguration = {
  fetcher: globalFetcher,
  revalidateOnFocus: false,
  dedupingInterval: 5000,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  onErrorRetry,
  onError,
}

interface SWRProviderProps {
  children: React.ReactNode
}

/**
 * Global revalidation listener component
 * Listens for 'swr:revalidate' custom events and triggers global cache revalidation
 */
function GlobalRevalidationListener() {
  const { mutate } = useSWRConfig()

  useEffect(() => {
    const handleRevalidate = () => {
      // Revalidate all SWR caches by passing a function that matches all keys
      mutate(
        () => true, // Match all keys
        undefined, // Don't update the data
        { revalidate: true }
      )

      if (isDevelopment()) {
        ErrorLogger.logDebug('Global SWR revalidation triggered', {
          component: 'SWR',
          action: 'global-revalidate',
        })
      }
    }

    window.addEventListener('swr:revalidate', handleRevalidate)
    return () => window.removeEventListener('swr:revalidate', handleRevalidate)
  }, [mutate])

  return null
}

/**
 * SWR Provider wrapper component
 * Provides global SWR configuration to all SWR hooks in the app
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig value={swrConfig}>
      <GlobalRevalidationListener />
      {children}
    </SWRConfig>
  )
}
