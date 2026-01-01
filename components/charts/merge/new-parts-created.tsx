'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { memo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { BarChart } from '@/components/charts/primitives/bar'
import { useChartData } from '@/lib/swr'

export const ChartNewPartsCreated = memo(function ChartNewPartsCreated({
  title = 'New Parts Created over last 24 hours (part counts / 15 minutes)',
  interval = 'toStartOfFifteenMinutes',
  lastHours = 24,
  className,
  chartClassName,
  hostId,
  ...props
}: ChartProps) {
  const swr = useChartData<{
    event_time: string
    table: string
    new_parts: number
  }>({
    chartName: 'new-parts-created',
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
        // Type the data items properly
        type DataItem = { event_time: string; table: string; new_parts: number }

        // Single-pass algorithm: collect data and track tables simultaneously
        const tableSet = new Set<string>()
        const data = dataArray.reduce<Record<string, Record<string, number>>>(
          (acc, cur) => {
            const { event_time, table, new_parts } = cur as DataItem
            tableSet.add(table)
            if (acc[event_time] === undefined) {
              acc[event_time] = {}
            }

            const inner = acc[event_time] || {}
            inner[table] = new_parts
            acc[event_time] = inner
            return acc
          },
          {}
        )

        const barData = Object.entries(data).map(([event_time, obj]) => {
          return { event_time, ...obj }
        })

        // Convert set to array for categories
        const tables = Array.from(tableSet)

        return (
          <ChartCard
            title={title}
            className={className}
            sql={sql}
            data={barData}
            data-testid="new-parts-created-chart"
          >
            <BarChart
              className={chartClassName}
              data={barData}
              index="event_time"
              categories={tables}
              colors={[
                '--chart-5',
                '--chart-6',
                '--chart-7',
                '--chart-8',
                '--chart-9',
                '--chart-10',
                '--chart-11',
              ]}
              stack
              {...props}
            />
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
})

export default ChartNewPartsCreated
