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

// Connection charts
import { ChartConnectionsHttp } from '@/components/charts/connections-http'
import { ChartConnectionsInterserver } from '@/components/charts/connections-interserver'
// Merge charts
import { ChartMergeAvgDuration } from '@/components/charts/merge/merge-avg-duration'
import { ChartMergeCount } from '@/components/charts/merge/merge-count'
import { ChartNewPartsCreated } from '@/components/charts/merge/new-parts-created'
// Query charts
import { ChartFailedQueryCount } from '@/components/charts/query/failed-query-count'
import { ChartQueryCache } from '@/components/charts/query/query-cache'
import { ChartQueryCacheUsage } from '@/components/charts/query/query-cache-usage'
import { ChartQueryCount } from '@/components/charts/query/query-count'
import { ChartQueryCountByUser } from '@/components/charts/query/query-count-by-user'
import { ChartQueryDuration } from '@/components/charts/query/query-duration'
import { ChartQueryMemory } from '@/components/charts/query/query-memory'
import { ChartQueryType } from '@/components/charts/query/query-type'
// Replication charts
import { ChartReadonlyReplica } from '@/components/charts/replication/readonly-replica'
import { ChartReplicationLag } from '@/components/charts/replication/replication-lag'
import { ChartReplicationQueueCount } from '@/components/charts/replication/replication-queue-count'
import { ChartReplicationSummaryTable } from '@/components/charts/replication/replication-summary-table'
// System charts
import { ChartBackupSize } from '@/components/charts/system/backup-size'
import { ChartCPUUsage } from '@/components/charts/system/cpu-usage'
import { ChartDiskSize } from '@/components/charts/system/disk-size'
import { ChartDisksUsage } from '@/components/charts/system/disks-usage'
import { ChartMemoryUsage } from '@/components/charts/system/memory-usage'
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
    title: 'Query Count last 24h',
    lastHours: 24,
    interval: 'toStartOfHour',
    className: 'w-full h-80',
    type: 'area',
  },
  {
    id: 'query-count-by-user-24h',
    component: ChartQueryCountByUser,
    title: 'Query Count by User last 24h',
    lastHours: 24,
    interval: 'toStartOfHour',
    className: 'w-full h-80',
    type: 'bar',
  },
  {
    id: 'query-duration',
    component: ChartQueryDuration,
    title: 'Query Duration Trend (14 days)',
    lastHours: 24 * 14,
    interval: 'toStartOfDay',
    className: 'w-full h-80',
    type: 'bar',
  },
  {
    id: 'failed-query-count',
    component: ChartFailedQueryCount,
    title: 'Failed Queries (7 days)',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-80',
    type: 'area',
  },
  {
    id: 'memory-usage',
    component: ChartMemoryUsage,
    title: 'Memory Usage last 24h (avg / 10 minutes)',
    className: 'w-full h-80',
    interval: 'toStartOfTenMinutes',
    lastHours: 24,
    type: 'area',
  },
  {
    id: 'cpu-usage',
    component: ChartCPUUsage,
    title: 'CPU Usage last 24h (avg / 10 minutes)',
    className: 'w-full h-80',
    interval: 'toStartOfTenMinutes',
    lastHours: 24,
    type: 'area',
  },
  {
    id: 'disks-usage-overview',
    component: ChartDisksUsage,
    className: 'w-full h-80',
    title: 'Disks Usage Trend (30 days)',
    interval: 'toStartOfDay',
    lastHours: 24 * 30,
    type: 'area',
  },
  {
    id: 'top-table-size',
    component: ChartTopTableSize,
    title: 'Top Tables by Size',
    className: 'w-full',
    type: 'custom',
  },
  {
    id: 'replication-queue-count-overview',
    component: ChartReplicationQueueCount,
    title: 'Replication Queue',
    className: 'w-full',
    type: 'metric',
  },
]

/**
 * Queries tab charts - query performance and patterns (detailed view)
 */
export const QUERIES_TAB_CHARTS: OverviewChartConfig[] = [
  {
    id: 'query-count-14d',
    component: ChartQueryCountByUser,
    title: 'Query Count last 14 days',
    lastHours: 24 * 14,
    interval: 'toStartOfDay',
    className: 'w-full h-80',
    type: 'bar',
  },
  {
    id: 'query-memory',
    component: ChartQueryMemory,
    title: 'Avg Query Memory Usage (14 days)',
    lastHours: 24 * 14,
    interval: 'toStartOfDay',
    className: 'w-full h-80',
    type: 'bar',
  },
  {
    id: 'query-cache',
    component: ChartQueryCache,
    title: 'Query Cache Status',
    className: 'w-full',
    type: 'metric',
  },
  {
    id: 'query-cache-usage',
    component: ChartQueryCacheUsage,
    title: 'Query Cache Hit Rate',
    lastHours: 24 * 7,
    className: 'w-full h-80',
    type: 'bar',
  },
  {
    id: 'query-type',
    component: ChartQueryType,
    title: 'Query Type Distribution (24h)',
    lastHours: 24,
    className: 'w-full h-80',
    type: 'custom',
  },
]

