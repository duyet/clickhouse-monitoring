'use client'

import { memo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/charts/primitives/bar'
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
        // Single-pass algorithm: collect data and track users simultaneously
        type DataItem = { event_time: string; user: string; count: number }
        const userSet = new Set<string>()
        const data = dataArray.reduce<Record<string, Record<string, number>>>(
          (acc, cur) => {
            const { event_time, user, count } = cur as DataItem
            userSet.add(user)
            if (acc[event_time] === undefined) {
              acc[event_time] = {}
            }
            const inner = acc[event_time] || {}
            inner[user] = count
            acc[event_time] = inner
            return acc
          },
          {}
        )

        const barData = Object.entries(data).map(([event_time, obj]) => {
          return { event_time, ...obj }
        })

        // Convert set to array for categories
        const users = Array.from(userSet)

        return (
          <ChartCard
            title={title}
            className={className}
            sql={sql}
            data={barData}
            data-testid="query-count-by-user-chart"
          >
            <BarChart
              className={chartClassName}
              data={barData}
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
