/**
 * Chart configuration for the Overview page.
 *
 * This module centralizes all chart configurations for the overview page,
 * providing a clean, maintainable structure for chart definitions.
 *
 * Tab Structure:
 * - Overview: At-a-glance health metrics (query, memory, CPU, disk, replication)
 * - Queries: Query performance and patterns
 * - Storage: Disk usage, tables, parts, backups
 * - Operations: Merge operations and replication health
 * - Health: Errors, connections, and coordination
 */

import type { ComponentType } from 'react'
import type { ChartProps } from '@/components/charts/chart-props'
import type { ClickHouseInterval } from '@/types/clickhouse-interval'

import dynamic from 'next/dynamic'

// ============================================================================
// Types
// ============================================================================

/**
 * Chart type categories supported by the overview page
 */
export type ChartType = 'area' | 'bar' | 'metric' | 'custom' | 'table'

/**
 * Configuration for a single chart instance in the overview page
 */
export interface OverviewChartConfig<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Unique identifier for this chart configuration */
  id: string
  /** Chart component to render */
  component: ComponentType<ChartProps & T>
  /** Display title for the chart */
  title?: string
  /** Time interval for data aggregation (e.g., 'toStartOfHour', 'toStartOfDay') */
  interval?: ClickHouseInterval
  /** Number of hours of historical data to display */
  lastHours?: number
  /** Custom CSS className */
  className?: string
  /** Custom chart CSS className */
  chartClassName?: string
  /** Custom chart card content className */
  chartCardContentClassName?: string
  /** Type of chart (for documentation/filtering) */
  type?: ChartType
  /** Additional props to pass to the chart component */
  props?: Omit<T, 'hostId'>
  /** Navigation target URL when clicked */
  href?: string
}

/**
 * Tab configuration for organizing charts into tabs
 */
export interface OverviewTabConfig {
  /** Tab value identifier */
  value: string
  /** Display label for the tab */
  label: string
  /** Grid layout class for the tab content */
  gridClassName: string
  /** Charts to display in this tab */
  charts: OverviewChartConfig[]
}

// ============================================================================
// Chart Imports
// ============================================================================

// ============================================================================
// Chart Imports
// ============================================================================

// ============================================================================
// Chart Imports
// ============================================================================

// ============================================================================
// Chart Imports
// ============================================================================

