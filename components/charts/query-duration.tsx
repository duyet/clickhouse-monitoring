'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/charts/primitives/bar'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export const ChartQueryDuration = memo(function ChartQueryDuration({
  title = 'Avg Queries Duration over last 14 days (AVG(duration in seconds) / day)',
  interval = 'toStartOfDay',
  className,
  chartClassName,
  lastHours = 24 * 14,
  hostId,
  ...props
}: ChartProps) {
  const swr = useChartData<{
    event_time: string
    query_duration_ms: number
    query_duration_s: number
  }>({
    chartName: 'query-duration',
    hostId,
    interval,
    lastHours,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className} chartClassName={chartClassName}>
      {(dataArray, sql) => (
        <ChartCard title={title} className={className} sql={sql} data={dataArray} data-testid="query-duration-chart">
          <BarChart
            className={cn('h-52', chartClassName)}
            data={dataArray}
            index="event_time"
            categories={['query_duration_s']}
            colors={['--chart-rose-200']}
            colorLabel="--foreground"
            stack
            showLegend={false}
            {...props}
          />
        </ChartCard>
      )}
    </ChartContainer>
  )
})
