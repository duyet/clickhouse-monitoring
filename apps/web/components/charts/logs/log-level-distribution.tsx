'use client'

import { createCustomChart } from '@/components/charts/factory'
import { cn } from '@/lib/utils'

interface LogLevelData {
  level: string
  count: number
}

const levelColors: Record<string, string> = {
  Fatal: 'bg-red-700',
  Critical: 'bg-red-500',
  Error: 'bg-orange-500',
  Warning: 'bg-yellow-500',
  Notice: 'bg-blue-500',
  Information: 'bg-emerald-500',
  Debug: 'bg-gray-500',
  Trace: 'bg-gray-400',
}

export const ChartLogLevelDistribution = createCustomChart({
  chartName: 'log-level-distribution',
  defaultTitle: 'Log Level Distribution',
  defaultLastHours: 24,
  dataTestId: 'log-level-distribution-chart',
  dateRangeConfig: 'realtime',
  render: (dataArray) => {
    const data = dataArray as LogLevelData[]
    const total = data.reduce((sum, d) => sum + d.count, 0)

    return (
      <div className="flex flex-col gap-3 p-2">
        {data.map((item, index) => {
          const pct = total > 0 ? (item.count / total) * 100 : 0
          return (
            <div key={item.level} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.level}</span>
                <span className="text-muted-foreground">
                  {item.count.toLocaleString()} ({pct.toFixed(1)}%)
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    levelColors[item.level] || `bg-chart-${(index % 5) + 1}`
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
        {data.length === 0 && (
          <div className="text-muted-foreground text-center text-sm">
            No log level data available
          </div>
        )}
      </div>
    )
  },
})

export default ChartLogLevelDistribution