// Connection charts
const ChartConnectionsPool = dynamic(() =>
  import('@/components/charts/connections-pool').then(
    (mod) => mod.ChartConnectionsPool
  )
)
// Logs charts
const ChartCrashFrequency = dynamic(() =>
  import('@/components/charts/logs/crash-frequency').then(
    (mod) => mod.ChartCrashFrequency
  )
)
const ChartErrorRateOverTime = dynamic(() =>
  import('@/components/charts/logs/error-rate-over-time').then(
    (mod) => mod.ChartErrorRateOverTime
  )
)
const ChartLogLevelDistribution = dynamic(() =>
  import('@/components/charts/logs/log-level-distribution').then(
    (mod) => mod.ChartLogLevelDistribution
  )
)
// Merge charts
const ChartMergeAvgDuration = dynamic(() =>
  import('@/components/charts/merge/merge-avg-duration').then(
    (mod) => mod.ChartMergeAvgDuration
  )
)
const ChartMergeCount = dynamic(() =>
  import('@/components/charts/merge/merge-count').then(
    (mod) => mod.ChartMergeCount
  )
)
const ChartMergeSumReadRows = dynamic(() =>
  import('@/components/charts/merge/merge-sum-read-rows').then(
    (mod) => mod.ChartMergeSumReadRows
  )
)
const ChartNewPartsCreated = dynamic(() =>
  import('@/components/charts/merge/new-parts-created').then(
    (mod) => mod.ChartNewPartsCreated
  )
)
const ChartSummaryUsedByMerges = dynamic(() =>
  import('@/components/charts/merge/summary-used-by-merges').then(
    (mod) => mod.ChartSummaryUsedByMerges
  )
)
const ChartPartsPerTable = dynamic(() =>
  import('@/components/charts/parts-per-table').then(
    (mod) => mod.ChartPartsPerTable
  )
)
// Query additional charts
const ChartCancelledQueries = dynamic(() =>
  import('@/components/charts/query/cancelled-queries').then(
    (mod) => mod.ChartCancelledQueries
  )
)
// Query charts
const ChartFailedQueryCount = dynamic(() =>
  import('@/components/charts/query/failed-query-count').then(
    (mod) => mod.ChartFailedQueryCount
  )
)
const ChartFailedQueryCountByUser = dynamic(() =>
  import('@/components/charts/query/failed-query-count-by-user').then(
    (mod) => mod.ChartFailedQueryCountByUser
  )
)
const ChartQueryCache = dynamic(() =>
  import('@/components/charts/query/query-cache').then(
    (mod) => mod.ChartQueryCache
  )
)
const ChartQueryCacheUsage = dynamic(() =>
  import('@/components/charts/query/query-cache-usage').then(
    (mod) => mod.ChartQueryCacheUsage
  )
)
const ChartQueryCount = dynamic(() =>
  import('@/components/charts/query/query-count').then(
    (mod) => mod.ChartQueryCount
  )
)
const ChartQueryCountByUser = dynamic(() =>
  import('@/components/charts/query/query-count-by-user').then(
    (mod) => mod.ChartQueryCountByUser
  )
)
const ChartQueryCountHeatmap = dynamic(() =>
  import('@/components/charts/query/query-count-heatmap').then(
    (mod) => mod.ChartQueryCountHeatmap
  )
)
const ChartQueryDuration = dynamic(() =>
  import('@/components/charts/query/query-duration').then(
    (mod) => mod.ChartQueryDuration
  )
)
const ChartQueryDurationPercentiles = dynamic(() =>
  import('@/components/charts/query/query-duration-percentiles').then(
    (mod) => mod.ChartQueryDurationPercentiles
  )
)
const ChartQueryMemory = dynamic(() =>
  import('@/components/charts/query/query-memory').then(
    (mod) => mod.ChartQueryMemory
  )
)
const ChartQueryType = dynamic(() =>
  import('@/components/charts/query/query-type').then(
    (mod) => mod.ChartQueryType
  )
)
const ChartSlowQueryOccurrences = dynamic(() =>
  import('@/components/charts/query/slow-query-occurrences').then(
    (mod) => mod.ChartSlowQueryOccurrences
  )
)
// Query performance charts
const ChartInsertPerformance = dynamic(() =>
  import('@/components/charts/query-performance/insert-performance').then(
    (mod) => mod.ChartInsertPerformance
  )
)
const ChartQueryDurationTrend = dynamic(() =>
  import('@/components/charts/query-performance/query-duration-trend').then(
    (mod) => mod.ChartQueryDurationTrend
  )
)
const ChartTopInserters = dynamic(() =>
  import('@/components/charts/query-performance/top-inserters').then(
    (mod) => mod.ChartTopInserters
  )
)
const ChartTopQueryFingerprintsPerf = dynamic(() =>
  import('@/components/charts/query-performance/top-query-fingerprints').then(
    (mod) => mod.ChartTopQueryFingerprints
  )
)
// Replication charts
const ChartReadonlyReplica = dynamic(() =>
  import('@/components/charts/replication/readonly-replica').then(
    (mod) => mod.ChartReadonlyReplica
  )
)
const ChartReplicationLag = dynamic(() =>
  import('@/components/charts/replication/replication-lag').then(
    (mod) => mod.ChartReplicationLag
  )
)
const ChartReplicationQueueCount = dynamic(() =>
  import('@/components/charts/replication/replication-queue-count').then(
    (mod) => mod.ChartReplicationQueueCount
  )
)
const ChartReplicationSummaryTable = dynamic(() =>
  import('@/components/charts/replication/replication-summary-table').then(
    (mod) => mod.ChartReplicationSummaryTable
  )
)
const ChartSummaryStuckMutations = dynamic(() =>
  import('@/components/charts/summary-stuck-mutations').then(
    (mod) => mod.ChartSummaryStuckMutations
  )
)
// System charts
const ChartBackupSize = dynamic(() =>
  import('@/components/charts/system/backup-size').then(
    (mod) => mod.ChartBackupSize
  )
)
const ChartCompressionRatio = dynamic(() =>
  import('@/components/charts/system/compression-ratio').then(
    (mod) => mod.ChartCompressionRatio
  )
)
const ChartCPUUsage = dynamic(() =>
  import('@/components/charts/system/cpu-usage').then(
    (mod) => mod.ChartCPUUsage
  )
)
const ChartDataFreshness = dynamic(() =>
  import('@/components/charts/system/data-freshness').then(
    (mod) => mod.ChartDataFreshness
  )
)
const ChartDiskIOThroughput = dynamic(() =>
  import('@/components/charts/system/disk-io-throughput').then(
    (mod) => mod.ChartDiskIOThroughput
  )
)
const ChartDiskSize = dynamic(() =>
  import('@/components/charts/system/disk-size').then(
    (mod) => mod.ChartDiskSize
  )
)
const ChartDiskUsageByDatabase = dynamic(() =>
  import('@/components/charts/system/disk-usage-by-database').then(
    (mod) => mod.ChartDiskUsageByDatabase
  )
)
const ChartDiskUsageTrend = dynamic(() =>
  import('@/components/charts/system/disk-usage-trend').then(
    (mod) => mod.ChartDiskUsageTrend
  )
)
const ChartDisksUsage = dynamic(() =>
  import('@/components/charts/system/disks-usage').then(
    (mod) => mod.ChartDisksUsage
  )
)
const ChartMemoryUsage = dynamic(() =>
  import('@/components/charts/system/memory-usage').then(
    (mod) => mod.ChartMemoryUsage
  )
)
const ChartMutationProgress = dynamic(() =>
  import('@/components/charts/system/mutation-progress').then(
    (mod) => mod.ChartMutationProgress
  )
)
const ChartOomKilledQueries = dynamic(() =>
  import('@/components/charts/system/oom-killed-queries').then(
    (mod) => mod.ChartOomKilledQueries
  )
)
const ChartPartitionPartHealth = dynamic(() =>
  import('@/components/charts/system/partition-part-health').then(
    (mod) => mod.ChartPartitionPartHealth
  )
)
const ChartStoragePolicies = dynamic(() =>
  import('@/components/charts/system/storage-policies').then(
    (mod) => mod.ChartStoragePolicies
  )
)
const ChartTopMemoryQueries = dynamic(() =>
  import('@/components/charts/system/top-memory-queries').then(
    (mod) => mod.ChartTopMemoryQueries
  )
)
// Thread charts
const ChartThreadUtilization = dynamic(() =>
  import('@/components/charts/threads/thread-utilization').then(
    (mod) => mod.ChartThreadUtilization
  )
)
const ChartTopTableSize = dynamic(() =>
  import('@/components/charts/top-table-size').then(
    (mod) => mod.ChartTopTableSize
  )
)
// ZooKeeper charts
const ChartKeeperException = dynamic(() =>
  import('@/components/charts/zookeeper/zookeeper-exception').then(
    (mod) => mod.ChartKeeperException
  )
)
const ChartZookeeperRequests = dynamic(() =>
  import('@/components/charts/zookeeper/zookeeper-requests').then(
    (mod) => mod.ChartZookeeperRequests
  )
)
const ChartZookeeperWait = dynamic(() =>
  import('@/components/charts/zookeeper/zookeeper-wait').then(
    (mod) => mod.ChartZookeeperWait
  )
)

