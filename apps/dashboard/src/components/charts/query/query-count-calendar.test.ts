import type { HeatmapDayRow } from './query-count-calendar'

import {
  buildCalendarModel,
  buildStatCards,
  formatCalendarDate,
  formatDurationMs,
  getIntensityClass,
  isoDate,
  METRIC_CONFIGS,
} from './query-count-calendar'
import { describe, expect, it } from 'bun:test'

const QUERIES = METRIC_CONFIGS.queries

/** Build a full day row, overriding only the metrics a test cares about. */
function row(date: string, over: Partial<HeatmapDayRow> = {}): HeatmapDayRow {
  return {
    date,
    query_count: 0,
    failed_count: 0,
    memory_peak: 0,
    avg_duration_ms: 0,
    written_bytes: 0,
    ...over,
  }
}

describe('getIntensityClass', () => {
  it('returns the empty tier for zero value or zero max', () => {
    expect(getIntensityClass(0, 100)).toBe('bg-muted/50')
    expect(getIntensityClass(50, 0)).toBe('bg-muted/50')
  })

  it('maps the peak value to the densest tier', () => {
    expect(getIntensityClass(100, 100)).toBe('bg-chart-2')
  })

  it('maps a mid ratio to a middle tier (walks thresholds down)', () => {
    // ratio 0.5 → threshold 0.5 (index 3) → tier index 4
    expect(getIntensityClass(50, 100)).toBe('bg-chart-2/80')
    // ratio 0.25 → threshold 0.25 (index 2) → tier index 3
    expect(getIntensityClass(25, 100)).toBe('bg-chart-2/60')
  })

  it('maps a tiny non-zero ratio to the first active tier, never the empty tier', () => {
    // ratio 0.001 ≥ first active threshold 0.01? No → but > 0, so tier 1.
    expect(getIntensityClass(1, 1000)).toBe('bg-chart-2/20')
  })

  it('uses the per-metric ramp when one is supplied', () => {
    expect(getIntensityClass(100, 100, METRIC_CONFIGS.failed.tiers)).toBe(
      'bg-rose-500'
    )
    expect(getIntensityClass(1, 1000, METRIC_CONFIGS.written.tiers)).toBe(
      'bg-emerald-500/20'
    )
  })
})

