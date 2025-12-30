/**
 * Shared types for chart query registry
 * Extracted from lib/api/chart-registry.ts to avoid duplication across modules
 */

import type { ClickHouseInterval } from '@/types/clickhouse-interval'

export interface ChartQueryParams {
  interval?: ClickHouseInterval
  lastHours?: number
  params?: Record<string, unknown>
}

export interface ChartQueryResult {
  query: string
  queryParams?: Record<string, unknown>
  optional?: boolean
  tableCheck?: string | string[]
}

export interface MultiChartQueryResult {
  queries: Array<{ key: string; query: string; optional?: boolean }>
}

export type ChartQueryBuilder = (
  params: ChartQueryParams
) => ChartQueryResult | MultiChartQueryResult

// Re-export helper functions from clickhouse-query
export { applyInterval, fillStep, nowOrToday } from '@/lib/clickhouse-query'
