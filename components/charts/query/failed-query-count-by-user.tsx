'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { memo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { BarChart } from '@/components/charts/primitives/bar'
import { transformUserEventCounts } from '@/lib/chart-data-transforms'
import { useChartData } from '@/lib/swr'

export const ChartFailedQueryCountByType = memo(
  function ChartFailedQueryCountByType({
    title,
    interval = 'toStartOfDay',
    lastHours = 24 * 14,
    className,
    chartClassName,
    hostId,
    ...props
  }: ChartProps) {
    const swr = useChartData<{
      event_time: string
      user: string
      count: number
    }>({
      chartName: 'failed-query-count-by-user',
      hostId,
      interval,
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
        {(dataArray, sql, metadata) => {
          const { chartData, users } = transformUserEventCounts(dataArray)

          return (
            <ChartCard
              title={title}
              className={className}
              sql={sql}
              data={chartData}
              metadata={metadata}
              data-testid="failed-query-count-by-user-chart"
            >
              <BarChart
                className={chartClassName}
                data={chartData}
                index="event_time"
                categories={users}
                showLegend
                stack
                {...props}
              />
            </ChartCard>
          )
        }}
      </ChartContainer>
    )
  }
)

export default ChartFailedQueryCountByType
