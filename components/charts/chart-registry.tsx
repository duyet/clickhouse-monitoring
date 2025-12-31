/**
 * Chart Registry - Dynamic chart component loader
 *
 * Provides a centralized registry for lazy-loading chart components
 * to eliminate duplicate imports across 30+ page files.
 *
 * Charts are organized by category:
 * - query/      - Query-related charts
 * - merge/      - Merge operation charts
 * - system/     - System metrics
 * - replication/ - Replication charts
 * - zookeeper/  - ZooKeeper charts
 * - factory/    - Factory functions for creating charts
 * - primitives/  - Base chart components
 */

import { type LazyExoticComponent, lazy } from 'react'
import type { ChartProps } from '@/components/charts/chart-props'

// Re-export ChartProps for convenience
export type { ChartProps }

// Chart component type
export type ChartComponent = React.ComponentType<ChartProps>

// Chart skeleton types for realistic loading states
export type ChartSkeletonType = 'area' | 'bar' | 'line' | 'metric' | 'table'

/**
 * Chart type hints mapping
 * Defines the skeleton type for each registered chart
 * Used by ChartSkeleton to display appropriate loading state
 */
export const CHART_TYPE_HINTS: Record<string, ChartSkeletonType> = {
  // Query Charts - mostly area/line charts
  'query-count': 'area',
  'query-count-by-user': 'bar',
  'query-duration': 'area',
  'query-memory': 'area',
  'query-type': 'bar',
  'failed-query-count': 'area',
  'failed-query-count-by-user': 'bar',
  'query-cache': 'metric',

  // Merge Charts - area and metric
  'merge-count': 'area',
  'summary-used-by-merges': 'table',
  'merge-avg-duration': 'area',
  'merge-sum-read-rows': 'area',
  'new-parts-created': 'area',

  // Mutation Charts
  'summary-used-by-mutations': 'table',

  // Running Queries Charts
  'summary-used-by-running-queries': 'table',

  // System Charts - mixed types
  'disk-size': 'metric',
  'disks-usage': 'area',
  'backup-size': 'metric',
  'memory-usage': 'area',
  'cpu-usage': 'area',

  // Replication Charts
  'replication-queue-count': 'area',
  'replication-summary-table': 'table',
  'readonly-replica': 'area',

  // Connection Charts
  'connections-interserver': 'metric',
  'connections-http': 'metric',

  // Table Charts
  'top-table-size': 'bar',

  // Page Views Charts
  'page-view': 'bar',

  // ZooKeeper Charts
  'zookeeper-summary-table': 'table',
  'zookeeper-uptime': 'metric',
  'zookeeper-requests': 'area',
  'zookeeper-wait': 'area',
  'zookeeper-exception': 'area',
}

/**
 * Get chart skeleton type for a given chart name
 * Returns 'area' as default if chart type is not defined
 */
export function getChartSkeletonType(chartName: string): ChartSkeletonType {
  return CHART_TYPE_HINTS[chartName] || 'area'
}

