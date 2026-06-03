/**
 * Chart query registry for dashboard-tsr.
 *
 * Ported from apps/dashboard/lib/api/chart-registry.ts. A chart is a builder
 * function `(params) => ChartQueryResult` registered under a name. The
 * dashboard composes ~14 domain chart modules into one map; here the map
 * starts EMPTY (chart fan-out is later) and exposes `registerChartQuery` so
 * ported modules can self-register, plus the same get/has/list surface the
 * route handler uses.
 *
 * Chart-data types are defined locally (the dashboard re-exports them from
 * its `@/types/chart-data`, which is not ported). They mirror that shape so
 * ported chart builders need no edits.
 */

import type { VersionedSql } from '@chm/sql-builder'
import type { ClickHouseInterval } from './query-executor'

/** Cache policy → Cache-Control TTL bucket (handler maps to headers). */
export type CachePolicy = 'realtime' | 'standard' | 'historical'

/** A single chart row — permissive, like the dashboard's ChartDataPoint. */
export interface ChartDataPoint {
  [key: string]: unknown
}

/** Time-series row with a required `event_time`. */
export interface TimeSeriesPoint extends ChartDataPoint {
  event_time: string
}

/** Params passed to a chart builder. */
export interface ChartQueryParams {
  interval?: ClickHouseInterval
  lastHours?: number
  params?: Record<string, unknown>
  /** IANA timezone for the ClickHouse session. */
  timezone?: string
}

/** Single-query chart result. */
export interface ChartQueryResult<_T extends ChartDataPoint = ChartDataPoint> {
  /** SQL (string) — required; the executor runs this. */
  query: string
  /** Optional version-aware SQL; takes precedence over `query` when present. */
  sql?: VersionedSql[]
  queryParams?: Record<string, unknown>
  optional?: boolean
  tableCheck?: string | string[]
  cachePolicy?: CachePolicy
}

/** Multi-query chart result (executed in parallel, keyed). */
export interface MultiChartQueryResult {
  queries: Array<{ key: string; query: string; optional?: boolean }>
  cachePolicy?: CachePolicy
}

/** A chart builder maps params to a (multi-)query result. */
export type ChartQueryBuilder<T extends ChartDataPoint = ChartDataPoint> = (
  params: ChartQueryParams
) => ChartQueryResult<T> | MultiChartQueryResult

/**
 * Lazy registry map. Empty in the foundation; populated by ported chart
 * modules via `registerChartQuery` (or a bulk `registerChartQueries`).
 */
const chartRegistry = new Map<string, ChartQueryBuilder<ChartDataPoint>>()

/** Register one chart builder. Last write wins (overwrite warns in dev). */
export function registerChartQuery(
  name: string,
  builder: ChartQueryBuilder<ChartDataPoint>
): void {
  chartRegistry.set(name, builder)
}

/** Register a map of chart builders (spread a ported domain module). */
export function registerChartQueries(
  builders: Record<string, ChartQueryBuilder<ChartDataPoint>>
): void {
  for (const [name, builder] of Object.entries(builders)) {
    chartRegistry.set(name, builder)
  }
}

/** Build a chart query by name. Returns null if unknown. */
export function getChartQuery(
  chartName: string,
  params: ChartQueryParams = {}
): ChartQueryResult | MultiChartQueryResult | null {
  const builder = chartRegistry.get(chartName)
  if (!builder) return null
  return builder(params)
}

/** All registered chart names. */
export function getAvailableCharts(): string[] {
  return Array.from(chartRegistry.keys())
}

/** Does a chart exist? */
export function hasChart(chartName: string): boolean {
  return chartRegistry.has(chartName)
}
