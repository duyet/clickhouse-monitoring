/**
 * RenderChart type definitions
 */

import type { ChartColor } from '../chart-colors'

/**
 * Chart parameter types for query execution
 * Matches the types expected by useFetchData hook
 */
export interface ChartParams {
  lastHours?: number
  startDate?: string
  endDate?: string
  interval?: number
  database?: string
  table?: string
  [key: string]: string | number | boolean | undefined
}

/**
 * Supported chart kinds for RenderChart component
 */
export type ChartKind = 'area' | 'bar' | 'calendar'

/**
 * Props for RenderChart component
 */
export interface RenderChartProps {
  /**
   * Type of chart to render
   */
  kind: ChartKind

  /**
   * Chart title displayed in the card header
   */
  title: string

  /**
   * SQL query to fetch chart data
   */
  query: string

  /**
   * Query parameters for the SQL query
   */
  params: ChartParams

  /**
   * Custom color palette (CSS variable names)
   * Defaults to standard chart colors if not provided
   */
  colors?: ChartColor[]

  /**
   * Additional CSS class name for the chart card wrapper
   */
  className?: string

  /**
   * Additional CSS class name for the inner chart component
   */
  chartClassName?: string

  /**
   * ClickHouse host ID for data fetching
   */
  hostId: number
}

/**
 * Time series data point with required event_time field
 */
export interface TimeSeriesDataPoint {
  event_time: string
  [key: string]: string | number | undefined
}
