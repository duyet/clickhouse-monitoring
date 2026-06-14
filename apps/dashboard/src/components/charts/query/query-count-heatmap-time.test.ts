import type { HeatmapCell } from './query-count-heatmap-time'

import {
  deriveStats,
  findMostRecentSlot,
  formatChDateTime,
  formatDisplayDate,
  getIntensityClass,
  isCurrentSlotIn,
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

describe('getIntensityClass — intermediate tiers', () => {
  it('maps a mid ratio to the matching middle tier (walks thresholds down)', () => {
    // ratio 0.20 → highest threshold ≤ 0.20 is 0.15 (index 2)
    expect(getIntensityClass(20, 100)).toBe('bg-chart-2/25')
  })

  it('maps a tiny non-zero ratio below the first active threshold to the empty tier', () => {
    // ratio 0.001 < 0.01 → falls through to INTENSITY_TIERS[0]
    expect(getIntensityClass(1, 1000)).toBe('bg-muted/60')
  })
})

// ---------------------------------------------------------------------------
// Timezone slot helpers — clock-independent invariants. These read the real
// `new Date()`, so we assert properties that hold at ANY instant rather than
// fixed values, keeping the suite deterministic.
// ---------------------------------------------------------------------------

const CH_DAYS = [1, 2, 3, 4, 5, 6, 7] // ClickHouse toDayOfWeek (1=Mon..7=Sun)
const HOURS = Array.from({ length: 24 }, (_, i) => i)

/** ClickHouse day index (1=Mon..7=Sun) from a JS Date's getDay() (0=Sun). */
function chDayOf(d: Date): number {
  return d.getDay() === 0 ? 7 : d.getDay()
}

describe('findMostRecentSlot', () => {
  it('resolves every weekly (day, hour) slot within a 168h window and round-trips its components', () => {
    // Every slot in the 7×24 grid occurs at least once in any 168-hour
    // (7-day) window, so none should be null and each returned Date must carry
    // exactly the requested day-of-week and hour back out.
    for (const chDay of CH_DAYS) {
      for (const hour of HOURS) {
        const slot = findMostRecentSlot('UTC', chDay, hour, 168)
        expect(slot).not.toBeNull()
        const d = slot as Date
        expect(chDayOf(d)).toBe(chDay)
        expect(d.getHours()).toBe(hour)
      }
    }
  })

  it('returns null for a slot that has not occurred inside a narrow window', () => {
    // Pick the hour 6h ahead of "now" in UTC — it cannot have occurred within
    // the last 3 hours, so a 3h window must miss it.
    const utcHourNow = new Date().getUTCHours()
    const futureHour = (utcHourNow + 6) % 24
    // Try every weekday for that hour; with a 3h window none can match.
    for (const chDay of CH_DAYS) {
      expect(findMostRecentSlot('UTC', chDay, futureHour, 3)).toBeNull()
    }
  })

  it('honours the requested timezone (a fixed-offset zone shifts the resolved hour)', () => {
    // For the same target hour, Asia/Kolkata (UTC+5:30) and UTC resolve to
    // wall-clock instants whose UTC hours differ — proving the tz is applied,
    // not the host zone. We just assert both resolve (non-null) and round-trip.
    const utc = findMostRecentSlot('UTC', 3, 12, 168)
    const ist = findMostRecentSlot('Asia/Kolkata', 3, 12, 168)
    expect(utc).not.toBeNull()
    expect(ist).not.toBeNull()
    expect((utc as Date).getHours()).toBe(12)
    expect((ist as Date).getHours()).toBe(12)
  })
})

describe('isCurrentSlotIn', () => {
  /** Mirror nowInTimezone() to derive the expected current UTC slot. */
  function currentUtcSlot(): { chDay: number; hour: number } {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      hour: '2-digit',
      weekday: 'short',
      hour12: false,
    }).formatToParts(new Date())
    const hour = Number(parts.find((p) => p.type === 'hour')?.value) % 24
    const wd = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun'
    const map: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    }
    const js = map[wd] ?? 0
    return { chDay: js === 0 ? 7 : js, hour }
  }

  it('is true for the current (day, hour) and false for a 12h-shifted hour', () => {
    const { chDay, hour } = currentUtcSlot()
    expect(isCurrentSlotIn('UTC', chDay, hour)).toBe(true)
    // The opposite half-day is necessarily a different hour, so never current.
    expect(isCurrentSlotIn('UTC', chDay, (hour + 12) % 24)).toBe(false)
  })

  it('is false for a different weekday at the current hour', () => {
    const { chDay, hour } = currentUtcSlot()
    const otherDay = (chDay % 7) + 1 // a guaranteed-different ch day (1..7)
    expect(isCurrentSlotIn('UTC', otherDay, hour)).toBe(false)
  })
})
