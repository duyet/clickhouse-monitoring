'use client'

import { memo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/charts/primitives/bar'
import { transformUserEventCounts } from '@/lib/chart-data-transforms'
import { useChartData } from '@/lib/swr'
import { chartTickFormatters } from '@/lib/utils'

export const ChartQueryCountByUser = memo(function ChartQueryCountByUser({
  title = 'Total Queries over last 14 days by users',
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
    chartName: 'query-count-by-user',
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
      {(dataArray, sql) => {
        const { chartData, users } = transformUserEventCounts(dataArray)

        return (
          <ChartCard
            title={title}
            sql={sql}
            data={chartData}
            data-testid="query-count-by-user-chart"
          >
            <BarChart
              className={chartClassName}
              data={chartData}
              index="event_time"
              categories={users}
              colors={[
                '--chart-1',
                '--chart-2',
                '--chart-3',
                '--chart-4',
                '--chart-5',
                '--chart-6',
                '--chart-7',
                '--chart-8',
              ]}
              showLegend
              stack
              yAxisTickFormatter={chartTickFormatters.count}
              {...props}
            />
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
})

export default ChartQueryCountByUser
