'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/charts/primitives/bar'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export const ChartConnectionsInterserver = memo(
  function ChartConnectionsInterserver({
    title = 'Interserver Connections Last 7 days (Total Requests / Hour)',
    interval = 'toStartOfHour',
    lastHours = 24 * 7,
    className,
    chartClassName,
    hostId,
  }: ChartProps) {
    const swr = useChartData<{
      event_time: string
      CurrentMetric_InterserverConnection: number
      readable_CurrentMetric_InterserverConnection: string
    }>({
      chartName: 'connections-interserver',
      hostId,
      interval,
      lastHours,
      refreshInterval: 30000,
    })

    return (
      <ChartContainer swr={swr} title={title} className={className} chartClassName={chartClassName}>
        {(dataArray, sql) => (
          <ChartCard title={title} sql={sql} data={dataArray} className={className}>
            <BarChart
              data={dataArray}
              index="event_time"
              categories={['CurrentMetric_InterserverConnection']}
              readableColumn="readable_CurrentMetric_InterserverConnection"
              className={cn('h-52', chartClassName)}
              stack
            />
          </ChartCard>
        )}
      </ChartContainer>
    )
  }
)

export default ChartConnectionsInterserver
