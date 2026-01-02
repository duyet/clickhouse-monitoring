'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import { DonutChart } from '@/components/charts/primitives/donut'
import { useChartData } from '@/lib/swr'

/**
 * Query Cache Usage Chart
 * Shows query cache hit rate breakdown by usage type (Read, Write, None)
 * Available in ClickHouse v24.1+
 */
export const ChartQueryCacheUsage = memo(function ChartQueryCacheUsage({
  title = 'Query Cache Hit Rate',
  className,
  chartClassName,
  lastHours = 24 * 7,
  hostId,
}: ChartProps) {
  const swr = useChartData<{
    query_cache_usage: string
    query_count: number
    percentage: number
  }>({
    chartName: 'query-cache-usage',
    hostId,
    lastHours,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer
      swr={swr}
      title={title}
      className={className}
      chartClassName={chartClassName}
    >
      {(dataArray) => (
        <DonutChart
          data={dataArray}
          index="query_cache_usage"
          categories={['query_count']}
          readable="quantity"
          showLegend
          className={chartClassName}
          data-testid="query-cache-usage-chart"
        />
      )}
    </ChartContainer>
  )
})

export type ChartQueryCacheUsageProps = ChartProps

export default ChartQueryCacheUsage