describe('isoDate', () => {
  it('formats a local date as YYYY-MM-DD with zero padding', () => {
    expect(isoDate(new Date(2024, 0, 5, 13, 0, 0))).toBe('2024-01-05')
    expect(isoDate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('formatCalendarDate', () => {
  it('renders weekday, month, day, and year from local components', () => {
    // Fri Jan 5 2024
    expect(formatCalendarDate(new Date(2024, 0, 5))).toBe('Fri, Jan 5 2024')
  })
})

describe('formatDurationMs', () => {
  it('formats sub-second values as milliseconds', () => {
    expect(formatDurationMs(0)).toBe('0ms')
    expect(formatDurationMs(420)).toBe('420ms')
  })

  it('formats seconds with one decimal under 10s and whole seconds above', () => {
    expect(formatDurationMs(1800)).toBe('1.8s')
    expect(formatDurationMs(18400)).toBe('18s')
  })
})

describe('buildCalendarModel', () => {
  // Anchor "today" to a fixed Wednesday so the grid shape is deterministic.
  const today = new Date(2026, 5, 17) // Wed Jun 17 2026

  it('lays out whole Sunday-first weeks and ends on today', () => {
    const model = buildCalendarModel([], today, QUERIES, 4)
    // Every column has 7 slots.
    for (const week of model.weeks) {
      expect(week).toHaveLength(7)
    }
    // The first slot of the first column is a Sunday.
    const firstDay = model.weeks[0].find(Boolean)
    expect(firstDay?.date.getDay()).toBe(0)
    // The most recent non-null day is today.
    const lastNonNull = model.weeks
      .flat()
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .at(-1)
    expect(lastNonNull?.iso).toBe('2026-06-17')
  })

  it('leaves future slots in the trailing column as null', () => {
    const model = buildCalendarModel([], today, QUERIES, 4)
    const lastWeek = model.weeks.at(-1)
    // today is Wednesday (dow 3) → Thu/Fri/Sat slots are future → null.
    expect(lastWeek?.[4]).toBeNull()
    expect(lastWeek?.[5]).toBeNull()
    expect(lastWeek?.[6]).toBeNull()
    // Wednesday (today) is present.
    expect(lastWeek?.[3]?.iso).toBe('2026-06-17')
  })

  it('joins the selected metric onto the matching day and aggregates stats', () => {
    const rows: HeatmapDayRow[] = [
      row('2026-06-15', { query_count: 100 }),
      row('2026-06-16', { query_count: 40 }),
      row('2026-06-17', { query_count: 0 }),
    ]
    const model = buildCalendarModel(rows, today, QUERIES, 4)
    expect(model.total).toBe(140)
    expect(model.max).toBe(100)
    expect(model.activeDays).toBe(2) // zero-count day is not "active"
    expect(model.peak?.iso).toBe('2026-06-15')
    expect(model.avgActive).toBe(70) // 140 / 2 active days
  })

  it('reads a different metric when a different config is passed', () => {
    const rows: HeatmapDayRow[] = [
      row('2026-06-16', { query_count: 999, failed_count: 5 }),
      row('2026-06-17', { query_count: 999, failed_count: 2 }),
    ]
    const model = buildCalendarModel(rows, today, METRIC_CONFIGS.failed, 4)
    // Only failed_count contributes — query_count is ignored for this mode.
    expect(model.total).toBe(7)
    expect(model.max).toBe(5)
    expect(model.peak?.iso).toBe('2026-06-16')
  })

  it('labels each column where a new month begins, once per month', () => {
    // 12 weeks back from mid-June spans Apr→Jun.
    const model = buildCalendarModel([], today, QUERIES, 12)
    const labels = model.monthLabels.filter(Boolean)
    // Months are non-repeating and in calendar order.
    expect(new Set(labels).size).toBe(labels.length)
    expect(labels).toContain('Jun')
  })

  it('derives a month-year range caption from the rendered span', () => {
    const model = buildCalendarModel([], today, QUERIES, 53)
    expect(model.rangeLabel).toMatch(
      /^[A-Z][a-z]{2} \d{4} – [A-Z][a-z]{2} \d{4}$/
    )
    expect(model.rangeLabel.endsWith('Jun 2026')).toBe(true)
  })
})

describe('buildStatCards', () => {
  const today = new Date(2026, 5, 17)
  const rows: HeatmapDayRow[] = [
    row('2026-06-15', {
      query_count: 100,
      failed_count: 3,
      memory_peak: 600,
      avg_duration_ms: 1800,
      written_bytes: 1024,
    }),
    row('2026-06-16', {
      query_count: 40,
      failed_count: 1,
      memory_peak: 400,
      avg_duration_ms: 900,
      written_bytes: 512,
    }),
  ]

  it('leads a sum metric with a grand total and accented peak', () => {
    const model = buildCalendarModel(rows, today, QUERIES, 4)
    const cards = buildStatCards(QUERIES, model)
    expect(cards).toHaveLength(4)
    expect(cards[0].label).toBe('Total queries')
    expect(cards[0].value).toBe('140')
    expect(cards[1].label).toBe('Busiest day')
    expect(cards[1].accent).toBe(true)
  })

  it('leads a gauge metric with the peak reading, not a meaningless sum', () => {
    const memory = METRIC_CONFIGS.memory
    const model = buildCalendarModel(rows, today, memory, 4)
    const cards = buildStatCards(memory, model)
    expect(cards[0].label).toContain('Peak')
    expect(cards[0].accent).toBe(true)
    // Peak memory = max daily reading = 600 bytes, formatted as a size.
    expect(cards[0].value).toBe('600 Bytes')
    expect(cards[1].label).toBe('Average')
  })
})
