'use client'

import { ArrowUpRightIcon } from 'lucide-react'

import Link from 'next/link'
import { useMemo } from 'react'
import { createCustomChart } from '@/components/charts/factory'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatCompactNumber } from '@/lib/format-readable'
import { useUserSettings } from '@/lib/hooks/use-user-settings'
import { cn } from '@/lib/utils'

interface HeatmapCell {
  day_of_week: number
  hour_of_day: number
  query_count: number
  readable_count: string
}

// toDayOfWeek in ClickHouse: 1=Monday, 7=Sunday
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, '0')
)

const INTENSITY_TIERS = [
  'bg-muted/60',
  'bg-chart-2/15',
  'bg-chart-2/25',
  'bg-chart-2/40',
  'bg-chart-2/55',
  'bg-chart-2/70',
  'bg-chart-2/85',
  'bg-chart-2',
] as const
const TIER_THRESHOLDS = [0, 0.01, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9]

function getIntensityClass(value: number, max: number): string {
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

function isCurrentSlotIn(
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
function findMostRecentSlot(
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
function formatChDateTime(d: Date): string {
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
function formatDisplayDate(d: Date): string {
  return `${WEEKDAY_NAMES_SHORT[d.getDay()]}, ${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getDate()}`
}

interface DerivedStats {
  total: number
  peak: HeatmapCell | null
  quietest: HeatmapCell | null
  avg: number
  activeHours: number
  dayTotals: number[] // index 0..6 → Mon..Sun
  maxDayTotal: number
}

function deriveStats(data: HeatmapCell[]): DerivedStats {
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

interface KpiCardProps {
  label: string
  value: string
  sublabel?: string
  hint?: string
  accent?: 'default' | 'peak' | 'quiet'
}

function KpiCard({
  label,
  value,
  sublabel,
  hint,
  accent = 'default',
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-0.5 rounded-md border border-border/60 bg-card/40 px-3 py-2',
        'transition-colors hover:bg-card/70'
      )}
    >
      <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span
          className={cn(
            'truncate text-base font-semibold tabular-nums leading-tight',
            accent === 'peak' && 'text-chart-2',
            accent === 'quiet' && 'text-muted-foreground'
          )}
        >
          {value}
        </span>
        {sublabel ? (
          <span className="text-muted-foreground/80 truncate text-[11px] tabular-nums">
            {sublabel}
          </span>
        ) : null}
      </div>
      {hint ? (
        <span className="text-muted-foreground truncate text-[10px] tabular-nums">
          {hint}
        </span>
      ) : null}
    </div>
  )
}

interface CellLinkProps {
  hostId: number
  timezone: string
  dayOfWeek: number
  hour: number
  windowHours: number
  count: number
  readable: string
  maxCount: number
  rank: number | null
  totalCells: number
  isCurrent: boolean
}

function HeatmapCellLink({
  hostId,
  timezone,
  dayOfWeek,
  hour,
  windowHours,
  count,
  readable,
  maxCount,
  rank,
  totalCells,
  isCurrent,
}: CellLinkProps) {
  const slotDate = useMemo(
    () => findMostRecentSlot(timezone, dayOfWeek, hour, windowHours),
    [timezone, dayOfWeek, hour, windowHours]
  )

  const href = useMemo(() => {
    if (!slotDate) return null
    // BETWEEN is inclusive on both ends in ClickHouse — use 59:59 so the
    // exact next-hour boundary belongs to the next hour's drilldown.
    const end = new Date(slotDate)
    end.setHours(end.getHours() + 1)
    end.setSeconds(end.getSeconds() - 1)
    const params = new URLSearchParams()
    params.set('host', String(hostId))
    params.set(
      'event_time',
      `between:${formatChDateTime(slotDate)},${formatChDateTime(end)}`
    )
    return `/history-queries?${params.toString()}`
  }, [slotDate, hostId])

  const dayLabel = DAY_LABELS[dayOfWeek - 1]
  const hourLabel = String(hour).padStart(2, '0')
  const pctOfPeak = maxCount > 0 ? Math.round((count * 100) / maxCount) : 0
  const intensity = getIntensityClass(count, maxCount)

  const triggerClass = cn(
    'group/cell relative block min-w-0 flex-1 cursor-pointer rounded-[3px]',
    'transition-all duration-150',
    'hover:scale-110 hover:z-10',
    'hover:ring-2 hover:ring-foreground/30',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:z-10',
    intensity,
    isCurrent &&
      'ring-2 ring-foreground/50 ring-offset-1 ring-offset-background'
  )

  const inner = (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Link
            href={href}
            className={triggerClass}
            aria-label={`${readable} queries on ${dayLabel} ${hourLabel}:00`}
          />
        ) : (
          <div
            role="img"
            aria-label={`${readable} queries on ${dayLabel} ${hourLabel}:00`}
            className={cn(triggerClass, 'cursor-default')}
          />
        )}
      </TooltipTrigger>
      <TooltipContent side="top" className="min-w-[200px] p-0">
        <div className="flex flex-col gap-2 px-3 py-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold tabular-nums">
              {readable}
            </span>
            <span className="text-muted-foreground text-[10px] tabular-nums">
              {pctOfPeak}% of peak
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[11px]">
              {slotDate ? formatDisplayDate(slotDate) : dayLabel}
              {' · '}
              <span className="tabular-nums">
                {hourLabel}:00–{hourLabel}:59
              </span>
            </span>
            {rank !== null && totalCells > 0 ? (
              <span className="text-muted-foreground text-[10px] tabular-nums">
                Rank #{rank} of {totalCells} hours
              </span>
            ) : null}
          </div>
          {href ? (
            <div className="border-border/60 flex items-center gap-1 border-t pt-1.5 text-[10px] text-chart-2">
              <span>View queries from this hour</span>
              <ArrowUpRightIcon className="size-3" />
            </div>
          ) : null}
        </div>
      </TooltipContent>
    </Tooltip>
  )

  return inner
}

function HeatmapBody({
  data,
  hostId,
  lastHours,
}: {
  data: HeatmapCell[]
  hostId: number
  lastHours: number | undefined
}) {
  const { settings } = useUserSettings()
  const timezone =
    settings.timezone ||
    Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone ||
    'UTC'
  // Drilldown window: bounded by the chart's data window so the resolved
  // slot is guaranteed to live inside what the user can see.
  const windowHours = Math.max(1, Math.round(lastHours ?? 24 * 7))

  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
        No query data available
      </div>
    )
  }

  // Build lookup: [day][hour] -> cell
  const grid: Record<number, Record<number, HeatmapCell>> = {}
  let maxCount = 0
  for (const cell of data) {
    if (!grid[cell.day_of_week]) grid[cell.day_of_week] = {}
    grid[cell.day_of_week][cell.hour_of_day] = cell
    if (cell.query_count > maxCount) maxCount = cell.query_count
  }

  const stats = deriveStats(data)
  // Dense rank: ties share the same rank, next distinct count gets the
  // sequential rank (1,2,2,3 rather than 1,2,2,4).
  const sortedByCount = [...data].sort((a, b) => b.query_count - a.query_count)
  const rankByKey = new Map<string, number>()
  let denseRank = 0
  let lastCount = Number.POSITIVE_INFINITY
  for (const cell of sortedByCount) {
    if (cell.query_count <= 0) continue
    if (cell.query_count !== lastCount) {
      denseRank += 1
      lastCount = cell.query_count
    }
    rankByKey.set(`${cell.day_of_week}-${cell.hour_of_day}`, denseRank)
  }
  const totalActiveCells = sortedByCount.filter((c) => c.query_count > 0).length

  const peakValue = stats.peak ? stats.peak.readable_count : '—'
  const peakSlot = stats.peak
    ? `${DAY_LABELS[stats.peak.day_of_week - 1]} ${String(stats.peak.hour_of_day).padStart(2, '0')}:00`
    : undefined
  const quietestValue = stats.quietest ? stats.quietest.readable_count : '—'
  const quietestSlot = stats.quietest
    ? `${DAY_LABELS[stats.quietest.day_of_week - 1]} ${String(stats.quietest.hour_of_day).padStart(2, '0')}:00`
    : undefined

  // Bucket boundaries for the legend (rounded). Skip numeric labels when
  // there is no traffic — all buckets would collapse to "≥ 0".
  const hasTraffic = maxCount > 0
  const legendBuckets = TIER_THRESHOLDS.slice(1).map((t) =>
    formatCompactNumber(Math.round(t * maxCount))
  )

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col gap-3 px-1 py-1">
        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <KpiCard
            label="Total queries"
            value={formatCompactNumber(stats.total)}
            hint={`${stats.activeHours}/${windowHours} active hours`}
          />
          <KpiCard
            label="Peak hour"
            value={peakValue}
            sublabel={peakSlot}
            accent="peak"
            hint={
              stats.peak && hasTraffic
                ? `${Math.round(((stats.peak.query_count - stats.avg) * 100) / Math.max(stats.avg, 1))}% above avg`
                : undefined
            }
          />
          <KpiCard
            label="Quietest hour"
            value={quietestValue}
            sublabel={quietestSlot}
            accent="quiet"
            hint={stats.quietest ? 'lowest non-zero' : undefined}
          />
          <KpiCard
            label="Avg / active hour"
            value={formatCompactNumber(Math.round(stats.avg))}
            hint={`across ${stats.activeHours} hours`}
          />
        </div>

        {/* Heatmap grid + day-total bars */}
        <div className="flex flex-col gap-1.5">
          {/* Hour labels row — left gutter (40px) and right gutter (56px) match
              the day-label column and the day-total mini-bar+number column. */}
          <div className="flex items-end gap-[3px] pl-10 pr-14">
            {HOUR_LABELS.map((label, hour) => (
              <div
                key={hour}
                className="text-muted-foreground min-w-0 flex-1 text-center text-[10px] leading-none tabular-nums"
              >
                {hour % 3 === 0 ? label : ''}
              </div>
            ))}
          </div>

          {/* Grid rows: one per day, with right-margin day total. Fixed row
              height (h-5) keeps the card from squeezing rows behind the
              footer when its container is short. */}
          <div className="flex flex-col gap-[3px]">
            {DAY_LABELS.map((dayLabel, i) => {
              const dayOfWeek = i + 1 // 1=Mon .. 7=Sun
              const isWeekend = dayOfWeek >= 6
              const dayTotal = stats.dayTotals[i]
              const dayPct =
                stats.maxDayTotal > 0 ? (dayTotal * 100) / stats.maxDayTotal : 0
              return (
                <div
                  key={dayOfWeek}
                  className="flex h-5 items-stretch gap-[3px]"
                >
                  <div
                    className={cn(
                      'flex w-10 flex-shrink-0 items-center justify-end pr-1.5 text-[11px] font-medium',
                      isWeekend
                        ? 'text-muted-foreground/60'
                        : 'text-muted-foreground'
                    )}
                  >
                    {dayLabel}
                  </div>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const cell = grid[dayOfWeek]?.[hour]
                    const count = cell?.query_count ?? 0
                    const readable = cell?.readable_count ?? '0'
                    const isCurrent = isCurrentSlotIn(timezone, dayOfWeek, hour)
                    const rank = rankByKey.get(`${dayOfWeek}-${hour}`) ?? null

                    return (
                      <HeatmapCellLink
                        key={hour}
                        hostId={hostId}
                        timezone={timezone}
                        dayOfWeek={dayOfWeek}
                        hour={hour}
                        windowHours={windowHours}
                        count={count}
                        readable={readable}
                        maxCount={maxCount}
                        rank={rank}
                        totalCells={totalActiveCells}
                        isCurrent={isCurrent}
                      />
                    )
                  })}
                  {/* Day-total mini bar + numeric tag. Reserved column width
                      (w-14) matches the hour-row right gutter. */}
                  <div
                    className="ml-1 flex w-14 flex-shrink-0 items-center gap-1.5"
                    title={`${dayLabel}: ${formatCompactNumber(dayTotal)} queries`}
                  >
                    <div className="bg-muted/40 relative h-1.5 flex-1 overflow-hidden rounded-full">
                      <div
                        className="bg-chart-2/70 absolute inset-y-0 left-0 rounded-full transition-all"
                        style={{ width: `${dayPct}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        'min-w-[1.75rem] text-right text-[10px] tabular-nums leading-none',
                        isWeekend
                          ? 'text-muted-foreground/60'
                          : 'text-muted-foreground'
                      )}
                    >
                      {hasTraffic ? formatCompactNumber(dayTotal) : ''}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer: legend + helper text */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <p className="text-muted-foreground text-[10px]">
            Click any cell to view its queries
          </p>
          <div className="flex items-center gap-2">
            {hasTraffic ? (
              <span className="text-muted-foreground text-[10px]">0</span>
            ) : null}
            <div className="flex items-center gap-[2px]">
              {INTENSITY_TIERS.map((cls, idx) => (
                <div
                  key={cls}
                  className={cn(
                    'h-[10px] w-[10px] flex-shrink-0 rounded-[2px]',
                    cls
                  )}
                  title={
                    !hasTraffic
                      ? 'No traffic'
                      : idx === 0
                        ? '0 queries'
                        : `≥ ${legendBuckets[idx - 1]} queries`
                  }
                />
              ))}
            </div>
            {hasTraffic ? (
              <span className="text-muted-foreground text-[10px] tabular-nums">
                {formatCompactNumber(maxCount)}
              </span>
            ) : (
              <span className="text-muted-foreground text-[10px]">
                no traffic
              </span>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export const ChartQueryCountHeatmap = createCustomChart({
  chartName: 'query-count-heatmap',
  defaultTitle: 'Query Activity Heatmap',
  defaultLastHours: 24 * 7,
  dataTestId: 'query-count-heatmap-chart',
  contentClassName: 'overflow-x-auto',
  render: (dataArray, _sql, hostId, lastHours) => (
    <HeatmapBody
      data={dataArray as HeatmapCell[]}
      hostId={hostId}
      lastHours={lastHours}
    />
  ),
})

export default ChartQueryCountHeatmap
