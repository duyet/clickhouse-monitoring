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

// Lazy-loaded chart components
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
  'query-duration': lazy(() =>
    import('@/components/charts/query-duration').then((m) => ({
      default: m.ChartQueryDuration,
    }))
  ),
  'query-memory': lazy(() =>
    import('@/components/charts/query-memory').then((m) => ({
      default: m.ChartQueryMemory,
    }))
  ),
  'query-type': lazy(() =>
    import('@/components/charts/query-type').then((m) => ({
      default: m.ChartQueryType,
    }))
  ),
  'failed-query-count': lazy(() =>
    import('@/components/charts/failed-query-count').then((m) => ({
      default: m.ChartFailedQueryCount,
    }))
  ),
  'failed-query-count-by-type': lazy(() =>
    import('@/components/charts/failed-query-count-by-user').then((m) => ({
      default: m.ChartFailedQueryCountByType,
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
  'merge-avg-duration': lazy(() =>
    import('@/components/charts/merge-avg-duration').then((m) => ({
      default: m.ChartMergeAvgDuration,
    }))
  ),
  'merge-sum-read-rows': lazy(() =>
    import('@/components/charts/merge-sum-read-rows').then((m) => ({
      default: m.ChartMergeSumReadRows,
    }))
  ),

  // Mutation Charts
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

  // System Charts
  'disk-size': lazy(() =>
    import('@/components/charts/disk-size').then((m) => ({
      default: m.ChartDiskSize,
    }))
  ),
  'disks-usage': lazy(() =>
    import('@/components/charts/disks-usage').then((m) => ({
      default: m.ChartDisksUsage,
    }))
  ),
  'backup-size': lazy(() =>
    import('@/components/charts/backup-size').then((m) => ({
      default: m.ChartBackupSize,
    }))
  ),
  'memory-usage': lazy(() =>
    import('@/components/charts/memory-usage').then((m) => ({
      default: m.ChartMemoryUsage,
    }))
  ),
  'cpu-usage': lazy(() =>
    import('@/components/charts/cpu-usage').then((m) => ({
      default: m.ChartCPUUsage,
    }))
  ),
  'new-parts-created': lazy(() =>
    import('@/components/charts/new-parts-created').then((m) => ({
      default: m.ChartNewPartsCreated,
    }))
  ),
  'query-cache': lazy(() =>
    import('@/components/charts/query-cache').then((m) => ({
      default: m.ChartQueryCache,
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
  'readonly-replica': lazy(() =>
    import('@/components/charts/readonly-replica').then((m) => ({
      default: m.ChartReadonlyReplica,
    }))
  ),

  // Connection Charts
  'connections-interserver': lazy(() =>
    import('@/components/charts/connections-interserver').then((m) => ({
      default: m.ChartConnectionsInterserver,
    }))
  ),
  'connections-http': lazy(() =>
    import('@/components/charts/connections-http').then((m) => ({
      default: m.ChartConnectionsHttp,
    }))
  ),

  // Table Charts
  'top-table-size': lazy(() =>
    import('@/components/charts/top-table-size').then((m) => ({
      default: m.default,
    }))
  ),

  // Page Views Charts
  'page-view': lazy(() =>
    import('@/components/charts/page-view').then((m) => ({
      default: m.PageViewBarChart,
    }))
  ),

  // ZooKeeper Charts
  'zookeeper-summary-table': lazy(() =>
    import('@/components/charts/zookeeper-summary-table').then((m) => ({
      default: m.default,
    }))
  ),
  'zookeeper-uptime': lazy(() =>
    import('@/components/charts/zookeeper-uptime').then((m) => ({
      default: m.ChartZookeeperUptime,
    }))
  ),
  'zookeeper-requests': lazy(() =>
    import('@/components/charts/zookeeper-requests').then((m) => ({
      default: m.default,
    }))
  ),
  'zookeeper-wait': lazy(() =>
    import('@/components/charts/zookeeper-wait').then((m) => ({
      default: m.default,
    }))
  ),
  'zookeeper-exception': lazy(() =>
    import('@/components/charts/zookeeper-exception').then((m) => ({
      default: m.default,
    }))
  ),

  // Note: Overview charts (database-table-count, running-queries) are server components
  // and are not compatible with the client-side chart registry pattern.
  // They must be imported directly in server components.
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
