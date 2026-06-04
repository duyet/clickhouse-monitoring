export interface HeatmapCell {
  day_of_week: number
  hour_of_day: number
  query_count: number
  readable_count: string
}

// toDayOfWeek in ClickHouse: 1=Monday, 7=Sunday
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const HOUR_LABELS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, '0')
)

export const INTENSITY_TIERS = [
  'bg-muted/60',
  'bg-chart-2/15',
  'bg-chart-2/25',
  'bg-chart-2/40',
  'bg-chart-2/55',
  'bg-chart-2/70',
  'bg-chart-2/85',
  'bg-chart-2',
] as const
export const TIER_THRESHOLDS = [0, 0.01, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9]

export function getIntensityClass(value: number, max: number): string {
  if (max === 0 || value === 0) return INTENSITY_TIERS[0]
  const ratio = value / max
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (ratio >= TIER_THRESHOLDS[i]) return INTENSITY_TIERS[i]
  }
  return INTENSITY_TIERS[0]
}

/** ClickHouse toDayOfWeek convention (1=Mon..7=Sun) from a JS day-of-week index. */
function jsDayToChDay(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay
}

/** A wall-clock instant (no timezone). Operations on this object use JS `Date`
 *  arithmetic, but the components reflect the user's selected timezone. */
interface WallClock {
  year: number
  month: number // 1..12
  day: number // 1..31
  hour: number // 0..23
  jsDayOfWeek: number // 0..6 (Sun=0)
  asDate: Date // local-time Date whose components match the wall clock
}

/** Read the current wall clock in the given IANA timezone. */
function nowInTimezone(timezone: string): WallClock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(new Date())

  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const year = Number(pick('year'))
  const month = Number(pick('month'))
  const day = Number(pick('day'))
  // Intl reports "24" instead of "00" in some runtimes; coerce.
  const hour = Number(pick('hour')) % 24
  const weekdayShort = pick('weekday') // e.g. 'Mon'
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  const jsDayOfWeek = weekdayMap[weekdayShort] ?? 0
  // Build a "fake-local" Date whose getFullYear/getMonth/... match the wall clock.
  // This lets us use Date arithmetic (setHours) without bringing the host
  // timezone into the math.
  const asDate = new Date(year, month - 1, day, hour, 0, 0)
  return { year, month, day, hour, jsDayOfWeek, asDate }
}

export function isCurrentSlotIn(
  timezone: string,
  dayOfWeek: number,
  hour: number
): boolean {
  const now = nowInTimezone(timezone)
  return jsDayToChDay(now.jsDayOfWeek) === dayOfWeek && now.hour === hour
}

/** Step a wall clock back by one hour using pure component arithmetic, so the
 *  walk follows the target timezone's calendar — not the browser's DST rules.
 *  Day rollover uses a Date at noon to dodge any DST jump zones. */
function stepBackOneHour(wc: WallClock): WallClock {
  if (wc.hour > 0) {
    const hour = wc.hour - 1
    return {
      year: wc.year,
      month: wc.month,
      day: wc.day,
      hour,
      jsDayOfWeek: wc.jsDayOfWeek,
      asDate: new Date(wc.year, wc.month - 1, wc.day, hour, 0, 0),
    }
  }
  // Roll over to the previous calendar day at hour 23.
  const prev = new Date(wc.year, wc.month - 1, wc.day - 1, 12)
  const year = prev.getFullYear()
  const month = prev.getMonth() + 1
  const day = prev.getDate()
  const jsDayOfWeek = prev.getDay()
  return {
    year,
    month,
    day,
    hour: 23,
    jsDayOfWeek,
    asDate: new Date(year, month - 1, day, 23, 0, 0),
  }
}

/**
 * Find the most-recent wall-clock instant matching (chDay, hour) within the
 * last `windowHours` hours from the current moment in `timezone`. Returns
 * null when the slot has not occurred within the window.
 */
export function findMostRecentSlot(
  timezone: string,
  chDay: number,
  hour: number,
  windowHours: number
): Date | null {
  let probe = nowInTimezone(timezone)
  for (let i = 0; i <= windowHours; i++) {
    if (jsDayToChDay(probe.jsDayOfWeek) === chDay && probe.hour === hour) {
      return probe.asDate
    }
    probe = stepBackOneHour(probe)
  }
  return null
}

/** Format a wall-clock Date as `YYYY-MM-DD HH:mm:ss`. */
export function formatChDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const WEEKDAY_NAMES_SHORT = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const
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

/**
 * Format a wall-clock Date for display, reading components directly so the
 * output reflects the user-tz components that were encoded into the Date —
 * not the browser's interpretation through `Intl`. Going through
 * `Intl.DateTimeFormat` here would either implicitly use the browser zone
 * (correct only by coincidence) or, with an explicit `timeZone`, would
 * double-shift the already-encoded wall clock.
 */
export function formatDisplayDate(d: Date): string {
  return `${WEEKDAY_NAMES_SHORT[d.getDay()]}, ${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getDate()}`
}

export interface DerivedStats {
  total: number
  peak: HeatmapCell | null
  quietest: HeatmapCell | null
  avg: number
  activeHours: number
  dayTotals: number[] // index 0..6 → Mon..Sun
  maxDayTotal: number
}

export function deriveStats(data: HeatmapCell[]): DerivedStats {
  const dayTotals = new Array(7).fill(0)
  let total = 0
  let peak: HeatmapCell | null = null
  let quietest: HeatmapCell | null = null
  let activeHours = 0

  for (const cell of data) {
    total += cell.query_count
    if (cell.day_of_week >= 1 && cell.day_of_week <= 7) {
      dayTotals[cell.day_of_week - 1] += cell.query_count
    }
    if (cell.query_count > 0) activeHours++
    if (!peak || cell.query_count > peak.query_count) peak = cell
    if (
      cell.query_count > 0 &&
      (!quietest || cell.query_count < quietest.query_count)
    ) {
      quietest = cell
    }
  }

  return {
    total,
    peak,
    quietest,
    avg: activeHours > 0 ? total / activeHours : 0,
    activeHours,
    dayTotals,
    maxDayTotal: Math.max(...dayTotals, 0),
  }
}
