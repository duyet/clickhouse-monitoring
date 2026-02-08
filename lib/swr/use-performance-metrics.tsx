'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { isDevelopment } from '@/lib/env-utils'
import { ErrorLogger } from '@/lib/logger'

/**
 * Request metrics tracked for performance monitoring
 */
export interface RequestMetrics {
  /** Request URL/key */
  url: string
  /** Request duration in milliseconds */
  duration: number
  /** Timestamp when request completed */
  timestamp: number
  /** Size of response in bytes (if available) */
  size?: number
  /** Whether response was cached */
  cached?: boolean
  /** Whether request was successful */
  success: boolean
  /** Number of retries attempted */
  retryCount?: number
}

/**
 * Aggregated performance statistics
 */
export interface PerformanceStats {
  /** Total number of requests tracked */
  totalRequests: number
  /** Number of successful requests */
  successfulRequests: number
  /** Number of failed requests */
  failedRequests: number
  /** Average request duration in ms */
  averageDuration: number
  /** Slowest request duration in ms */
  maxDuration: number
  /** Fastest request duration in ms */
  minDuration: number
  /** Number of cached responses */
  cachedRequests: number
  /** Cache hit rate (0-1) */
  cacheHitRate: number
  /** Success rate (0-1) */
  successRate: number
}

/**
 * Configuration for performance metrics tracking
 */
interface PerformanceMetricsConfig {
  /** Maximum number of metrics to store (default: 100) */
  maxMetrics?: number
  /** Sampling rate (0-1), only track this percentage of requests (default: 1 in dev, 0.01 in prod) */
  samplingRate?: number
  /** Log slow requests above this duration in ms (default: 1000) */
  slowRequestThreshold?: number
}

/**
 * Hook for tracking SWR request performance metrics
 * Provides real-time insights into API performance
 *
 * @example
 * ```tsx
 * const metrics = usePerformanceMetrics({ maxMetrics: 50 })
 *
 * // Track a request
 * metrics.trackRequest({
 *   url: '/api/v1/charts/query-performance',
 *   duration: 245,
 *   timestamp: Date.now(),
 *   size: 12345,
 *   cached: false,
 *   success: true,
 * })
 * ```
 */
export function usePerformanceMetrics(config: PerformanceMetricsConfig = {}) {
  const {
    maxMetrics = 100,
    samplingRate = isDevelopment() ? 1 : 0.01,
    slowRequestThreshold = 1000,
  } = config

  const metricsRef = useRef<RequestMetrics[]>([])
  const statsCacheRef = useRef<PerformanceStats | null>(null)

  /**
   * Track a request metric
   * Only tracks if random sampling check passes
   */
  const trackRequest = useCallback(
    (metric: RequestMetrics) => {
      // Sampling check - only track a percentage of requests in production
      if (Math.random() > samplingRate) {
        return
      }

      const metrics = metricsRef.current

      // Add new metric
      metrics.push(metric)

      // Trim to max size
      if (metrics.length > maxMetrics) {
        metrics.shift()
      }

      // Invalidate stats cache
      statsCacheRef.current = null

      // Log slow requests
      if (metric.duration > slowRequestThreshold) {
        ErrorLogger.logWarning(
          `Slow API request: ${metric.url} took ${metric.duration}ms`,
          {
            component: 'PerformanceMetrics',
            action: 'slow-request',
            duration: metric.duration,
            url: metric.url,
          }
        )
      }
    },
    [samplingRate, maxMetrics, slowRequestThreshold]
  )

  /**
   * Get all tracked metrics
   */
  const getMetrics = useCallback((): RequestMetrics[] => {
    return [...metricsRef.current]
  }, [])

  /**
   * Get aggregated performance statistics
   * Cached for performance, recalculated when metrics change
   */
  const getStats = useCallback((): PerformanceStats => {
    // Return cached stats if available
    if (statsCacheRef.current) {
      return statsCacheRef.current
    }

    const metrics = metricsRef.current

    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        cachedRequests: 0,
        cacheHitRate: 0,
        successRate: 0,
      }
    }

    const successful = metrics.filter((m) => m.success).length
    const cached = metrics.filter((m) => m.cached).length
    const durations = metrics.map((m) => m.duration)

    const stats: PerformanceStats = {
      totalRequests: metrics.length,
      successfulRequests: successful,
      failedRequests: metrics.length - successful,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      cachedRequests: cached,
      cacheHitRate: cached / metrics.length,
      successRate: successful / metrics.length,
    }

    statsCacheRef.current = stats
    return stats
  }, [])

  /**
   * Clear all tracked metrics
   */
  const clear = useCallback(() => {
    metricsRef.current = []
    statsCacheRef.current = null
  }, [])

  /**
   * Get metrics for a specific URL pattern
   */
  const getMetricsByUrl = useCallback(
    (pattern: RegExp | string): RequestMetrics[] => {
      const metrics = metricsRef.current
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
      return metrics.filter((m) => regex.test(m.url))
    },
    []
  )

  // Computed stats for easy access
  const stats = useMemo(() => getStats(), [getStats])

  return {
    trackRequest,
    getMetrics,
    getStats,
    clear,
    getMetricsByUrl,
    stats,
  }
}

/**
 * Global metrics instance for app-wide tracking
 * Can be used independently of hooks for global tracking
 */
class GlobalMetricsTracker {
  private metrics: RequestMetrics[] = []
  private maxMetrics = 200

  track(metric: RequestMetrics) {
    this.metrics.push(metric)
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
  }

  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        cachedRequests: 0,
        cacheHitRate: 0,
        successRate: 0,
      }
    }

    const successful = this.metrics.filter((m) => m.success).length
    const cached = this.metrics.filter((m) => m.cached).length
    const durations = this.metrics.map((m) => m.duration)

    return {
      totalRequests: this.metrics.length,
      successfulRequests: successful,
      failedRequests: this.metrics.length - successful,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      cachedRequests: cached,
      cacheHitRate: cached / this.metrics.length,
      successRate: successful / this.metrics.length,
    }
  }

  clear() {
    this.metrics = []
  }
}

// Global singleton instance
export const globalMetrics = new GlobalMetricsTracker()

/**
 * Hook to integrate performance tracking with SWR
 * Wraps a fetcher function with timing and metrics collection
 *
 * @example
 * ```tsx
 * const fetcher = useTrackedFetcher(originalFetcher, metrics)
 * useSWR(key, fetcher, config)
 * ```
 */
export function useTrackedFetcher<T>(
  fetcher: (key: string) => Promise<T>,
  metrics: ReturnType<typeof usePerformanceMetrics>
): (key: string) => Promise<T> {
  return useCallback(
    async (key: string) => {
      const startTime = performance.now()
      let success = false
      const retryCount = 0

      try {
        const result = await fetcher(key)
        success = true

        // Track the request
        metrics.trackRequest({
          url: key,
          duration: Math.round(performance.now() - startTime),
          timestamp: Date.now(),
          success: true,
          retryCount,
        })

        return result
      } catch (error) {
        metrics.trackRequest({
          url: key,
          duration: Math.round(performance.now() - startTime),
          timestamp: Date.now(),
          success: false,
          retryCount,
        })

        throw error
      }
    },
    [fetcher, metrics]
  )
}
