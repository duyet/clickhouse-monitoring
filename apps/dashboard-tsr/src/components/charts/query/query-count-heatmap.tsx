import { ArrowUpRightIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import type { HeatmapCell } from './query-count-heatmap-time'

import {
  DAY_LABELS,
  deriveStats,
  findMostRecentSlot,
  formatChDateTime,
  formatDisplayDate,
  getIntensityClass,
  HOUR_LABELS,
  INTENSITY_TIERS,
  isCurrentSlotIn,
  TIER_THRESHOLDS,
} from './query-count-heatmap-time'
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
  const slotDate = findMostRecentSlot(timezone, dayOfWeek, hour, windowHours)

  const href = (() => {
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
  })()

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
            to={href}
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
      <div className="flex flex-col gap-3 p-1">
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
