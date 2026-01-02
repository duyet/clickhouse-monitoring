'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createCustomChart } from '@/components/charts/factory'
import { cn } from '@/lib/utils'

interface QueryTypeData {
  type: string
  query_count: number
}

const typeColors: Record<string, string> = {
  QueryFinish: 'bg-emerald-500',
  QueryStart: 'bg-blue-500',
  ExceptionBeforeStart: 'bg-red-500',
  ExceptionWhileProcessing: 'bg-orange-500',
}

export const ChartQueryType = createCustomChart<QueryTypeData>({
  chartName: 'query-type',
  defaultTitle: 'Query Type Distribution',
  defaultLastHours: 24,
  dataTestId: 'query-type-chart',
  render: (dataArray) => {
    const data = dataArray as QueryTypeData[]
    const total = data.reduce((sum, d) => sum + d.query_count, 0)

    return (
      <div className="flex flex-col gap-3 p-2">
        {data.map((item, index) => {
          const pct = total > 0 ? (item.query_count / total) * 100 : 0
          return (
            <div key={item.type} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.type}</span>
                <span className="text-muted-foreground">
                  {item.query_count.toLocaleString()} ({pct.toFixed(1)}%)
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    typeColors[item.type] || `bg-chart-${(index % 5) + 1}`
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
        {data.length === 0 && (
          <div className="text-muted-foreground text-center text-sm">
            No query type data available
          </div>
        )}
      </div>
    )
  },
})

export default ChartQueryType
