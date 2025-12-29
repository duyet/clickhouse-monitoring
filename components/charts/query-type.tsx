'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { DonutChart } from '@/components/tremor/donut'
import { useChartData } from '@/lib/swr'

export function ChartQueryType({
  title,
  className,
  chartClassName,
  lastHours = 24,
  hostId,
  ...props
}: ChartProps) {
  const { data, isLoading, error, refresh } = useChartData<{
    type: string
    query_count: number
  }>({
    chartName: 'query-type',
    hostId,
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
  if (error)
    return <ChartError error={error} title={title} onRetry={refresh} />

  return (
    <DonutChart
      data={data || []}
      index="type"
      categories={['query_count']}
      readable="quantity"
      {...props}
    />
  )
}

export default ChartQueryType
