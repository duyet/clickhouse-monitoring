/**
 * Chart configuration for the Overview page.
 *
 * This module centralizes all chart configurations for the overview page,
 * providing a clean, maintainable structure for chart definitions.
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
export type ChartType = 'area' | 'bar' | 'metric' | 'custom'

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
// Chart Configurations
// ============================================================================

import { ChartMergeCount } from '@/components/charts/merge/merge-count'
import { ChartNewPartsCreated } from '@/components/charts/merge/new-parts-created'
// Import chart components
import { ChartQueryCount } from '@/components/charts/query/query-count'
import { ChartQueryCountByUser } from '@/components/charts/query/query-count-by-user'
import { ChartBackupSize } from '@/components/charts/system/backup-size'
import { ChartCPUUsage } from '@/components/charts/system/cpu-usage'
import { ChartDiskSize } from '@/components/charts/system/disk-size'
import { ChartDisksUsage } from '@/components/charts/system/disks-usage'
import { ChartMemoryUsage } from '@/components/charts/system/memory-usage'
import { ChartTopTableSize } from '@/components/charts/top-table-size'
import { ChartKeeperException } from '@/components/charts/zookeeper/zookeeper-exception'

/**
 * Overview tab charts - main metrics dashboard
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
    id: 'query-count-14d',
    component: ChartQueryCountByUser,
    title: 'Query Count last 14d',
    lastHours: 24 * 14,
    interval: 'toStartOfDay',
    className: 'w-full h-80',
    type: 'bar',
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
    id: 'merge-count',
    component: ChartMergeCount,
    title: 'Merge and PartMutation last 24h (avg)',
    lastHours: 24,
    interval: 'toStartOfHour',
    className: 'w-full h-80',
    type: 'custom',
  },
  {
    id: 'top-table-size',
    component: ChartTopTableSize,
    title: 'Top Tables by Size',
    className: 'w-full',
    type: 'custom',
  },
  {
    id: 'new-parts-created',
    component: ChartNewPartsCreated,
    className: 'w-full h-80',
    title: 'New Parts Created over last 7 days',
    interval: 'toStartOfHour',
    lastHours: 24 * 7,
    type: 'bar',
  },
]

/**
 * Errors tab charts - ZooKeeper and error monitoring
 */
export const ERRORS_TAB_CHARTS: OverviewChartConfig[] = [
  {
    id: 'keeper-exception',
    component: ChartKeeperException,
    className: 'w-full',
    type: 'bar',
  },
]

/**
 * Disks tab charts - disk usage and capacity monitoring
 */
export const DISKS_TAB_CHARTS: OverviewChartConfig[] = [
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
]

/**
 * Backups tab charts - backup monitoring
 */
export const BACKUPS_TAB_CHARTS: OverviewChartConfig[] = [
  {
    id: 'backup-size',
    component: ChartBackupSize,
    className: 'w-full',
    title: 'Backup',
    chartClassName: 'h-full h-[140px] sm:h-[160px]',
    type: 'metric',
  },
]

// ============================================================================
// Tab Configurations
// ============================================================================

/**
 * All tab configurations for the overview page
 */
export const OVERVIEW_TABS: OverviewTabConfig[] = [
  {
    value: 'overview',
    label: 'Overview',
    gridClassName:
      'grid auto-rows-fr items-stretch gap-3 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 min-w-0',
    charts: OVERVIEW_TAB_CHARTS,
  },
  {
    value: 'errors',
    label: 'Errors',
    gridClassName:
      'grid grid-cols-1 items-stretch gap-2 md:grid-cols-2 xl:grid-cols-3 min-w-0',
    charts: ERRORS_TAB_CHARTS,
  },
  {
    value: 'disks',
    label: 'Disks',
    gridClassName:
      'grid grid-cols-1 items-stretch gap-2 md:grid-cols-2 xl:grid-cols-3 min-w-0',
    charts: DISKS_TAB_CHARTS,
  },
  {
    value: 'backups',
    label: 'Backups',
    gridClassName:
      'grid grid-cols-1 items-stretch gap-2 md:grid-cols-2 xl:grid-cols-3 min-w-0',
    charts: BACKUPS_TAB_CHARTS,
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
