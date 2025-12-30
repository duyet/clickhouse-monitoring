/**
 * Chart Registry - Dynamic chart component loader
 *
 * Provides a centralized registry for lazy-loading chart components
 * to eliminate duplicate imports across 30+ page files.
 */

import { lazy, type LazyExoticComponent } from 'react'
import type { ChartProps } from '@/components/charts/chart-props'

// Re-export ChartProps for convenience
export type { ChartProps }

// Chart component type
export type ChartComponent = React.ComponentType<ChartProps>

// Lazy-loaded chart components (only charts that exist and are used)
const chartRegistry: Record<string, LazyExoticComponent<ChartComponent>> = {
  // Query Charts
  'query-count': lazy(() =>
    import('@/components/charts/query-count').then((m) => ({
      default: m.ChartQueryCount,
    }))
  ),
  'query-count-by-user': lazy(() =>
    import('@/components/charts/query-count-by-user').then((m) => ({
      default: m.ChartQueryCountByUser,
    }))
  ),

  // Merge Charts
  'merge-count': lazy(() =>
    import('@/components/charts/merge-count').then((m) => ({
      default: m.ChartMergeCount,
    }))
  ),
  'summary-used-by-merges': lazy(() =>
    import('@/components/charts/summary-used-by-merges').then((m) => ({
      default: m.default,
    }))
  ),
  'summary-used-by-mutations': lazy(() =>
    import('@/components/charts/summary-used-by-mutations').then((m) => ({
      default: m.default,
    }))
  ),

  // Running Queries Charts
  'summary-used-by-running-queries': lazy(() =>
    import('@/components/charts/summary-used-by-running-queries').then((m) => ({
      default: m.default,
    }))
  ),

  // Replication Charts
  'replication-queue-count': lazy(() =>
    import('@/components/charts/replication-queue-count').then((m) => ({
      default: m.default,
    }))
  ),
  'replication-summary-table': lazy(() =>
    import('@/components/charts/replication-summary-table').then((m) => ({
      default: m.default,
    }))
  ),
}

/**
 * Get a chart component by name
 * Returns undefined if chart is not registered
 */
export function getChartComponent(
  chartName: string
): LazyExoticComponent<ChartComponent> | undefined {
  return chartRegistry[chartName]
}

/**
 * Check if a chart is registered
 */
export function hasChart(chartName: string): boolean {
  return chartName in chartRegistry
}

/**
 * Get all registered chart names
 */
export function getRegisteredChartNames(): string[] {
  return Object.keys(chartRegistry)
}
