/**
 * Performance Monitoring
 * Web Vitals tracking using the web-vitals library
 */

'use client'

import type { Metric } from 'web-vitals'
import type { PerformanceMetricData } from './types'

import { useAnalytics } from './hooks'
import { useEffect } from 'react'

/**
 * Rating thresholds for Core Web Vitals
 */
const RATING_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  TTFB: { good: 800, poor: 1800 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
} as const

/**
 * Get rating for a metric value
 */
function getRating(
  name: keyof typeof RATING_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = RATING_THRESHOLDS[name]

  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Convert web-vitals metric to PerformanceMetricData
 */
function metricToData(metric: Metric): PerformanceMetricData {
  const rating = getRating(
    metric.name as keyof typeof RATING_THRESHOLDS,
    metric.value
  )

  return {
    name: metric.name,
    value: metric.value,
    rating,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  }
}

/**
 * Hook for tracking Web Vitals
 * Dynamically imports web-vitals to avoid SSR issues
 */
export function useWebVitals(): void {
  const analytics = useAnalytics()

  useEffect(() => {
    if (!analytics.hasConsent || !analytics.config.trackPerformance) return

    // Dynamically import web-vitals to avoid SSR
    import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      // Track each metric - these callbacks persist for the page lifecycle
      onCLS((metric) => analytics.trackPerformance(metricToData(metric)))
      onFCP((metric) => analytics.trackPerformance(metricToData(metric)))
      onINP((metric) => analytics.trackPerformance(metricToData(metric)))
      onLCP((metric) => analytics.trackPerformance(metricToData(metric)))
      onTTFB((metric) => analytics.trackPerformance(metricToData(metric)))
    })

    // Web Vitals callbacks persist for page lifecycle, no cleanup needed
    return () => {}
  }, [analytics])
}

/**
 * Hook for tracking custom performance metrics
 */
export function useCustomPerformance(): void {
  const analytics = useAnalytics()

  useEffect(() => {
    if (!analytics.hasConsent || !analytics.config.trackPerformance) return

    // Track API response times
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      const start = performance.now()
      const response = await originalFetch(...args)
      const duration = performance.now() - start

      // Only track API calls to our own endpoints
      const url = args[0] as string
      if (url.startsWith('/api/')) {
        analytics.trackPerformance({
          name: 'API_Response',
          value: duration,
          rating:
            duration < 1000
              ? 'good'
              : duration < 3000
                ? 'needs-improvement'
                : 'poor',
          url,
        })
      }

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [analytics])

  useEffect(() => {
    if (!analytics.hasConsent || !analytics.config.trackPerformance) return

    // Track bundle load time
    window.addEventListener('load', () => {
      const navigationTiming = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming

      if (navigationTiming) {
        const domContentLoaded =
          navigationTiming.domContentLoadedEventEnd -
          navigationTiming.domContentLoadedEventStart
        const loadComplete =
          navigationTiming.loadEventEnd - navigationTiming.loadEventStart

        analytics.trackPerformance({
          name: 'DOM_Content_Loaded',
          value: domContentLoaded,
        })

        analytics.trackPerformance({
          name: 'Page_Load_Complete',
          value: loadComplete,
        })
      }
    })
  }, [analytics])
}