// ============================================================================
// Chart Configurations by Tab
// ============================================================================

/**
 * Overview tab charts - at-a-glance health metrics
 */
export const OVERVIEW_TAB_CHARTS: OverviewChartConfig[] = [
  {
    id: 'query-count-24h',
    component: ChartQueryCount,
    title: 'Query Count',
    lastHours: 24,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'area',
    href: '/history-queries',
  },
  {
    id: 'query-count-by-user-24h',
    component: ChartQueryCountByUser,
    title: 'Query Count by User',
    lastHours: 24,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'bar',
    href: '/history-queries',
  },
  {
    id: 'query-duration',
    component: ChartQueryDuration,
    title: 'Avg Query Duration',
    lastHours: 24 * 14,
    interval: 'toStartOfDay',
    className: 'w-full h-full',
    type: 'bar',
    href: '/history-queries',
  },
  {
    id: 'query-duration-percentiles-overview',
    component: ChartQueryDurationPercentiles,
    title: 'Query Duration p50/p95/p99',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'area',
    href: '/history-queries',
  },
  {
    id: 'failed-query-count',
    component: ChartFailedQueryCount,
    title: 'Failed Queries',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'area',
    href: '/failed-queries',
  },
  {
    id: 'memory-usage',
    component: ChartMemoryUsage,
    title: 'Memory Usage',
    className: 'w-full h-full',
    interval: 'toStartOfTenMinutes',
    lastHours: 24,
    type: 'area',
    href: '/metrics',
  },
  {
    id: 'cpu-usage',
    component: ChartCPUUsage,
    title: 'CPU Usage',
    className: 'w-full h-full',
    interval: 'toStartOfTenMinutes',
    lastHours: 24,
    type: 'area',
    href: '/metrics',
  },
  {
    id: 'connections-pool-overview',
    component: ChartConnectionsPool,
    title: 'Connection Pool',
    lastHours: 24,
    interval: 'toStartOfFiveMinutes',
    className: 'w-full h-full',
    type: 'area',
    href: '/charts?name=connections-http,connections-interserver',
  },
  {
    id: 'disks-usage-overview',
    component: ChartDisksUsage,
    className: 'w-full h-full',
    title: 'Disks Usage Trend',
    interval: 'toStartOfDay',
    lastHours: 24 * 30,
    type: 'area',
    href: '/disks',
  },
  {
    id: 'top-table-size',
    component: ChartTopTableSize,
    title: 'Top Tables by Size',
    className: 'w-full h-full row-span-2',
    type: 'custom',
    href: '/tables-overview',
  },
  {
    id: 'new-parts-created-overview',
    component: ChartNewPartsCreated,
    title: 'New Parts Created',
    lastHours: 24,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'bar',
    href: '/merge-performance',
  },
  {
    id: 'merge-count-overview',
    component: ChartMergeCount,
    title: 'Merge and PartMutation',
    lastHours: 24,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'custom',
    href: '/merges',
  },
  {
    id: 'mutation-progress-overview',
    component: ChartMutationProgress,
    title: 'Mutation Progress',
    className: 'w-full h-full',
    type: 'custom',
    href: '/mutations',
  },
  {
    id: 'top-memory-queries',
    component: ChartTopMemoryQueries,
    title: 'Top Memory Queries',
    className: 'w-full h-full row-span-2',
    type: 'custom',
    href: '/expensive-queries',
  },
  {
    id: 'disk-io-throughput',
    component: ChartDiskIOThroughput,
    title: 'Disk I/O Throughput',
    lastHours: 24,
    interval: 'toStartOfFifteenMinutes',
    className: 'w-full h-full',
    type: 'area',
    href: '/disks',
  },
  {
    id: 'thread-utilization-overview',
    component: ChartThreadUtilization,
    title: 'Thread Utilization',
    lastHours: 24,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'area',
    href: '/metrics',
  },
  {
    id: 'query-count-heatmap-overview',
    component: ChartQueryCountHeatmap,
    title: 'Query Activity Heatmap',
    className: 'w-full h-full col-span-1 md:col-span-2 xl:col-span-3',
    type: 'custom',
    href: '/history-queries',
  },
]

