/**
 * Shared chart utilities for data transformation and formatting
 */

/**
 * Raw row type for multi-metric time series data
 * Used for pivoting long-form data into wide-form for charting
 */
export type RawRow = {
  event_time: string
  metric: string
  avg_value?: number
  usage?: number
  [key: string]: unknown
}

/**
 * Pivot long-form (event_time, metric, value) rows into wide-form rows
 * suitable for AreaChart: { event_time, MetricA: n, MetricB: n, ... }
 *
 * @param rows - Array of long-form rows with event_time, metric, and value columns
 * @returns Object with pivoted wide-form data and sorted metric categories
 */
export function pivotRows(rows: RawRow[]): {
  pivoted: Record<string, string | number>[]
  categories: string[]
} {
  const metricSet = new Set<string>()
  const byTime = new Map<string, Record<string, string | number>>()

  for (const row of rows) {
    // Skip prototype-polluting keys
    if (
      row.metric === '__proto__' ||
      row.metric === 'constructor' ||
      row.metric === 'prototype'
    ) {
      continue
    }

    metricSet.add(row.metric)
    let entry = byTime.get(row.event_time)
    if (!entry) {
      entry = { event_time: row.event_time }
      byTime.set(row.event_time, entry)
    }
    // Support both avg_value and usage field names
    const value = row.avg_value !== undefined ? row.avg_value : row.usage
    if (value !== undefined) {
      entry[row.metric] = value
    }
  }

  const categories = Array.from(metricSet).sort()
  const pivoted = Array.from(byTime.values()).sort((a, b) =>
    String(a.event_time).localeCompare(String(b.event_time))
  )

  return { pivoted, categories }
}
