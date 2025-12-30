'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/charts/primitives/bar'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export const ChartQueryMemory = memo(function ChartQueryMemory({
  title = 'Avg Memory Usage for queries over last 14 days',
  interval = 'toStartOfDay',
  className,
  chartClassName,
  lastHours = 24 * 14,
  hostId,
  ...props
}: ChartProps) {
  const swr = useChartData<{
    event_time: string
    memory_usage: number
    readable_memory_usage: string
  }>({
    chartName: 'query-memory',
    hostId,
    interval,
    lastHours,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className} chartClassName={chartClassName}>
      {(dataArray, sql) => (
        <ChartCard title={title} className={className} sql={sql} data={dataArray} data-testid="query-memory-chart">
          <BarChart
            className={cn('h-52', chartClassName)}
            data={dataArray}
            index="event_time"
            categories={['memory_usage']}
            readableColumn="readable_memory_usage"
            stack
            showLegend={false}
            showLabel={false}
            colors={['--chart-indigo-300']}
            {...props}
          />
        </ChartCard>
      )}
    </ChartContainer>
  )
})

export default ChartQueryMemory
