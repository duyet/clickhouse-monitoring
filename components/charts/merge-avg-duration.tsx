'use client'

import { memo } from 'react'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'

export const ChartMergeAvgDuration = memo(function ChartMergeAvgDuration({
  title,
  interval = 'toStartOfDay',
  lastHours = 24 * 14,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const { data, isLoading, error, refresh, sql } = useChartData<{
    event_time: string
    avg_duration_ms: number
    readable_avg_duration_ms: string
    bar: number
  }>({
    chartName: 'merge-avg-duration',
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
        data={dataArray}
        index="event_time"
        categories={['avg_duration_ms']}
        readableColumn="readable_avg_duration_ms"
        className={chartClassName}
        showLabel={false}
      />
    </ChartCard>
  )
})

export default ChartMergeAvgDuration
