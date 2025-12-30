'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/charts/primitives/bar'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export const ChartConnectionsHttp = memo(function ChartConnectionsHttp({
  title = 'HTTP Connections Last 7 days (Total Requests / Hour)',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const swr = useChartData<{
    event_time: string
    CurrentMetric_HTTPConnection: number
    readable_CurrentMetric_HTTPConnection: string
    CurrentMetric_HTTPConnectionsTotal: number
    readable_CurrentMetric_HTTPConnectionsTotal: string
  }>({
    chartName: 'connections-http',
    hostId,
    interval,
    lastHours,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className} chartClassName={chartClassName}>
      {(dataArray, sql) => (
        <ChartCard title={title} sql={sql} className={className} data={dataArray}>
          <BarChart
            data={dataArray}
            index="event_time"
            categories={[
              'CurrentMetric_HTTPConnectionsTotal',
              'CurrentMetric_HTTPConnection',
            ]}
            className={cn('h-52', chartClassName)}
            stack
            showLabel={false}
          />
        </ChartCard>
      )}
    </ChartContainer>
  )
})

export default ChartConnectionsHttp
