/**
 * Performance Monitoring Hooks
 *
 * Provides utilities for measuring and tracking component performance.
 * Useful for identifying slow renders and optimizing critical paths.
 */

import { useEffect, useRef, useCallback } from 'react'
import { ErrorLogger } from '@/lib/error-logger'
import { isDevelopment } from '@/lib/env-utils'

/**
 * Performance thresholds in milliseconds
 */
export const PERFORMANCE_THRESHOLDS = {
  /** Good render time - under 16ms (60fps) */
  GOOD: 16,
  /** Acceptable render time - under 50ms */
  ACCEPTABLE: 50,
  /** Slow render time - over 100ms triggers warning */
  SLOW: 100,
  /** Very slow - over 500ms triggers error log */
  VERY_SLOW: 500,
} as const

/**
 * Performance metrics for a component
 */
export interface PerformanceMetrics {
  componentName: string
  renderCount: number
  lastRenderTime: number
  averageRenderTime: number
  maxRenderTime: number
  slowRenderCount: number
}

// Performance metrics store (development only)
const metricsStore = new Map<string, PerformanceMetrics>()

/**
 * Hook to measure component render performance
 *
 * Tracks render times and logs warnings for slow renders.
 * Only active in development mode for zero production overhead.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useRenderPerformance('MyComponent')
 *   // ... component logic
 * }
 * ```
 */
export function useRenderPerformance(componentName: string): void {
  const renderStartTime = useRef<number>(performance.now())
  const renderCount = useRef<number>(0)
  const totalRenderTime = useRef<number>(0)
  const maxRenderTime = useRef<number>(0)
  const slowRenderCount = useRef<number>(0)

  useEffect(() => {
    if (!isDevelopment()) return

    const renderTime = performance.now() - renderStartTime.current
    renderCount.current++
    totalRenderTime.current += renderTime
    maxRenderTime.current = Math.max(maxRenderTime.current, renderTime)

    // Track slow renders
    if (renderTime > PERFORMANCE_THRESHOLDS.SLOW) {
      slowRenderCount.current++

      if (renderTime > PERFORMANCE_THRESHOLDS.VERY_SLOW) {
        ErrorLogger.logWarning(`Very slow render: ${componentName}`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          renderCount: renderCount.current,
          component: componentName,
        })
      }
    }

    // Update metrics store
    metricsStore.set(componentName, {
      componentName,
      renderCount: renderCount.current,
      lastRenderTime: renderTime,
      averageRenderTime: totalRenderTime.current / renderCount.current,
      maxRenderTime: maxRenderTime.current,
      slowRenderCount: slowRenderCount.current,
    })
  })

  // Reset start time for next render
  renderStartTime.current = performance.now()
}

/**
 * Hook to measure async operation performance
 *
 * Returns a wrapper function that measures execution time.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const measureAsync = useAsyncPerformance('MyComponent')
 *
 *   const handleFetch = async () => {
 *     await measureAsync('fetchData', async () => {
 *       const data = await fetchData()
 *       return data
 *     })
 *   }
 * }
 * ```
 */
export function useAsyncPerformance(componentName: string) {
  const measureAsync = useCallback(
    async <T>(
      operationName: string,
      operation: () => Promise<T>
    ): Promise<T> => {
      const startTime = performance.now()

      try {
        const result = await operation()
        const duration = performance.now() - startTime

        if (isDevelopment() && duration > PERFORMANCE_THRESHOLDS.SLOW) {
          ErrorLogger.logDebug(`Slow async operation: ${operationName}`, {
            duration: `${duration.toFixed(2)}ms`,
            component: componentName,
          })
        }

        return result
      } catch (error) {
        const duration = performance.now() - startTime
        ErrorLogger.logError(error as Error, {
          component: componentName,
          operation: operationName,
          duration: `${duration.toFixed(2)}ms`,
        })
        throw error
      }
    },
    [componentName]
  )

  return measureAsync
}

/**
 * Hook to track component mount/unmount performance
 *
 * Measures time from mount to first render completion.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useMountPerformance('MyComponent')
 *   // ... component logic
 * }
 * ```
 */
export function useMountPerformance(componentName: string): void {
  const mountTime = useRef<number>(performance.now())
  const hasLoggedMount = useRef<boolean>(false)

  useEffect(() => {
    if (!isDevelopment() || hasLoggedMount.current) return

    const timeToMount = performance.now() - mountTime.current
    hasLoggedMount.current = true

    if (timeToMount > PERFORMANCE_THRESHOLDS.SLOW) {
      ErrorLogger.logDebug(`Slow mount: ${componentName}`, {
        timeToMount: `${timeToMount.toFixed(2)}ms`,
        component: componentName,
      })
    }

    return () => {
      // Log unmount if component was slow to mount
      if (timeToMount > PERFORMANCE_THRESHOLDS.SLOW) {
        const lifetime = performance.now() - mountTime.current
        ErrorLogger.logDebug(`Component unmounted: ${componentName}`, {
          lifetime: `${lifetime.toFixed(2)}ms`,
          component: componentName,
        })
      }
    }
  }, [componentName])
}

/**
 * Get all performance metrics (development only)
 */
export function getPerformanceMetrics(): PerformanceMetrics[] {
  return Array.from(metricsStore.values())
}

/**
 * Get metrics for a specific component
 */
export function getComponentMetrics(
  componentName: string
): PerformanceMetrics | undefined {
  return metricsStore.get(componentName)
}

/**
 * Clear all performance metrics
 */
export function clearPerformanceMetrics(): void {
  metricsStore.clear()
}

/**
 * Log performance summary to console (development only)
 */
export function logPerformanceSummary(): void {
  if (!isDevelopment()) return

  const metrics = getPerformanceMetrics()
  const slowComponents = metrics.filter((m) => m.slowRenderCount > 0)

  if (slowComponents.length > 0) {
    console.group('Performance Summary - Slow Components')
    slowComponents.forEach((m) => {
      console.log(`${m.componentName}:`, {
        renders: m.renderCount,
        avgTime: `${m.averageRenderTime.toFixed(2)}ms`,
        maxTime: `${m.maxRenderTime.toFixed(2)}ms`,
        slowRenders: m.slowRenderCount,
      })
    })
    console.groupEnd()
  }
}
