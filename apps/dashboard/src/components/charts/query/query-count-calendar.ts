/**
 * Pure helpers for the GitHub-style query-activity contribution calendar.
 *
 * The backing query (`query-count-heatmap`) returns one row per calendar day:
 * `{ date: 'YYYY-MM-DD', query_count, readable_count }`. These helpers bucket
 * those rows into week columns (Sunday-first, matching GitHub) and derive the
 * summary stats shown in the KPI strip. All logic here is timezone-naive on
 * purpose: it operates on the date *strings* ClickHouse returns and on a local
 * "today" anchor, so it stays deterministic and unit-testable.
 */

/** One row of the per-day query-count payload. */
export interface DayCell {
  date: string // 'YYYY-MM-DD'
  query_count: number
  readable_count: string
}

/**
 * Intensity tiers, low → high. Tier 0 is the empty/no-activity cell. Kept in
 * sync with TIER_THRESHOLDS (one threshold per tier). Uses `--chart-2` so the
 * calendar matches the rest of the query charts' accent.
 */
export const INTENSITY_TIERS = [
  'bg-muted/50',
  'bg-chart-2/20',
  'bg-chart-2/35',
  'bg-chart-2/50',
  'bg-chart-2/70',
  'bg-chart-2',
] as const

// Ratio (value / max) at or above which a cell takes the matching tier.
export const TIER_THRESHOLDS = [0, 0.01, 0.25, 0.5, 0.75] as const

/** Map an absolute count to a Tailwind background class for its intensity. */
export function getIntensityClass(value: number, max: number): string {
  if (max <= 0 || value <= 0) return INTENSITY_TIERS[0]
  const ratio = value / max
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (ratio >= TIER_THRESHOLDS[i]) return INTENSITY_TIERS[i + 1]
  }
  return INTENSITY_TIERS[0]
}

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

const WEEKDAY_NAMES_SHORT = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const

/** Day labels for the left gutter (Sunday-first, GitHub convention). */
export const CALENDAR_DAY_LABELS = WEEKDAY_NAMES_SHORT

/** Format a Date as a local `YYYY-MM-DD` string (no UTC shift). */
export function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Human-readable label for a day's tooltip, e.g. "Mon, Jun 17 2026". */
export function formatCalendarDate(d: Date): string {
  return `${WEEKDAY_NAMES_SHORT[d.getDay()]}, ${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`
}

/** A single day cell once placed in the calendar grid. */
export interface CalendarDay {
  iso: string
  date: Date
  count: number
  readable: string
}

/** A week column: 7 slots indexed by day-of-week (0 = Sunday). `null` marks a
 *  slot outside the rendered range (e.g. future days in the final column). */
export type CalendarWeek = (CalendarDay | null)[]

export interface CalendarModel {
  /** Week columns, oldest → newest (left → right). */
  weeks: CalendarWeek[]
  /** Month label per week column, or `null` when the month is unchanged. */
  monthLabels: (string | null)[]
  max: number
  total: number
  activeDays: number
  totalDays: number
  avgActive: number
  peak: CalendarDay | null
}

/**
 * Bucket per-day counts into Sunday-first week columns spanning the `weeksBack`
 * weeks ending at `today`. The first column is snapped back to a Sunday so each
 * column is a clean week; future slots in the last column are left `null`.
 */
export function buildCalendarModel(
  cells: DayCell[],
  today: Date,
  weeksBack = 53
): CalendarModel {
  const counts = new Map<string, DayCell>()
  for (const c of cells) counts.set(c.date, c)

  // Anchor at midnight-ish (noon avoids DST edge cases when stepping days).
  const end = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12
  )
  const start = new Date(end)
  start.setDate(start.getDate() - (weeksBack * 7 - 1))
  // Snap to the Sunday on/before the start so columns are whole weeks.
  start.setDate(start.getDate() - start.getDay())

  const weeks: CalendarWeek[] = []
  const monthLabels: (string | null)[] = []
  let max = 0
  let total = 0
  let activeDays = 0
  let totalDays = 0
  let peak: CalendarDay | null = null
  let prevMonth = -1

  const cursor = new Date(start)
  while (cursor <= end) {
    const week: CalendarWeek = new Array(7).fill(null)
    let label: string | null = null

    for (let dow = 0; dow < 7; dow++) {
      // Future days (beyond today) stay null so the trailing column matches
      // GitHub: the current week is partially filled.
      if (cursor > end) {
        cursor.setDate(cursor.getDate() + 1)
        continue
      }

      const iso = isoDate(cursor)
      const rec = counts.get(iso)
      const count = rec?.query_count ?? 0
      const day: CalendarDay = {
        iso,
        date: new Date(cursor),
        count,
        readable: rec?.readable_count ?? '0',
      }
      week[dow] = day

      totalDays += 1
      total += count
      if (count > 0) activeDays += 1
      if (count > max) max = count
      if (!peak || count > peak.count) peak = day

      // Label the column at the first day that opens a new month.
      const month = cursor.getMonth()
      if (label === null && month !== prevMonth) {
        label = MONTH_NAMES_SHORT[month]
        prevMonth = month
      }

      cursor.setDate(cursor.getDate() + 1)
    }

    weeks.push(week)
    monthLabels.push(label)
  }

  return {
    weeks,
    monthLabels,
    max,
    total,
    activeDays,
    totalDays,
    avgActive: activeDays > 0 ? total / activeDays : 0,
    peak,
  }
}
