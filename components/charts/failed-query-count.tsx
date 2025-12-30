'use client'

import { memo } from 'react'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { AreaChart } from '@/components/generic-charts/area'
import { ChartCard } from '@/components/generic-charts/chart-card'
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
  const { data, isLoading, error, refresh, sql } = useChartData<{
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

  const dataArray = Array.isArray(data) ? data : undefined

  if (isLoading)
    return (
      <ChartSkeleton
        title={title}
        className={className}
        chartClassName={chartClassName}
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
  )
})
