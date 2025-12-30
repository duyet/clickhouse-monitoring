'use client'

import { memo } from 'react'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
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
  const { data, isLoading, error, refresh, sql } = useChartData<{
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
    <ChartCard title={title} className={className} sql={sql} data={dataArray}>
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
  )
})
