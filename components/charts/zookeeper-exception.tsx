'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/charts/primitives/bar'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'

export const ChartKeeperException = memo(function ChartKeeperException({
  title = 'KEEPER_EXCEPTION last 7 days',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
  hostId,
}: ChartProps) {
  const swr = useChartData<{
    event_time: string
    KEEPER_EXCEPTION: number
  }>({
    chartName: 'zookeeper-exception',
    interval,
    lastHours,
    hostId,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(dataArray, sql) => (
        <ChartCard title={title} sql={sql} data={dataArray} className={className} data-testid="zookeeper-exception-chart">
          <BarChart
            data={dataArray}
            index="event_time"
            categories={['KEEPER_EXCEPTION']}
            className="h-52"
            showLegend
            stack
          />
        </ChartCard>
      )}
    </ChartContainer>
  )
})
