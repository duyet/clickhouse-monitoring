import type { HeatmapCell } from './query-count-heatmap-time'

import {
  deriveStats,
  formatChDateTime,
  formatDisplayDate,
  getIntensityClass,
} from './query-count-heatmap-time'
import { describe, expect, it } from 'bun:test'

describe('getIntensityClass', () => {
  it('returns the empty tier for zero value or zero max', () => {
    expect(getIntensityClass(0, 100)).toBe('bg-muted/60')
    expect(getIntensityClass(50, 0)).toBe('bg-muted/60')
  })

  it('maps the peak value to the densest tier', () => {
    expect(getIntensityClass(100, 100)).toBe('bg-chart-2')
  })

  it('scales intensity with the value/max ratio', () => {
    // ratio 0.5 → first threshold ≤ 0.5 walking down is 0.45 (index 4)
    expect(getIntensityClass(50, 100)).toBe('bg-chart-2/55')
  })
})

describe('deriveStats', () => {
  const cells: HeatmapCell[] = [
    { day_of_week: 1, hour_of_day: 9, query_count: 10, readable_count: '10' },
    { day_of_week: 1, hour_of_day: 10, query_count: 30, readable_count: '30' },
    { day_of_week: 2, hour_of_day: 9, query_count: 5, readable_count: '5' },
    { day_of_week: 2, hour_of_day: 10, query_count: 0, readable_count: '0' },
  ]

  it('sums totals and identifies peak / quietest active cells', () => {
    const stats = deriveStats(cells)
    expect(stats.total).toBe(45)
    expect(stats.peak?.query_count).toBe(30)
    // quietest ignores zero-count cells
    expect(stats.quietest?.query_count).toBe(5)
  })

  it('counts only active (non-zero) hours and averages over them', () => {
    const stats = deriveStats(cells)
    expect(stats.activeHours).toBe(3)
    expect(stats.avg).toBe(45 / 3)
  })

  it('accumulates day totals using the ClickHouse 1=Mon convention', () => {
    const stats = deriveStats(cells)
    expect(stats.dayTotals[0]).toBe(40) // Monday (day_of_week 1)
    expect(stats.dayTotals[1]).toBe(5) // Tuesday (day_of_week 2)
    expect(stats.maxDayTotal).toBe(40)
  })
})

describe('wall-clock formatting', () => {
  it('formats a Date as YYYY-MM-DD HH:mm:ss using local components', () => {
    const d = new Date(2024, 0, 5, 3, 7, 9) // Jan 5 2024, 03:07:09
    expect(formatChDateTime(d)).toBe('2024-01-05 03:07:09')
  })

  it('formats a display date from local weekday/month components', () => {
    const d = new Date(2024, 0, 5, 0, 0, 0) // Friday Jan 5 2024
    expect(formatDisplayDate(d)).toBe('Fri, Jan 5')
  })
})
