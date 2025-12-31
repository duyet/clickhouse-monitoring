/**
 * Chart registry that maps chart names to their query builders
 * Provides centralized access to all available charts and their SQL queries
 *
 * This file now serves as a central re-export point for all domain-specific chart modules.
 * The chart definitions have been split into domain modules for better organization:
 * - query-charts: Query monitoring and performance
 * - merge-charts: Merge operation metrics
 * - system-charts: CPU, memory, disk, and system metrics
 * - connection-charts: HTTP and inter-server connections
 * - replication-charts: Replication queue and status
 * - zookeeper-charts: ZooKeeper/Keeper metrics
 * - page-view-charts: Application page views
 * - overview-charts: Overview page system status
 * - dashboard-charts: Custom dashboard configuration
 */

// Import all domain chart modules
import { connectionCharts } from './charts/connection-charts'
import { dashboardCharts } from './charts/dashboard-charts'
import { mergeCharts } from './charts/merge-charts'
import { overviewCharts } from './charts/overview-charts'
import { pageViewCharts } from './charts/page-view-charts'
import { queryCharts } from './charts/query-charts'
import { replicationCharts } from './charts/replication-charts'
import { systemCharts } from './charts/system-charts'
import { zookeeperCharts } from './charts/zookeeper-charts'

// Import types for use within this file
import type { ChartQueryBuilder, ChartDataPoint } from './charts/types'

// Re-export types from the central types module (via charts/types)
export type {
  ChartQueryBuilder,
  ChartQueryParams,
  ChartQueryResult,
  MultiChartQueryResult,
  ChartDataPoint,
} from './charts/types'

/**
 * Chart registry mapping chart names to their SQL query builders.
 * This centralizes all chart queries for the API endpoints.
 *
 * The registry is composed by combining all domain-specific chart modules,
 * allowing for better code organization and maintainability.
 */
export const chartRegistry: Record<string, ChartQueryBuilder<ChartDataPoint>> = {
  // Query monitoring charts
  ...queryCharts,

  // Merge operation charts
  ...mergeCharts,

  // System metrics charts
  ...systemCharts,

  // Connection charts
  ...connectionCharts,

  // Replication charts
  ...replicationCharts,

  // ZooKeeper charts
  ...zookeeperCharts,

  // Page view charts
  ...pageViewCharts,

  // Overview page charts
  ...overviewCharts,

  // Dashboard configuration charts
  ...dashboardCharts,
}

/**
 * Get a chart query by name with optional parameters
 */
export function getChartQuery(
  chartName: string,
  params: import('./charts/types').ChartQueryParams = {}
):
  | import('./charts/types').ChartQueryResult
  | import('./charts/types').MultiChartQueryResult
  | null {
  const builder = chartRegistry[chartName]
  if (!builder) {
    return null
  }

  return builder(params)
}

/**
 * Get all available chart names
 */
export function getAvailableCharts(): string[] {
  return Object.keys(chartRegistry)
}

/**
 * Check if a chart exists in the registry
 */
export function hasChart(chartName: string): boolean {
  return chartName in chartRegistry
}
