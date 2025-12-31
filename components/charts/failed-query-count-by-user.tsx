'use client'

import { memo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/charts/primitives/bar'
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
              data-testid="failed-query-count-by-user-chart"
            >
              <BarChart
                className={chartClassName}
                data={barData}
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
