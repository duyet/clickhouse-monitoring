'use client'

import { memo } from 'react'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartSkeleton } from '@/components/skeletons'
import { DonutChart } from '@/components/generic-charts/donut'
import { useChartData } from '@/lib/swr'

export const ChartQueryType = memo(function ChartQueryType({
  title,
  className,
  chartClassName,
  lastHours = 24,
  hostId,
  showLegend,
  ..._props
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
    <DonutChart
      data={dataArray}
      index="type"
      categories={['query_count']}
      readable="quantity"
      showLegend={showLegend}
      className={chartClassName}
    />
  )
})

export default ChartQueryType
