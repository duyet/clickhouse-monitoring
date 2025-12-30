'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/charts/primitives/area'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export const ChartFailedQueryCount = memo(function ChartFailedQueryCount({
  title,
  interval = 'toStartOfMinute',
  className,
  chartClassName,
  chartCardContentClassName,
  lastHours = 24 * 7,
  showXAxis = true,
  showLegend = false,
  showCartesianGrid = true,
  breakdown = 'breakdown',
  hostId,
  ...props
}: ChartProps) {
  const swr = useChartData<{
    event_time: string
    query_count: number
    breakdown: Array<[string, number] | Record<string, string>>
  }>({
    chartName: 'failed-query-count',
    hostId,
    interval,
    lastHours,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className} chartClassName={chartClassName}>
      {(dataArray, sql) => (
        <ChartCard
          title={title}
          className={className}
          contentClassName={chartCardContentClassName}
          sql={sql}
          data={dataArray}
          data-testid="failed-query-count-chart"
        >
          <AreaChart
            className={cn('h-52', chartClassName)}
            data={dataArray}
            index="event_time"
            categories={['query_count']}
            readable="quantity"
            stack
            showLegend={showLegend}
            showXAxis={showXAxis}
            showCartesianGrid={showCartesianGrid}
            colors={['--chart-1']}
            breakdown={breakdown}
            breakdownLabel="query_type"
            breakdownValue="count"
            {...props}
          />
        </ChartCard>
      )}
    </ChartContainer>
  )
})
