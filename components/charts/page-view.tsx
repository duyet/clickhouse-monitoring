'use client'

import { memo } from 'react'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartSkeleton } from '@/components/skeletons'
import { BarChart } from '@/components/generic-charts/bar'
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
  const { data, isLoading, error, refresh, sql } = useChartData<{
    event_time: string
    page_views: number
  }>({
    chartName: 'page-view',
    hostId,
    interval,
    lastHours,
    refreshInterval: 30000,
  })

  const dataArray = Array.isArray(data) ? data : undefined

  if (isLoading)
    return (
      <ChartSkeleton
        title={title}
        className={className}
        chartClassName={cn('h-52', chartClassName)}
      />
    )
  if (error) return <ChartError error={error} title={title} onRetry={refresh} />

  // Show empty state if no data
  if (!dataArray || dataArray.length === 0) {
    return <ChartEmpty title={title} className={className} />
  }

  return (
    <ChartCard
      title={title}
      className={className}
      contentClassName={chartCardContentClassName}
      sql={sql}
      data={dataArray}
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
  )
})

export default PageViewBarChart
