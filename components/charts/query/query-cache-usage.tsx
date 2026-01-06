'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createCustomChart } from '@/components/charts/factory'
import { cn } from '@/lib/utils'

interface CacheUsageData {
  query_cache_usage: string
  query_count: number
  percentage: number
}

const cacheColors: Record<string, string> = {
  None: 'bg-gray-400',
  Read: 'bg-emerald-500',
  Write: 'bg-blue-500',
}

/**
 * Query Cache Usage Chart
 * Shows query cache hit rate breakdown by usage type (Read, Write, None)
 * Available in ClickHouse v24.1+
 */
export const ChartQueryCacheUsage = createCustomChart({
  chartName: 'query-cache-usage',
  defaultTitle: 'Query Cache Hit Rate',
  defaultLastHours: 24 * 7,
  dataTestId: 'query-cache-usage-chart',
  dateRangeConfig: 'standard',
  render: (dataArray) => {
    const data = dataArray as CacheUsageData[]
    const total = data.reduce((sum, d) => sum + d.query_count, 0)

    return (
      <div className="flex flex-col gap-3 p-2">
        {data.map((item) => {
          const pct = total > 0 ? (item.query_count / total) * 100 : 0
          return (
            <div key={item.query_cache_usage} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.query_cache_usage}</span>
                <span className="text-muted-foreground">
                  {item.query_count.toLocaleString()} ({pct.toFixed(1)}%)
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    cacheColors[item.query_cache_usage] || 'bg-chart-1'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
        {data.length === 0 && (
          <div className="text-muted-foreground text-center text-sm">
            No cache usage data available
          </div>
        )}
      </div>
    )
  },
})

export type ChartQueryCacheUsageProps = ChartProps

export default ChartQueryCacheUsage
