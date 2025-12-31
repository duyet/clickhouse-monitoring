import type { ClickHouseInterval } from './clickhouse-interval'

/**
 * Base chart data point interface
 * Represents a single row of chart data with dynamic properties
 *
 * Note: This type is intentionally permissive to support various data structures
 * including nested objects and arrays that may appear in chart data.
 * For type safety in chart components, use specific generic types with useChartData.
 */
export interface ChartDataPoint {
  [key: string]: unknown
}

/**
 * Time series data point with required event_time field
 * Used for time-based charts
 */
export interface TimeSeriesPoint extends ChartDataPoint {
  event_time: string
}

/**
 * Query parameters for chart data requests
 */
export interface ChartQueryParams {
  interval?: ClickHouseInterval
  lastHours?: number
  params?: Record<string, unknown>
}

/**
 * Result of a chart query builder function
 * Contains SQL query and metadata for execution
 */
export interface ChartQueryResult<_T extends ChartDataPoint = ChartDataPoint> {
  query: string
  queryParams?: Record<string, unknown>
  optional?: boolean
  tableCheck?: string | string[]
}

/**
 * Result for multi-chart queries
 * Contains multiple queries with keys for identification
 */
export interface MultiChartQueryResult {
  queries: Array<{ key: string; query: string; optional?: boolean }>
}

/**
 * Query builder function type
 * Takes parameters and returns a query configuration
 */
export type ChartQueryBuilder<T extends ChartDataPoint = ChartDataPoint> = (
  params: ChartQueryParams
) => ChartQueryResult<T> | MultiChartQueryResult
