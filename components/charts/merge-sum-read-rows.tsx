'use client'

import { memo } from 'react'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'

export const ChartMergeSumReadRows = memo(function ChartMergeSumReadRows({
  title,
  interval = 'toStartOfDay',
  lastHours = 24 * 14,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const { data, isLoading, error, refresh, sql } = useChartData<{
    event_time: string
    sum_read_rows: number
    sum_read_rows_scale: number
    readable_sum_read_rows: string
  }>({
    chartName: 'merge-sum-read-rows',
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
        categories={['sum_read_rows_scale']}
        readableColumn="readable_sum_read_rows"
        labelPosition="inside"
        labelAngle={-90}
        colorLabel="--foreground"
        className={chartClassName}
        colors={['--chart-indigo-300']}
        autoMinValue={true}
        relative={false}
        allowDecimals={true}
      />
    </ChartCard>
  )
})

export default ChartMergeSumReadRows
