'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/charts/primitives/bar'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export const PageViewBarChart = memo(function PageViewBarChart({
  title = 'Daily Page Views',
  interval = 'toStartOfDay',
  className,
  chartClassName,
  chartCardContentClassName,
  lastHours = 24 * 14,
  showXAxis = true,
  showYAxis = true,
  showLegend = false,
  colors = ['--chart-indigo-300'],
  hostId,
  ...props
}: ChartProps & { colors?: string[] }) {
  const swr = useChartData<{
    event_time: string
    page_views: number
  }>({
    chartName: 'page-view',
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
          data-testid="page-view-chart"
        >
          <BarChart
            className={cn('h-52', chartClassName)}
            data={dataArray}
            index="event_time"
            categories={['page_views']}
            readable="quantity"
            showLegend={showLegend}
            showXAxis={showXAxis}
            showYAxis={showYAxis}
            showLabel={true}
            colors={colors}
            {...props}
          />
        </ChartCard>
      )}
    </ChartContainer>
  )
})

export default PageViewBarChart
