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

/** ClickHouse toDayOfWeek convention (1=Mon..7=Sun) from a JS Date. */
function jsDateToChDay(d: Date): number {
  const js = d.getDay()
  return js === 0 ? 7 : js
}

function isCurrentSlot(dayOfWeek: number, hour: number): boolean {
  const now = new Date()
  return jsDateToChDay(now) === dayOfWeek && now.getHours() === hour
}

/**
 * Find the most-recent absolute Date matching (chDay, hour) within the last
 * `windowHours` hours from now. Returns null when the slot has not occurred
 * within the window.
 */
function findMostRecentSlot(
  chDay: number,
  hour: number,
  windowHours: number
): Date | null {
  const now = new Date()
  const probe = new Date(now)
  probe.setMinutes(0, 0, 0)
  // Walk back hour-by-hour until we match. Capped at windowHours iterations.
  for (let i = 0; i <= windowHours; i++) {
    if (jsDateToChDay(probe) === chDay && probe.getHours() === hour) {
      return probe
    }
    probe.setHours(probe.getHours() - 1)
  }
  return null
}

/** Format a Date into ClickHouse-friendly `YYYY-MM-DD HH:mm:ss` (local time). */
function formatChDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

interface DerivedStats {
  total: number
  peak: HeatmapCell | null
  quietest: HeatmapCell | null
  avg: number
  activeHours: number
  dayTotals: number[] // index 0..6 → Mon..Sun
  hourTotals: number[] // index 0..23
  maxDayTotal: number
  maxHourTotal: number
}

