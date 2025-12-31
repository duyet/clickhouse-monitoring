'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { DonutChart } from '@/components/charts/primitives/donut'
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
  const swr = useChartData<{
    type: string
    query_count: number
  }>({
    chartName: 'query-type',
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
          index="type"
          categories={['query_count']}
          readable="quantity"
          showLegend={showLegend}
          className={chartClassName}
          data-testid="query-type-chart"
        />
      )}
    </ChartContainer>
  )
})

export default ChartQueryType
