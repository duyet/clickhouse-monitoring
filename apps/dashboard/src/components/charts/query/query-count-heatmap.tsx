import { ArrowUpRightIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import type {
  CalendarDay,
  HeatmapDayRow,
  MetricConfig,
  MetricKey,
} from './query-count-calendar'

import {
  buildCalendarModel,
  buildStatCards,
  CALENDAR_DAY_LABELS,
  formatCalendarDate,
  getIntensityClass,
  isoDate,
  METRIC_CONFIGS,
  METRIC_ORDER,
} from './query-count-calendar'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createCustomChart } from '@/components/charts/factory'
import { cn } from '@/lib/utils'

// Day-of-week rows that get a left-gutter label (GitHub shows Mon/Wed/Fri).
const LABELLED_ROWS = new Set([1, 3, 5])

interface HoverState {
  day: CalendarDay
  x: number
  y: number
}

/** Drill into the day's queries. Failed mode jumps straight to /failed-queries. */
function buildDrilldownHref(
  hostId: number,
  day: CalendarDay,
  metricKey: MetricKey
): string {
  // Whole-day window. BETWEEN is inclusive on both ends in ClickHouse, so end
  // at 23:59:59 to keep the next day out of this cell's drilldown.
  const params = new URLSearchParams()
  params.set('host', String(hostId))
  params.set('event_time', `between:${day.iso} 00:00:00,${day.iso} 23:59:59`)
  const path = metricKey === 'failed' ? '/failed-queries' : '/history-queries'
  return `${path}?${params.toString()}`
}

/** Pill button that switches the active metric. */
function ModePill({
  metric,
  active,
  onSelect,
}: {
  metric: MetricConfig
  active: boolean
  onSelect: (key: MetricKey) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(metric.key)}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground'
      )}
    >
      {metric.label}
    </button>
  )
}

/** One KPI card in the summary strip. */
function StatCardView({
  label,
  value,
  sub,
  accentClass,
}: {
  label: string
  value: string
  sub?: string
  accentClass?: string
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-border/60 bg-card/40 px-4 py-3">
      <span className="text-muted-foreground truncate text-[11px] font-medium uppercase tracking-wide">
        {label}
      </span>
      <span
        className={cn(
          'mt-1.5 truncate text-2xl font-semibold tabular-nums leading-none',
          accentClass
        )}
      >
        {value}
      </span>
      {sub ? (
        <span className="text-muted-foreground mt-1.5 truncate text-xs">
          {sub}
        </span>
      ) : null}
    </div>
  )
}

function CalendarBody({
  data,
  hostId,
}: {
  data: HeatmapDayRow[]
  hostId: number
}) {
  const [mode, setMode] = useState<MetricKey>('queries')
  const [hover, setHover] = useState<HoverState | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const metric = METRIC_CONFIGS[mode]

  // `today` is read once per render from the local clock; memoize so the
  // ~371-cell build is off every hover re-render and only reruns on mode change.
  const model = useMemo(
    () => buildCalendarModel(data, new Date(), metric),
    [data, metric]
  )
  const statCards = useMemo(
    () => buildStatCards(metric, model),
    [metric, model]
  )
  const todayIso = isoDate(new Date())

  // Auto-focus the latest date: scroll the calendar to its right edge on mount
  // and whenever the data set changes. No-op when the grid already fits (wide
  // screens) since scrollWidth === clientWidth; matters on narrow/overflowing
  // viewports where the most recent weeks would otherwise be off-screen.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || data.length === 0) return
    const id = requestAnimationFrame(() => {
      el.scrollLeft = el.scrollWidth
    })
    return () => cancelAnimationFrame(id)
  }, [data])

  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
        No query activity in the last year
      </div>
    )
  }

  const { weeks, monthLabels, max, rangeLabel } = model
  const hasTraffic = max > 0

  return (
    <div
      data-calendar-root
      className="relative flex h-full w-full flex-col justify-center gap-4"
    >
      {/* Range caption + metric switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-muted-foreground font-mono text-xs">
          {rangeLabel}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {METRIC_ORDER.map((key) => (
            <ModePill
              key={key}
              metric={METRIC_CONFIGS[key]}
              active={key === mode}
              onSelect={setMode}
            />
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCardView
            key={card.label}
            label={card.label}
            value={card.value}
            sub={card.sub}
            accentClass={card.accent ? metric.accentText : undefined}
          />
        ))}
      </div>

      {/* Calendar: month labels + weekday gutter + week columns. The columns are
          fluid (flex-1) so the grid fills the card/dialog width; a min width
          keeps it legible on phones (horizontal scroll, like GitHub). */}
      <div ref={scrollRef} className="overflow-x-auto pb-1">
        <div className="min-w-[680px]">
          {/* Month labels, aligned to week columns (pl matches the gutter). */}
          <div className="flex gap-[3px] pb-1.5 pl-9">
            {monthLabels.map((label, i) => (
              <div
                key={weeks[i].find(Boolean)?.iso ?? `col-${i}`}
                className="text-muted-foreground min-w-0 flex-1 text-[11px] leading-none"
              >
                {label ?? ''}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {/* Weekday gutter */}
            <div className="flex w-9 flex-shrink-0 flex-col gap-[3px]">
              {CALENDAR_DAY_LABELS.map((label, dow) => (
                <div
                  key={label}
                  className="text-muted-foreground flex aspect-square items-center justify-end pr-1.5 text-[10px] leading-none"
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
                  const intensity = getIntensityClass(
                    day.value,
                    max,
                    metric.tiers
                  )
                  const isToday = day.iso === todayIso
                  const href = buildDrilldownHref(hostId, day, mode)
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
                      aria-label={`${day.readable} on ${formatCalendarDate(day.date)}`}
                      onMouseEnter={onEnter}
                      onFocus={onEnter}
                      onMouseLeave={() => setHover(null)}
                      onBlur={() => setHover(null)}
                      className={cn(
                        'aspect-square w-full rounded-[3px] transition-transform duration-100',
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          Click any day to view its queries · hover for daily totals
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-[11px]">Less</span>
          <div className="flex items-center gap-[3px]">
            {metric.tiers.map((tierClass) => (
              <div
                key={tierClass}
                className={cn(
                  'size-[11px] flex-shrink-0 rounded-[3px]',
                  tierClass
                )}
              />
            ))}
          </div>
          <span className="text-muted-foreground text-[11px]">More</span>
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
            <div className="bg-popover text-popover-foreground border-border/60 flex min-w-[170px] flex-col gap-1 rounded-md border px-3 py-2 shadow-md">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold tabular-nums">
                  {hover.day.readable}
                </span>
                <span className="text-muted-foreground text-[10px] tabular-nums">
                  {hasTraffic ? Math.round((hover.day.value * 100) / max) : 0}%
                  of peak
                </span>
              </div>
              <span className="text-muted-foreground text-[11px]">
                {formatCalendarDate(hover.day.date)}
              </span>
              <div className="border-border/60 flex items-center gap-1 border-t pt-1 text-[10px]">
                <span className={metric.accentText}>
                  {mode === 'failed' ? 'View failed queries' : 'View queries'}
                </span>
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
    <CalendarBody data={dataArray as HeatmapDayRow[]} hostId={hostId} />
  ),
})

export default ChartQueryCountHeatmap
