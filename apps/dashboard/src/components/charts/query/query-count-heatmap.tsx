import { ArrowUpRightIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import type { CalendarDay, DayCell } from './query-count-calendar'

import {
  buildCalendarModel,
  CALENDAR_DAY_LABELS,
  formatCalendarDate,
  getIntensityClass,
  INTENSITY_TIERS,
  isoDate,
} from './query-count-calendar'
import { useMemo, useState } from 'react'
import { createCustomChart } from '@/components/charts/factory'
import { formatCompactNumber } from '@/lib/format-readable'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  sublabel?: string
  hint?: string
  accent?: 'default' | 'peak'
}

function KpiCard({
  label,
  value,
  sublabel,
  hint,
  accent = 'default',
}: KpiCardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-md border border-border/60 bg-card/40 px-3 py-2 transition-colors hover:bg-card/70">
      <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
        {label}
      </span>
      <div className="flex min-w-0 items-baseline gap-1.5">
        <span
          className={cn(
            'truncate text-base font-semibold tabular-nums leading-tight',
            accent === 'peak' && 'text-chart-2'
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

// Day-of-week rows that get a left-gutter label (GitHub shows Mon/Wed/Fri).
const LABELLED_ROWS = new Set([1, 3, 5])

interface HoverState {
  day: CalendarDay
  x: number
  y: number
}

function buildDrilldownHref(hostId: number, day: CalendarDay): string {
  // Whole-day window. BETWEEN is inclusive on both ends in ClickHouse, so end
  // at 23:59:59 to keep the next day out of this cell's drilldown.
  const params = new URLSearchParams()
  params.set('host', String(hostId))
  params.set('event_time', `between:${day.iso} 00:00:00,${day.iso} 23:59:59`)
  return `/history-queries?${params.toString()}`
}

function CalendarBody({ data, hostId }: { data: DayCell[]; hostId: number }) {
  const [hover, setHover] = useState<HoverState | null>(null)

  // `today` is read once per render from the local clock; the model is cheap
  // but memoizing keeps the ~371-cell build off every hover re-render.
  const model = useMemo(() => buildCalendarModel(data, new Date()), [data])
  const todayIso = isoDate(new Date())

  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
        No query activity in the last year
      </div>
    )
  }

  const {
    weeks,
    monthLabels,
    max,
    total,
    activeDays,
    totalDays,
    avgActive,
    peak,
  } = model
  const hasTraffic = max > 0

  return (
    <div data-calendar-root className="relative flex flex-col gap-3 p-1">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KpiCard
          label="Total queries"
          value={formatCompactNumber(total)}
          hint={`over ${totalDays} days`}
        />
        <KpiCard
          label="Busiest day"
          value={peak && hasTraffic ? peak.readable : '—'}
          sublabel={
            peak && hasTraffic
              ? formatCalendarDate(peak.date).slice(5)
              : undefined
          }
          accent="peak"
          hint={peak && hasTraffic ? 'peak daily volume' : undefined}
        />
        <KpiCard
          label="Active days"
          value={formatCompactNumber(activeDays)}
          hint={`of ${totalDays} (${totalDays > 0 ? Math.round((activeDays * 100) / totalDays) : 0}%)`}
        />
        <KpiCard
          label="Avg / active day"
          value={formatCompactNumber(Math.round(avgActive))}
          hint="queries per active day"
        />
      </div>

      {/* Calendar: month labels + weekday gutter + week columns. min-w lets it
          stay legible on phones (horizontal scroll, like GitHub) while the fr
          columns make it fluid up to the card width on larger screens. */}
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          {/* Month labels, aligned to week columns (pl matches the gutter). */}
          <div className="flex gap-[3px] pb-1 pl-8">
            {monthLabels.map((label, i) => (
              <div
                key={weeks[i][0]?.iso ?? `col-${i}`}
                className="text-muted-foreground min-w-0 flex-1 text-[10px] leading-none"
              >
                {label ?? ''}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {/* Weekday gutter */}
            <div className="flex w-8 flex-shrink-0 flex-col gap-[3px]">
              {CALENDAR_DAY_LABELS.map((label, dow) => (
                <div
                  key={label}
                  className="text-muted-foreground flex aspect-square items-center justify-end pr-1 text-[9px] leading-none"
                >
                  {LABELLED_ROWS.has(dow) ? label : ''}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, i) => (
              <div
                key={week.find(Boolean)?.iso ?? `week-${i}`}
                className="flex min-w-0 flex-1 flex-col gap-[3px]"
              >
                {week.map((day, dow) => {
                  if (!day) {
                    return (
                      <div
                        key={dow}
                        className="aspect-square w-full"
                        aria-hidden
                      />
                    )
                  }
                  const intensity = getIntensityClass(day.count, max)
                  const isToday = day.iso === todayIso
                  const href = buildDrilldownHref(hostId, day)
                  const onEnter = (e: React.SyntheticEvent<HTMLElement>) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const host = e.currentTarget.closest(
                      '[data-calendar-root]'
                    ) as HTMLElement | null
                    const hostRect = host?.getBoundingClientRect()
                    setHover({
                      day,
                      x: rect.left + rect.width / 2 - (hostRect?.left ?? 0),
                      y: rect.top - (hostRect?.top ?? 0),
                    })
                  }
                  return (
                    <Link
                      key={day.iso}
                      to={href}
                      aria-label={`${day.readable} queries on ${formatCalendarDate(day.date)}`}
                      onMouseEnter={onEnter}
                      onFocus={onEnter}
                      onMouseLeave={() => setHover(null)}
                      onBlur={() => setHover(null)}
                      className={cn(
                        'aspect-square w-full rounded-[2px] transition-transform duration-100',
                        'hover:scale-125 hover:ring-1 hover:ring-foreground/40',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        intensity,
                        isToday && 'ring-1 ring-foreground/60'
                      )}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: helper text + Less→More legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <p className="text-muted-foreground text-[10px]">
          Click any day to view its queries
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-[10px]">Less</span>
          <div className="flex items-center gap-[2px]">
            {INTENSITY_TIERS.map((tierClass) => (
              <div
                key={tierClass}
                className={cn(
                  'h-[10px] w-[10px] flex-shrink-0 rounded-[2px]',
                  tierClass
                )}
              />
            ))}
          </div>
          <span className="text-muted-foreground text-[10px]">More</span>
        </div>
      </div>

      {/* Shared floating tooltip — one node for the whole grid (vs. a Radix
          Tooltip per cell, which would mount hundreds of roots). Positioned
          relative to the [data-calendar-root] container above. */}
      <div className="pointer-events-none absolute inset-0">
        {hover ? (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
            style={{ left: hover.x, top: hover.y - 6 }}
          >
            <div className="bg-popover text-popover-foreground border-border/60 flex min-w-[160px] flex-col gap-1 rounded-md border px-3 py-2 shadow-md">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold tabular-nums">
                  {hover.day.readable}
                </span>
                <span className="text-muted-foreground text-[10px] tabular-nums">
                  {hasTraffic ? Math.round((hover.day.count * 100) / max) : 0}%
                  of peak
                </span>
              </div>
              <span className="text-muted-foreground text-[11px]">
                {formatCalendarDate(hover.day.date)}
              </span>
              <div className="border-border/60 text-chart-2 flex items-center gap-1 border-t pt-1 text-[10px]">
                <span>View queries</span>
                <ArrowUpRightIcon className="size-3" />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export const ChartQueryCountHeatmap = createCustomChart({
  chartName: 'query-count-heatmap',
  defaultTitle: 'Query Activity Heatmap',
  defaultLastHours: 24 * 365,
  dataTestId: 'query-count-heatmap-chart',
  contentClassName: 'overflow-hidden',
  render: (dataArray, _sql, hostId) => (
    <CalendarBody data={dataArray as DayCell[]} hostId={hostId} />
  ),
})

export default ChartQueryCountHeatmap
