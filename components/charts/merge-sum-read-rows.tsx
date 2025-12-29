'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'

export function ChartMergeSumReadRows({
  title,
  interval = 'toStartOfDay',
  lastHours = 24 * 14,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const { data, isLoading, error, refresh } = useChartData<{
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

  if (isLoading)
    return (
      <ChartSkeleton
        title={title}
        className={className}
        chartClassName={chartClassName}
      />
    )
  if (error) return <ChartError error={error} title={title} onRetry={refresh} />

  return (
    <ChartCard title={title} className={className} sql="" data={data || []}>
      <BarChart
        data={data || []}
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
}

export default ChartMergeSumReadRows
