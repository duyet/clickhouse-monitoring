/**
 * Shared types for chart query registry
 * Extracted from lib/api/chart-registry.ts to avoid duplication across modules
 *
 * This module now re-exports types from the central types/chart-data module
 * to maintain type consistency across the application.
 */

// Re-export helper functions from clickhouse-query
export { applyInterval, fillStep, nowOrToday } from '@/lib/clickhouse-query'
// Re-export all chart data types from the central types module
export type {
  ChartDataPoint,
  ChartQueryBuilder,
  ChartQueryParams,
  ChartQueryResult,
  MultiChartQueryResult,
  TimeSeriesPoint,
} from '@/types/chart-data'