// Lazy-loaded chart components
const chartRegistry: Record<string, LazyExoticComponent<ChartComponent>> = {
  // Query Charts (components/charts/query/)
  'query-count': lazy(() =>
    import('@/components/charts/query/query-count').then((m) => ({
      default: m.ChartQueryCount,
    }))
  ),
  'query-count-by-user': lazy(() =>
    import('@/components/charts/query/query-count-by-user').then((m) => ({
      default: m.ChartQueryCountByUser,
    }))
  ),
  'query-duration': lazy(() =>
    import('@/components/charts/query/query-duration').then((m) => ({
      default: m.ChartQueryDuration,
    }))
  ),
  'query-memory': lazy(() =>
    import('@/components/charts/query/query-memory').then((m) => ({
      default: m.ChartQueryMemory,
    }))
  ),
  'query-type': lazy(() =>
    import('@/components/charts/query/query-type').then((m) => ({
      default: m.ChartQueryType,
    }))
  ),
  'failed-query-count': lazy(() =>
    import('@/components/charts/query/failed-query-count').then((m) => ({
      default: m.ChartFailedQueryCount,
    }))
  ),
  'failed-query-count-by-user': lazy(() =>
    import('@/components/charts/query/failed-query-count-by-user').then((m) => ({
      default: m.ChartFailedQueryCountByType,
    }))
  ),
  'query-cache': lazy(() =>
    import('@/components/charts/query/query-cache').then((m) => ({
      default: m.ChartQueryCache,
    }))
  ),

  // Merge Charts (components/charts/merge/)
  'merge-count': lazy(() =>
    import('@/components/charts/merge/merge-count').then((m) => ({
      default: m.ChartMergeCount,
    }))
  ),
  'summary-used-by-merges': lazy(() =>
    import('@/components/charts/merge/summary-used-by-merges').then((m) => ({
      default: m.default,
    }))
  ),
  'merge-avg-duration': lazy(() =>
    import('@/components/charts/merge/merge-avg-duration').then((m) => ({
      default: m.ChartMergeAvgDuration,
    }))
  ),
  'merge-sum-read-rows': lazy(() =>
    import('@/components/charts/merge/merge-sum-read-rows').then((m) => ({
      default: m.ChartMergeSumReadRows,
    }))
  ),
  'new-parts-created': lazy(() =>
    import('@/components/charts/merge/new-parts-created').then((m) => ({
      default: m.ChartNewPartsCreated,
    }))
  ),

  // Mutation Charts (root level - not categorized)
  'summary-used-by-mutations': lazy(() =>
    import('@/components/charts/summary-used-by-mutations').then((m) => ({
      default: m.ChartSummaryUsedByMutations,
    }))
  ),

  // Running Queries Charts (root level - not categorized)
  'summary-used-by-running-queries': lazy(() =>
    import('@/components/charts/summary-used-by-running-queries').then((m) => ({
      default: m.default,
    }))
  ),

  // System Charts (components/charts/system/)
  'disk-size': lazy(() =>
    import('@/components/charts/system/disk-size').then((m) => ({
      default: m.ChartDiskSize,
    }))
  ),
  'disks-usage': lazy(() =>
    import('@/components/charts/system/disks-usage').then((m) => ({
      default: m.ChartDisksUsage,
    }))
  ),
  'backup-size': lazy(() =>
    import('@/components/charts/system/backup-size').then((m) => ({
      default: m.ChartBackupSize,
    }))
  ),
  'memory-usage': lazy(() =>
    import('@/components/charts/system/memory-usage').then((m) => ({
      default: m.ChartMemoryUsage,
    }))
  ),
  'cpu-usage': lazy(() =>
    import('@/components/charts/system/cpu-usage').then((m) => ({
      default: m.ChartCPUUsage,
    }))
  ),

  // Replication Charts (components/charts/replication/)
  'replication-queue-count': lazy(() =>
    import('@/components/charts/replication/replication-queue-count').then((m) => ({
      default: m.default,
    }))
  ),
  'replication-summary-table': lazy(() =>
    import('@/components/charts/replication/replication-summary-table').then((m) => ({
      default: m.default,
    }))
  ),
  'readonly-replica': lazy(() =>
    import('@/components/charts/replication/readonly-replica').then((m) => ({
      default: m.ChartReadonlyReplica,
    }))
  ),

  // Connection Charts (root level - not categorized)
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

  // Table Charts (root level - not categorized)
  'top-table-size': lazy(() =>
    import('@/components/charts/top-table-size').then((m) => ({
      default: m.default,
    }))
  ),

  // Page Views Charts (root level - not categorized)
  'page-view': lazy(() =>
    import('@/components/charts/page-view').then((m) => ({
      default: m.PageViewBarChart,
    }))
  ),

  // ZooKeeper Charts (components/charts/zookeeper/)
  'zookeeper-summary-table': lazy(() =>
    import('@/components/charts/zookeeper/zookeeper-summary-table').then((m) => ({
      default: m.default,
    }))
  ),
  'zookeeper-uptime': lazy(() =>
    import('@/components/charts/zookeeper/zookeeper-uptime').then((m) => ({
      default: m.ChartZookeeperUptime,
    }))
  ),
  'zookeeper-requests': lazy(() =>
    import('@/components/charts/zookeeper/zookeeper-requests').then((m) => ({
      default: m.default,
    }))
  ),
  'zookeeper-wait': lazy(() =>
    import('@/components/charts/zookeeper/zookeeper-wait').then((m) => ({
      default: m.default,
    }))
  ),
  'zookeeper-exception': lazy(() =>
    import('@/components/charts/zookeeper/zookeeper-exception').then((m) => ({
      default: m.ChartKeeperException,
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