/**
 * Queries tab charts - query performance and patterns (detailed view)
 */
export const QUERIES_TAB_CHARTS: OverviewChartConfig[] = [
  {
    id: 'query-count-14d',
    component: ChartQueryCountByUser,
    title: 'Query Count',
    lastHours: 24 * 14,
    interval: 'toStartOfDay',
    className: 'w-full h-full',
    type: 'bar',
    href: '/history-queries',
  },
  {
    id: 'query-memory',
    component: ChartQueryMemory,
    title: 'Avg Query Memory Usage',
    lastHours: 24 * 14,
    interval: 'toStartOfDay',
    className: 'w-full h-full',
    type: 'bar',
    href: '/expensive-queries',
  },
  {
    id: 'query-cache',
    component: ChartQueryCache,
    title: 'Query Cache Status',
    className: 'w-full h-full',
    type: 'metric',
    href: '/query-cache',
  },
  {
    id: 'query-cache-usage',
    component: ChartQueryCacheUsage,
    title: 'Query Cache Hit Rate',
    lastHours: 24 * 7,
    className: 'w-full h-full',
    type: 'custom',
    href: '/query-cache',
  },
  {
    id: 'query-type',
    component: ChartQueryType,
    title: 'Query Type Distribution',
    lastHours: 24,
    className: 'w-full h-full',
    type: 'custom',
    href: '/history-queries',
  },
  {
    id: 'query-duration-percentiles',
    component: ChartQueryDurationPercentiles,
    title: 'Query Duration Percentiles',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'area',
    href: '/history-queries',
  },
  {
    id: 'query-count-heatmap',
    component: ChartQueryCountHeatmap,
    title: 'Query Activity Heatmap',
    className: 'w-full h-full col-span-1 md:col-span-2 xl:col-span-3',
    type: 'custom',
    href: '/history-queries',
  },
  {
    id: 'insert-performance',
    component: ChartInsertPerformance,
    title: 'Insert Performance',
    lastHours: 24,
    interval: 'toStartOfFifteenMinutes',
    className: 'w-full h-full',
    type: 'area',
    href: '/history-queries',
  },
  {
    id: 'query-duration-trend',
    component: ChartQueryDurationTrend,
    title: 'Query Duration Trend',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'area',
    href: '/history-queries',
  },
  {
    id: 'top-inserters',
    component: ChartTopInserters,
    title: 'Top Inserters',
    className: 'w-full h-full',
    type: 'custom',
    href: '/history-queries',
  },
  {
    id: 'top-query-fingerprints-perf',
    component: ChartTopQueryFingerprintsPerf,
    title: 'Top Query Fingerprints (Perf)',
    className: 'w-full h-full col-span-1 md:col-span-2 2xl:col-span-3',
    type: 'custom',
    href: '/history-queries',
  },
]

