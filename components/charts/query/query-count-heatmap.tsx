'use client'

import { createCustomChart } from '@/components/charts/factory'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  { threshold: 0, bg: 'bg-muted/60', ring: '' },
  { threshold: 0.01, bg: 'bg-chart-2/15', ring: '' },
  { threshold: 0.15, bg: 'bg-chart-2/25', ring: '' },
  { threshold: 0.3, bg: 'bg-chart-2/40', ring: '' },
  { threshold: 0.45, bg: 'bg-chart-2/55', ring: '' },
  { threshold: 0.6, bg: 'bg-chart-2/70', ring: '' },
  { threshold: 0.75, bg: 'bg-chart-2/85', ring: '' },
  { threshold: 0.9, bg: 'bg-chart-2', ring: '' },
] as const

function getIntensityClass(value: number, max: number): string {
  if (max === 0 || value === 0) return INTENSITY_TIERS[0].bg
  const ratio = value / max
  // Walk tiers in reverse to find the highest matching threshold
  for (let i = INTENSITY_TIERS.length - 1; i >= 0; i--) {
    if (ratio >= INTENSITY_TIERS[i].threshold) return INTENSITY_TIERS[i].bg
  }
  return INTENSITY_TIERS[0].bg
}

function isCurrentSlot(dayOfWeek: number, hour: number): boolean {
  const now = new Date()
  // JS getDay: 0=Sun, ClickHouse toDayOfWeek: 1=Mon..7=Sun
  const jsDay = now.getDay()
  const chDay = jsDay === 0 ? 7 : jsDay
  return chDay === dayOfWeek && now.getHours() === hour
}

export const ChartQueryCountHeatmap = createCustomChart({
  chartName: 'query-count-heatmap',
  defaultTitle: 'Query Activity Heatmap',
  defaultLastHours: 24 * 7,
  dataTestId: 'query-count-heatmap-chart',
  contentClassName: 'overflow-x-auto',
  render: (dataArray) => {
    const data = dataArray as HeatmapCell[]

    // Build lookup: [day][hour] -> cell
    const grid: Record<number, Record<number, HeatmapCell>> = {}
    let maxCount = 0
    for (const cell of data) {
      if (!grid[cell.day_of_week]) grid[cell.day_of_week] = {}
      grid[cell.day_of_week][cell.hour_of_day] = cell
      if (cell.query_count > maxCount) maxCount = cell.query_count
    }

    if (data.length === 0) {
      return (
        <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
          No query data available
        </div>
      )
    }

    return (
      <TooltipProvider delayDuration={0}>
        <div className="flex h-full flex-col justify-between gap-1 px-1 py-1">
          {/* Hour labels row */}
          <div className="flex items-end gap-[3px] pl-10">
            {HOUR_LABELS.map((label, hour) => (
              <div
                key={hour}
                className="text-muted-foreground min-w-0 flex-1 text-center text-[10px] leading-none tabular-nums"
              >
                {hour % 3 === 0 ? label : ''}
              </div>
            ))}
          </div>

          {/* Grid rows: one per day */}
          <div className="flex flex-1 flex-col gap-[3px]">
            {DAY_LABELS.map((dayLabel, i) => {
              const dayOfWeek = i + 1 // 1=Mon .. 7=Sun
              const isWeekend = dayOfWeek >= 6
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

                    return (
                      <Tooltip key={hour}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'min-w-0 flex-1 cursor-default rounded-[3px] transition-all duration-150',
                              'hover:scale-110 hover:ring-2 hover:ring-foreground/20 hover:z-10',
                              getIntensityClass(count, maxCount),
                              isCurrent &&
                                'ring-2 ring-foreground/40 ring-offset-1 ring-offset-background'
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-semibold tabular-nums">
                            {readable} queries
                          </p>
                          <p className="text-muted-foreground text-[10px]">
                            {dayLabel} {String(hour).padStart(2, '0')}:00–
                            {String(hour).padStart(2, '0')}:59
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Legend row */}
          <div className="flex items-center justify-end gap-2 pt-0.5">
            <span className="text-muted-foreground text-[10px]">Less</span>
            <div className="flex items-center gap-[2px]">
              {[
                'bg-muted/60',
                'bg-chart-2/15',
                'bg-chart-2/40',
                'bg-chart-2/70',
                'bg-chart-2',
              ].map((cls) => (
                <div
                  key={cls}
                  className={cn(
                    'h-[10px] w-[10px] flex-shrink-0 rounded-[2px]',
                    cls
                  )}
                />
              ))}
            </div>
            <span className="text-muted-foreground text-[10px]">More</span>
          </div>
        </div>
      </TooltipProvider>
    )
  },
})

export default ChartQueryCountHeatmap
