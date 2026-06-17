import type { DayCell } from './query-count-calendar'

import {
  buildCalendarModel,
  formatCalendarDate,
  getIntensityClass,
  isoDate,
} from './query-count-calendar'
import { describe, expect, it } from 'bun:test'

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
    expect(getIntensityClass(50, 100)).toBe('bg-chart-2/70')
    // ratio 0.25 → threshold 0.25 (index 2) → tier index 3
    expect(getIntensityClass(25, 100)).toBe('bg-chart-2/50')
  })

  it('maps a tiny non-zero ratio to the first active tier, never the empty tier', () => {
    // ratio 0.001 ≥ first active threshold 0.01? No → but > 0, so tier 1.
    expect(getIntensityClass(1, 1000)).toBe('bg-chart-2/20')
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

describe('buildCalendarModel', () => {
  // Anchor "today" to a fixed Wednesday so the grid shape is deterministic.
  const today = new Date(2026, 5, 17) // Wed Jun 17 2026

  it('lays out whole Sunday-first weeks and ends on today', () => {
    const model = buildCalendarModel([], today, 4)
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
    const model = buildCalendarModel([], today, 4)
    const lastWeek = model.weeks.at(-1)
    // today is Wednesday (dow 3) → Thu/Fri/Sat slots are future → null.
    expect(lastWeek?.[4]).toBeNull()
    expect(lastWeek?.[5]).toBeNull()
    expect(lastWeek?.[6]).toBeNull()
    // Wednesday (today) is present.
    expect(lastWeek?.[3]?.iso).toBe('2026-06-17')
  })

  it('joins counts onto the matching day and aggregates stats', () => {
    const cells: DayCell[] = [
      { date: '2026-06-15', query_count: 100, readable_count: '100' },
      { date: '2026-06-16', query_count: 40, readable_count: '40' },
      { date: '2026-06-17', query_count: 0, readable_count: '0' },
    ]
    const model = buildCalendarModel(cells, today, 4)
    expect(model.total).toBe(140)
    expect(model.max).toBe(100)
    expect(model.activeDays).toBe(2) // zero-count day is not "active"
    expect(model.peak?.iso).toBe('2026-06-15')
    expect(model.avgActive).toBe(70) // 140 / 2 active days
  })

  it('labels each column where a new month begins, once per month', () => {
    // 12 weeks back from mid-June spans Apr→Jun.
    const model = buildCalendarModel([], today, 12)
    const labels = model.monthLabels.filter(Boolean)
    // Months are non-repeating and in calendar order.
    expect(new Set(labels).size).toBe(labels.length)
    expect(labels).toContain('Jun')
  })
})