/**
 * Storage tab charts - disk usage, tables, parts, backups
 */
export const STORAGE_TAB_CHARTS: OverviewChartConfig[] = [
  {
    id: 'disk-size',
    component: ChartDiskSize,
    className: 'w-full h-full',
    title: 'Disk Size',
    type: 'metric',
    href: '/disks',
  },
  {
    id: 'disks-usage',
    component: ChartDisksUsage,
    className: 'w-full h-full',
    title: 'Disks Usage',
    interval: 'toStartOfDay',
    lastHours: 24 * 30,
    type: 'area',
    href: '/disks',
  },
  {
    id: 'disk-usage-trend',
    component: ChartDiskUsageTrend,
    className: 'w-full h-full',
    title: 'Disk Usage Trend',
    interval: 'toStartOfDay',
    lastHours: 24 * 7,
    type: 'area',
    href: '/disks',
  },
  {
    id: 'compression-ratio',
    component: ChartCompressionRatio,
    className: 'w-full h-full',
    title: 'Compression Ratio',
    type: 'metric',
    href: '/tables-overview',
  },
  {
    id: 'data-freshness',
    component: ChartDataFreshness,
    className: 'w-full h-full',
    title: 'Data Freshness',
    interval: 'toStartOfDay',
    lastHours: 24 * 7,
    type: 'custom',
    href: '/tables-overview',
  },
  {
    id: 'top-table-size-storage',
    component: ChartTopTableSize,
    title: 'Top Tables by Size',
    className: 'w-full h-full',
    type: 'custom',
    href: '/tables-overview',
  },
  {
    id: 'new-parts-created',
    component: ChartNewPartsCreated,
    className: 'w-full h-full',
    title: 'New Parts Created',
    interval: 'toStartOfHour',
    lastHours: 24,
    type: 'bar',
    href: '/merge-performance',
  },
  {
    id: 'backup-size',
    component: ChartBackupSize,
    className: 'w-full h-full',
    title: 'Backup Size',
    chartClassName: 'h-[140px] sm:h-[160px]',
    type: 'metric',
    href: '/backups',
  },
  {
    id: 'disk-usage-by-database',
    component: ChartDiskUsageByDatabase,
    title: 'Disk Usage by Database',
    className: 'w-full h-full',
    type: 'bar',
    href: '/tables-overview',
  },
  {
    id: 'storage-policies',
    component: ChartStoragePolicies,
    title: 'Storage Policies',
    className: 'w-full h-full col-span-1 md:col-span-2 2xl:col-span-3',
    type: 'table',
    href: '/disks',
  },
  {
    id: 'parts-per-table',
    component: ChartPartsPerTable,
    title: 'Parts per Table',
    className: 'w-full h-full',
    type: 'custom',
    href: '/tables-overview',
  },
  {
    id: 'partition-part-health',
    component: ChartPartitionPartHealth,
    title: 'Partition Part Health',
    className: 'w-full h-full',
    type: 'custom',
    href: '/tables-overview',
  },
]