/**
 * Storage tab charts - disk usage, tables, parts, backups
 */
export const STORAGE_TAB_CHARTS: OverviewChartConfig[] = [
  {
    id: 'disk-size',
    component: ChartDiskSize,
    className: 'w-full',
    title: 'Disk Size',
    type: 'metric',
  },
  {
    id: 'disks-usage',
    component: ChartDisksUsage,
    className: 'w-full h-80',
    title: 'Disks Usage over last 30 days',
    interval: 'toStartOfDay',
    lastHours: 24 * 30,
    type: 'area',
  },
  {
    id: 'top-table-size-storage',
    component: ChartTopTableSize,
    title: 'Top Tables by Size',
    className: 'w-full',
    type: 'custom',
  },
  {
    id: 'new-parts-created',
    component: ChartNewPartsCreated,
    className: 'w-full h-80',
    title: 'New Parts Created (7 days)',
    interval: 'toStartOfHour',
    lastHours: 24 * 7,
    type: 'bar',
  },
  {
    id: 'backup-size',
    component: ChartBackupSize,
    className: 'w-full',
    title: 'Backup Size',
    chartClassName: 'h-full h-[140px] sm:h-[160px]',
    type: 'metric',
  },
]

/**
 * Operations tab charts - merge operations and replication health
 */
export const OPERATIONS_TAB_CHARTS: OverviewChartConfig[] = [
  {
    id: 'merge-count',
    component: ChartMergeCount,
    title: 'Merge and PartMutation (24h)',
    lastHours: 24,
    interval: 'toStartOfHour',
    className: 'w-full h-80',
    type: 'custom',
  },
  {
    id: 'merge-avg-duration',
    component: ChartMergeAvgDuration,
    title: 'Merge Avg Duration (14 days)',
    lastHours: 24 * 14,
    interval: 'toStartOfDay',
    className: 'w-full h-80',
    type: 'bar',
  },
  {
    id: 'replication-queue-count',
    component: ChartReplicationQueueCount,
    title: 'Replication Queue',
    className: 'w-full',
    type: 'metric',
  },
  {
    id: 'replication-lag',
    component: ChartReplicationLag,
    title: 'Replication Lag',
    className: 'w-full',
    type: 'table',
  },
  {
    id: 'replication-summary-table',
    component: ChartReplicationSummaryTable,
    title: 'Replication Queue by Table',
    className: 'w-full',
    type: 'table',
  },
  {
    id: 'readonly-replica',
    component: ChartReadonlyReplica,
    title: 'Readonly Replicas (24h)',
    lastHours: 24,
    interval: 'toStartOfFifteenMinutes',
    className: 'w-full h-80',
    type: 'bar',
  },
]

/**
 * Health tab charts - errors, connections, and coordination
 */
export const HEALTH_TAB_CHARTS: OverviewChartConfig[] = [
  {
    id: 'failed-queries-health',
    component: ChartFailedQueryCount,
    title: 'Failed Queries (7 days)',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-80',
    type: 'area',
  },
  {
    id: 'keeper-exception',
    component: ChartKeeperException,
    title: 'ZooKeeper/Keeper Exceptions',
    className: 'w-full h-80',
    type: 'bar',
  },
  {
    id: 'zookeeper-wait',
    component: ChartZookeeperWait,
    title: 'ZooKeeper Wait Time (7 days)',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-80',
    type: 'bar',
  },
  {
    id: 'zookeeper-requests',
    component: ChartZookeeperRequests,
    title: 'ZooKeeper Requests (7 days)',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-80',
    type: 'bar',
  },
  {
    id: 'connections-http',
    component: ChartConnectionsHttp,
    title: 'HTTP Connections (7 days)',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-80',
    type: 'bar',
  },
  {
    id: 'connections-interserver',
    component: ChartConnectionsInterserver,
    title: 'Interserver Connections (7 days)',
    lastHours: 24 * 7,
    interval: 'toStartOfHour',
    className: 'w-full h-80',
    type: 'bar',
  },
]

// ============================================================================
// Tab Configurations
// ============================================================================

const GRID_LAYOUT_3_COL =
  'grid auto-rows-fr items-stretch gap-3 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 min-w-0'
const GRID_LAYOUT_2_COL =
  'grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 min-w-0'

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
