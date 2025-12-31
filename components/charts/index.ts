/**
 * Charts module barrel export
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

// Core chart components
export { ChartError } from './chart-error'
export { ChartEmpty } from './chart-empty'
export { ChartContainer } from './chart-container'
export type { ChartProps } from './chart-props'

// Re-export ChartSkeleton from skeletons
export { ChartSkeleton } from '@/components/skeletons'

// Chart registry (dynamic lazy loading)
export {
  getChartComponent,
  hasChart,
  getRegisteredChartNames,
  getChartSkeletonType,
  CHART_TYPE_HINTS,
  type ChartComponent,
  type ChartSkeletonType,
} from './chart-registry'

// Query charts
export { ChartQueryCount } from './query/query-count'
export { ChartQueryCountByUser } from './query/query-count-by-user'
export { ChartQueryDuration } from './query/query-duration'
export { ChartQueryMemory } from './query/query-memory'
export { ChartQueryType } from './query/query-type'
export { ChartFailedQueryCount } from './query/failed-query-count'
export { ChartFailedQueryCountByType } from './query/failed-query-count-by-user'
export { ChartQueryCache } from './query/query-cache'

// Merge charts
export { ChartMergeCount } from './merge/merge-count'
export { ChartMergeAvgDuration } from './merge/merge-avg-duration'
export { ChartMergeSumReadRows } from './merge/merge-sum-read-rows'
export { ChartNewPartsCreated } from './merge/new-parts-created'
export { ChartSummaryUsedByMerges } from './merge/summary-used-by-merges'

// System charts
export { ChartCPUUsage } from './system/cpu-usage'
export { ChartMemoryUsage } from './system/memory-usage'
export { ChartDisksUsage } from './system/disks-usage'
export { ChartDiskSize } from './system/disk-size'
export { ChartBackupSize } from './system/backup-size'

// Replication charts
export { ChartReplicationQueueCount } from './replication/replication-queue-count'
export { ChartReplicationSummaryTable } from './replication/replication-summary-table'
export { ChartReadonlyReplica } from './replication/readonly-replica'

// ZooKeeper charts
export { ChartZookeeperUptime } from './zookeeper/zookeeper-uptime'
export { ChartZookeeperRequests } from './zookeeper/zookeeper-requests'
export { ChartZookeeperWait } from './zookeeper/zookeeper-wait'
export { ChartKeeperException } from './zookeeper/zookeeper-exception'
export { ChartZookeeperSummaryTable } from './zookeeper/zookeeper-summary-table'

// Other charts (root level)
export { ChartConnectionsInterserver } from './connections-interserver'
export { ChartConnectionsHttp } from './connections-http'
export { ChartSummaryUsedByMutations } from './summary-used-by-mutations'
export { ChartSummaryUsedByRunningQueries } from './summary-used-by-running-queries'
export { PageViewBarChart } from './page-view'

// Table charts
export { ChartTopTableSize } from './top-table-size'

// Factory functions
export { createAreaChart } from './factory/create-area-chart'
export { createBarChart } from './factory/create-bar-chart'
export { createCustomChart } from './factory/create-custom-chart'
export type {
  AreaChartFactoryConfig,
  BarChartFactoryConfig,
  CustomChartFactoryConfig,
} from './factory/types'

// Primitive chart components
export { AreaChart } from './primitives/area'
export { BarChart } from './primitives/bar'
export { BarList } from './primitives/bar-list'
export { DonutChart } from './primitives/donut'

// Other
export { GithubHeatmapChart } from './github-heatmap-chart'
export { MetricCard } from './metric-card'