/**
 * Operations tab charts - merge operations and replication health
 */
export const OPERATIONS_TAB_CHARTS: OverviewChartConfig[] = [
  {
    id: 'merge-count',
    component: ChartMergeCount,
    title: 'Merge and PartMutation',
    lastHours: 24,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'custom',
    href: '/merges',
  },
  {
    id: 'merge-avg-duration',
    component: ChartMergeAvgDuration,
    title: 'Merge Avg Duration',
    lastHours: 24 * 14,
    interval: 'toStartOfDay',
    className: 'w-full h-full',
    type: 'bar',
    href: '/merge-performance',
  },
  {
    id: 'replication-queue-count',
    component: ChartReplicationQueueCount,
    title: 'Replication Queue',
    className: 'w-full h-full',
    type: 'metric',
    href: '/replication-queue',
  },
  {
    id: 'replication-summary-table',
    component: ChartReplicationSummaryTable,
    title: 'Replication Queue by Table',
    className: 'w-full h-full',
    type: 'table',
    href: '/replication-queue',
  },
  {
    id: 'readonly-replica',
    component: ChartReadonlyReplica,
    title: 'Readonly Replicas',
    lastHours: 24,
    interval: 'toStartOfFifteenMinutes',
    className: 'w-full h-full',
    type: 'bar',
    href: '/replicas',
  },
  {
    id: 'replication-lag',
    component: ChartReplicationLag,
    title: 'Replication Lag',
    className: 'w-full h-full',
    type: 'table',
    href: '/replicas',
  },
  {
    id: 'mutation-progress',
    component: ChartMutationProgress,
    title: 'Mutation Progress',
    className: 'w-full h-full',
    type: 'custom',
    href: '/mutations',
  },
  {
    id: 'merge-sum-read-rows',
    component: ChartMergeSumReadRows,
    title: 'Merge Read Rows',
    lastHours: 24 * 14,
    interval: 'toStartOfDay',
    className: 'w-full h-full',
    type: 'bar',
    href: '/merge-performance',
  },
  {
    id: 'summary-used-by-merges',
    component: ChartSummaryUsedByMerges,
    title: 'Merge Resource Usage',
    className: 'w-full h-full',
    type: 'metric',
    href: '/merges',
  },
  {
    id: 'summary-stuck-mutations',
    component: ChartSummaryStuckMutations,
    title: 'Stuck Mutations',
    className: 'w-full h-full',
    type: 'metric',
    href: '/mutations',
  },
]

/**
 * Health tab charts - errors, connections, and coordination
 */