function deriveStats(data: HeatmapCell[]): DerivedStats {
  const dayTotals = new Array(7).fill(0)
  const hourTotals = new Array(24).fill(0)
  let total = 0
  let peak: HeatmapCell | null = null
  let quietest: HeatmapCell | null = null
  let activeHours = 0

  for (const cell of data) {
    total += cell.query_count
    if (cell.day_of_week >= 1 && cell.day_of_week <= 7) {
      dayTotals[cell.day_of_week - 1] += cell.query_count
    }
    if (cell.hour_of_day >= 0 && cell.hour_of_day <= 23) {
      hourTotals[cell.hour_of_day] += cell.query_count
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
    hourTotals,
    maxDayTotal: Math.max(...dayTotals, 0),
    maxHourTotal: Math.max(...hourTotals, 0),
  }
}

interface KpiCardProps {
  label: string
  value: string
  hint?: string
  accent?: 'default' | 'peak' | 'quiet'
}

function KpiCard({ label, value, hint, accent = 'default' }: KpiCardProps) {
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
      <span
        className={cn(
          'truncate text-base font-semibold tabular-nums leading-tight',
          accent === 'peak' && 'text-chart-2',
          accent === 'quiet' && 'text-muted-foreground'
        )}
      >
        {value}
      </span>
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
    () => findMostRecentSlot(dayOfWeek, hour, windowHours),
    [dayOfWeek, hour, windowHours]
  )

  const href = useMemo(() => {
    if (!slotDate) return null
    const end = new Date(slotDate)
    end.setHours(end.getHours() + 1)
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
    'hover:ring-2 hover:ring-foreground/30 hover:shadow-sm',
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
              {slotDate ? DATE_FORMAT.format(slotDate) : dayLabel}
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

export const ChartQueryCountHeatmap = createCustomChart({
  chartName: 'query-count-heatmap',
  defaultTitle: 'Query Activity Heatmap',
  defaultLastHours: 24 * 7,
  dataTestId: 'query-count-heatmap-chart',
  contentClassName: 'overflow-x-auto',
  render: (dataArray, _sql, hostId) => {
    const data = dataArray as HeatmapCell[]

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
    // Pre-compute rank per cell (descending by count, ties share a slot).
    const sortedByCount = [...data].sort(
      (a, b) => b.query_count - a.query_count
    )
    const rankByKey = new Map<string, number>()
    sortedByCount.forEach((cell, idx) => {
      if (cell.query_count > 0) {
        rankByKey.set(`${cell.day_of_week}-${cell.hour_of_day}`, idx + 1)
      }
    })
    const totalActiveCells = sortedByCount.filter(
      (c) => c.query_count > 0
    ).length

    const peakLabel = stats.peak
      ? `${DAY_LABELS[stats.peak.day_of_week - 1]} ${String(stats.peak.hour_of_day).padStart(2, '0')}:00 · ${stats.peak.readable_count}`
      : '—'
    const quietestLabel = stats.quietest
      ? `${DAY_LABELS[stats.quietest.day_of_week - 1]} ${String(stats.quietest.hour_of_day).padStart(2, '0')}:00 · ${stats.quietest.readable_count}`
      : '—'

    // Bucket boundaries for the legend (rounded to nice numbers).
    const legendBuckets = TIER_THRESHOLDS.slice(1).map((t) =>
      formatCompactNumber(Math.round(t * maxCount))
    )

    // windowHours: best-effort from data — fall back to 168.
    const windowHours = 24 * 7

    return (
      <TooltipProvider delayDuration={0}>
        <div className="flex h-full flex-col gap-3 px-1 py-1">
          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <KpiCard
              label="Total queries"
              value={formatCompactNumber(stats.total)}
              hint={`${stats.activeHours}/168 active hours`}
            />
            <KpiCard
              label="Peak hour"
              value={peakLabel}
              accent="peak"
              hint={
                stats.peak && maxCount > 0
                  ? `${Math.round(((stats.peak.query_count - stats.avg) * 100) / Math.max(stats.avg, 1))}% above avg`
                  : undefined
              }
            />
            <KpiCard
              label="Quietest hour"
              value={quietestLabel}
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
          <div className="flex min-h-0 flex-1 flex-col gap-1">
            {/* Hour labels row */}
            <div className="flex items-end gap-[3px] pl-10 pr-12">
              {HOUR_LABELS.map((label, hour) => (
                <div
                  key={hour}
                  className="text-muted-foreground min-w-0 flex-1 text-center text-[10px] leading-none tabular-nums"
                >
                  {hour % 3 === 0 ? label : ''}
                </div>
              ))}
            </div>

            {/* Grid rows: one per day, with right-margin day total */}
            <div className="flex flex-1 flex-col gap-[3px]">
              {DAY_LABELS.map((dayLabel, i) => {
                const dayOfWeek = i + 1 // 1=Mon .. 7=Sun
                const isWeekend = dayOfWeek >= 6
                const dayTotal = stats.dayTotals[i]
                const dayPct =
                  stats.maxDayTotal > 0
                    ? (dayTotal * 100) / stats.maxDayTotal
                    : 0
                return (
                  <div
                    key={dayOfWeek}
                    className="flex min-h-0 flex-1 items-stretch gap-[3px]"
                  >
                    <div
                      className={cn(
                        'flex w-9 flex-shrink-0 items-center justify-end pr-1.5 text-[11px] font-medium',
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
                      const isCurrent = isCurrentSlot(dayOfWeek, hour)
                      const rank = rankByKey.get(`${dayOfWeek}-${hour}`) ?? null

                      return (
                        <HeatmapCellLink
                          key={hour}
                          hostId={hostId}
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
                    {/* Day-total mini bar */}
                    <div
                      className="ml-1 flex w-10 flex-shrink-0 items-center gap-1"
                      title={`${dayLabel}: ${formatCompactNumber(dayTotal)} queries`}
                    >
                      <div className="bg-muted/40 relative h-1.5 flex-1 overflow-hidden rounded-full">
                        <div
                          className="bg-chart-2/70 absolute inset-y-0 left-0 rounded-full transition-all"
                          style={{ width: `${dayPct}%` }}
                        />
                      </div>
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
              <span className="text-muted-foreground text-[10px]">0</span>
              <div className="flex items-center gap-[2px]">
                {INTENSITY_TIERS.map((cls, idx) => (
                  <div
                    key={cls}
                    className={cn(
                      'h-[10px] w-[10px] flex-shrink-0 rounded-[2px]',
                      cls
                    )}
                    title={
                      idx === 0
                        ? '0 queries'
                        : `≥ ${legendBuckets[idx - 1]} queries`
                    }
                  />
                ))}
              </div>
              <span className="text-muted-foreground text-[10px] tabular-nums">
                {formatCompactNumber(maxCount)}
              </span>
            </div>
          </div>
        </div>
      </TooltipProvider>
    )
  },
})

export default ChartQueryCountHeatmap
