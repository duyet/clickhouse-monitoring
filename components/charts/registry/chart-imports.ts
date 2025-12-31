/**
 * Chart Imports
 *
 * All lazy-loaded chart component imports organized by category.
 * This file centralizes the lazy imports to eliminate duplication across the codebase.
 */

import { lazy } from 'react'
import type { ChartRegistryMap } from './types'

/**
 * Lazy-loaded chart components registry
 *
 * Charts are organized by category:
 * - query/      - Query-related charts
 * - merge/      - Merge operation charts
 * - system/     - System metrics
 * - replication/ - Replication charts
 * - zookeeper/  - ZooKeeper charts
 * - factory/    - Factory functions for creating charts
 * - primitives/  - Base chart components
 *
 * Note: Overview charts (database-table-count, running-queries) are server components
 * and are not compatible with the client-side chart registry pattern.
 * They must be imported directly in server components.
 */
export const chartImports: ChartRegistryMap = {
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
}