export const HEALTH_TAB_CHARTS: OverviewChartConfig[] = [
  {
    id: 'failed-queries-health',
    component: ChartFailedQueryCount,
    title: 'Failed Queries',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'area',
    href: '/failed-queries',
  },
  {
    id: 'keeper-exception',
    component: ChartKeeperException,
    title: 'ZooKeeper/Keeper Exceptions',
    className: 'w-full h-full',
    type: 'bar',
    href: '/zookeeper',
  },
  {
    id: 'zookeeper-wait',
    component: ChartZookeeperWait,
    title: 'ZooKeeper Wait Time',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'bar',
    href: '/zookeeper',
  },
  {
    id: 'zookeeper-requests',
    component: ChartZookeeperRequests,
    title: 'ZooKeeper Requests',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'bar',
    href: '/zookeeper',
  },
  {
    id: 'connections-pool',
    component: ChartConnectionsPool,
    title: 'Connection Pool',
    lastHours: 24,
    interval: 'toStartOfFiveMinutes',
    className: 'w-full h-full',
    type: 'area',
    href: '/charts?name=connections-http,connections-interserver',
  },
  {
    id: 'oom-killed-queries',
    component: ChartOomKilledQueries,
    title: 'OOM Killed Queries',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'area',
    href: '/failed-queries',
  },
  {
    id: 'cancelled-queries',
    component: ChartCancelledQueries,
    title: 'Cancelled Queries',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'custom',
    href: '/failed-queries',
  },
  {
    id: 'slow-query-occurrences',
    component: ChartSlowQueryOccurrences,
    title: 'Slow Query Occurrences',
    className: 'w-full h-full',
    type: 'bar',
    href: '/slow-queries',
  },
  {
    id: 'failed-query-count-by-user-health',
    component: ChartFailedQueryCountByUser,
    title: 'Failed Queries by User',
    className: 'w-full h-full',
    type: 'bar',
    href: '/failed-queries',
  },
  {
    id: 'crash-frequency',
    component: ChartCrashFrequency,
    title: 'Crash Frequency',
    lastHours: 24 * 30,
    interval: 'toStartOfDay',
    className: 'w-full h-full',
    type: 'bar',
    href: '/logs',
  },
  {
    id: 'error-rate-over-time',
    component: ChartErrorRateOverTime,
    title: 'Error Rate Over Time',
    lastHours: 24,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'area',
    href: '/logs',
  },
  {
    id: 'log-level-distribution',
    component: ChartLogLevelDistribution,
    title: 'Log Level Distribution',
    className: 'w-full h-full',
    type: 'custom',
    href: '/logs',
  },
]

// ============================================================================
// Tab Configurations
// ============================================================================

const GRID_LAYOUT_3_COL =
  'grid grid-flow-dense auto-rows-[280px] items-stretch gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 xl:auto-rows-[300px] 2xl:auto-rows-[320px] min-w-0'
const GRID_LAYOUT_2_COL =
  'grid grid-flow-dense auto-rows-[280px] grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:auto-rows-[300px] 2xl:auto-rows-[320px] min-w-0'

/**
 * All tab configurations for the overview page
 */
export const OVERVIEW_TABS: OverviewTabConfig[] = [
  {
    value: 'overview',
    label: 'Overview',
    gridClassName: GRID_LAYOUT_3_COL,
    charts: OVERVIEW_TAB_CHARTS,
  },
  {
    value: 'queries',
    label: 'Queries',
    gridClassName: GRID_LAYOUT_3_COL,
    charts: QUERIES_TAB_CHARTS,
  },
  {
    value: 'storage',
    label: 'Storage',
    gridClassName: GRID_LAYOUT_3_COL,
    charts: STORAGE_TAB_CHARTS,
  },
  {
    value: 'operations',
    label: 'Operations',
    gridClassName: GRID_LAYOUT_2_COL,
    charts: OPERATIONS_TAB_CHARTS,
  },
  {
    value: 'health',
    label: 'Health',
    gridClassName: GRID_LAYOUT_3_COL,
    charts: HEALTH_TAB_CHARTS,
  },
]
