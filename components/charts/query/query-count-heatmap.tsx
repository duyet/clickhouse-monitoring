'use client'

import { createCustomChart } from '@/components/charts/factory'
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
  i % 6 === 0 ? String(i).padStart(2, '0') : ''
)

function getIntensityClass(value: number, max: number): string {
  if (max === 0 || value === 0) return 'bg-muted'
  const ratio = value / max
  if (ratio < 0.1) return 'bg-blue-100 dark:bg-blue-950'
  if (ratio < 0.25) return 'bg-blue-200 dark:bg-blue-900'
  if (ratio < 0.4) return 'bg-blue-300 dark:bg-blue-800'
  if (ratio < 0.55) return 'bg-blue-400 dark:bg-blue-700'
  if (ratio < 0.7) return 'bg-blue-500 dark:bg-blue-600'
  if (ratio < 0.85) return 'bg-blue-600 dark:bg-blue-500'
  return 'bg-blue-700 dark:bg-blue-400'
}

export const ChartQueryCountHeatmap = createCustomChart({
  chartName: 'query-count-heatmap',
  defaultTitle: 'Query Count Heatmap',
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
      <div className="flex flex-col gap-2 p-2">
        {/* Hour labels */}
        <div className="flex items-center gap-0.5 pl-10">
          {HOUR_LABELS.map((label, hour) => (
            <div
              key={hour}
              className="text-muted-foreground w-6 flex-shrink-0 text-center text-[10px]"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid rows: one per day */}
        {DAY_LABELS.map((dayLabel, i) => {
          const dayOfWeek = i + 1 // 1=Mon .. 7=Sun
          return (
            <div key={dayOfWeek} className="flex items-center gap-0.5">
              <div className="text-muted-foreground w-9 flex-shrink-0 text-right text-xs">
                {dayLabel}
              </div>
              {Array.from({ length: 24 }, (_, hour) => {
                const cell = grid[dayOfWeek]?.[hour]
                const count = cell?.query_count ?? 0
                const readable = cell?.readable_count ?? '0'
                return (
                  <div
                    key={hour}
                    title={`${dayLabel} ${String(hour).padStart(2, '0')}:00 — ${readable} queries`}
                    className={cn(
                      'h-5 w-6 flex-shrink-0 cursor-default rounded-[2px] transition-opacity hover:opacity-70',
                      getIntensityClass(count, maxCount)
                    )}
                  />
                )
              })}
            </div>
          )
        })}

        {/* Legend */}
        <div className="mt-1 flex items-center justify-end gap-1">
          <span className="text-muted-foreground text-xs">Less</span>
          {[
            'bg-muted',
            'bg-blue-100 dark:bg-blue-950',
            'bg-blue-300 dark:bg-blue-800',
            'bg-blue-500 dark:bg-blue-600',
            'bg-blue-700 dark:bg-blue-400',
          ].map((cls) => (
            <div
              key={cls}
              className={cn('h-4 w-4 flex-shrink-0 rounded-[2px]', cls)}
            />
          ))}
          <span className="text-muted-foreground text-xs">More</span>
        </div>
      </div>
    )
  },
})

export default ChartQueryCountHeatmap
