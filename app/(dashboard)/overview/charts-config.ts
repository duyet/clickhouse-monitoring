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
import { ChartConnectionsHttp } from '@/components/charts/connections-http'
import { ChartConnectionsPool } from '@/components/charts/connections-pool'
// Logs charts
import { ChartCrashFrequency } from '@/components/charts/logs/crash-frequency'
import { ChartErrorRateOverTime } from '@/components/charts/logs/error-rate-over-time'
import { ChartLogLevelDistribution } from '@/components/charts/logs/log-level-distribution'
// Merge charts
import { ChartMergeAvgDuration } from '@/components/charts/merge/merge-avg-duration'
import { ChartMergeCount } from '@/components/charts/merge/merge-count'
import { ChartMergeSumReadRows } from '@/components/charts/merge/merge-sum-read-rows'
import { ChartNewPartsCreated } from '@/components/charts/merge/new-parts-created'
import { ChartSummaryUsedByMerges } from '@/components/charts/merge/summary-used-by-merges'
import { ChartPartsPerTable } from '@/components/charts/parts-per-table'
// Query additional charts
import { ChartCancelledQueries } from '@/components/charts/query/cancelled-queries'
// Query charts
import { ChartFailedQueryCount } from '@/components/charts/query/failed-query-count'
import { ChartFailedQueryCountByUser } from '@/components/charts/query/failed-query-count-by-user'
import { ChartQueryCache } from '@/components/charts/query/query-cache'
import { ChartQueryCacheUsage } from '@/components/charts/query/query-cache-usage'
import { ChartQueryCount } from '@/components/charts/query/query-count'
import { ChartQueryCountByUser } from '@/components/charts/query/query-count-by-user'
import { ChartQueryCountHeatmap } from '@/components/charts/query/query-count-heatmap'
import { ChartQueryDuration } from '@/components/charts/query/query-duration'
import { ChartQueryDurationPercentiles } from '@/components/charts/query/query-duration-percentiles'
import { ChartQueryMemory } from '@/components/charts/query/query-memory'
import { ChartQueryType } from '@/components/charts/query/query-type'
import { ChartSlowQueryOccurrences } from '@/components/charts/query/slow-query-occurrences'
import { ChartTopQueryFingerprints } from '@/components/charts/query/top-query-fingerprints'
// Query performance charts
import { ChartInsertPerformance } from '@/components/charts/query-performance/insert-performance'
import { ChartQueryDurationTrend } from '@/components/charts/query-performance/query-duration-trend'
import { ChartTopInserters } from '@/components/charts/query-performance/top-inserters'
import { ChartTopQueryFingerprints as ChartTopQueryFingerprintsPerf } from '@/components/charts/query-performance/top-query-fingerprints'
// Replication charts
import { ChartReadonlyReplica } from '@/components/charts/replication/readonly-replica'
import { ChartReplicationLag } from '@/components/charts/replication/replication-lag'
import { ChartReplicationQueueCount } from '@/components/charts/replication/replication-queue-count'
import { ChartReplicationSummaryTable } from '@/components/charts/replication/replication-summary-table'
import { ChartSummaryStuckMutations } from '@/components/charts/summary-stuck-mutations'
// System charts
import { ChartBackupSize } from '@/components/charts/system/backup-size'
import { ChartCompressionRatio } from '@/components/charts/system/compression-ratio'
import { ChartCPUUsage } from '@/components/charts/system/cpu-usage'
import { ChartDataFreshness } from '@/components/charts/system/data-freshness'
import { ChartDiskIOThroughput } from '@/components/charts/system/disk-io-throughput'
import { ChartDiskSize } from '@/components/charts/system/disk-size'
import { ChartDiskUsageByDatabase } from '@/components/charts/system/disk-usage-by-database'
import { ChartDiskUsageTrend } from '@/components/charts/system/disk-usage-trend'
import { ChartDisksUsage } from '@/components/charts/system/disks-usage'
import { ChartMemoryUsage } from '@/components/charts/system/memory-usage'
import { ChartMutationProgress } from '@/components/charts/system/mutation-progress'
import { ChartOomKilledQueries } from '@/components/charts/system/oom-killed-queries'
import { ChartPartitionPartHealth } from '@/components/charts/system/partition-part-health'
import { ChartStoragePolicies } from '@/components/charts/system/storage-policies'
import { ChartTopMemoryQueries } from '@/components/charts/system/top-memory-queries'
// Thread charts
import { ChartThreadUtilization } from '@/components/charts/threads/thread-utilization'
import { ChartTopTableSize } from '@/components/charts/top-table-size'
// ZooKeeper charts
import { ChartKeeperException } from '@/components/charts/zookeeper/zookeeper-exception'
import { ChartZookeeperRequests } from '@/components/charts/zookeeper/zookeeper-requests'
import { ChartZookeeperWait } from '@/components/charts/zookeeper/zookeeper-wait'

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
    id: 'query-count-heatmap-overview',
    component: ChartQueryCountHeatmap,
    title: 'Query Activity Heatmap',
    className: 'w-full h-full col-span-1 md:col-span-2 2xl:col-span-2',
    type: 'custom',
    href: '/history-queries',
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
    className: 'w-full h-full',
    type: 'custom',
    href: '/history-queries',
  },
  {
    id: 'top-query-fingerprints',
    component: ChartTopQueryFingerprints,
    title: 'Top Query Patterns',
    className: 'w-full h-full col-span-1 md:col-span-2 2xl:col-span-3',
    type: 'bar',
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
  {
    id: 'connections-http',
    component: ChartConnectionsHttp,
    title: 'HTTP Connections',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-full',
    type: 'bar',
    href: '/charts?name=connections-http',
  },
]

// ============================================================================
// Tab Configurations
// ============================================================================

const GRID_LAYOUT_3_COL =
  'grid auto-rows-[280px] items-stretch gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 xl:auto-rows-[300px] 2xl:auto-rows-[320px] min-w-0'
const GRID_LAYOUT_2_COL =
  'grid auto-rows-[280px] grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:auto-rows-[300px] 2xl:auto-rows-[320px] min-w-0'

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

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get a tab configuration by its value
 */
export function getTabConfig(value: string): OverviewTabConfig | undefined {
  return OVERVIEW_TABS.find((tab) => tab.value === value)
}

/**
 * Get all chart IDs across all tabs
 */
export function getAllChartIds(): string[] {
  return OVERVIEW_TABS.flatMap((tab) => tab.charts.map((chart) => chart.id))
}

/**
 * Get charts for a specific tab
 */
export function getChartsForTab(tabValue: string): OverviewChartConfig[] {
  const tab = getTabConfig(tabValue)
  return tab?.charts ?? []
}
