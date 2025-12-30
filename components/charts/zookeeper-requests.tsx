'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/charts/primitives/bar'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'

export const ChartZookeeperRequests = memo(function ChartZookeeperRequests({
  title = 'ZooKeeper Requests Over Time',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
  hostId,
}: ChartProps) {
  const swr = useChartData<{
    event_time: string
    ZookeeperRequests: number
    ZooKeeperWatch: number
  }>({
    chartName: 'zookeeper-requests',
    interval,
    lastHours,
    hostId,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(dataArray, sql) => (
        <ChartCard title={title} sql={sql} data={dataArray} className={className} data-testid="zookeeper-requests-chart">
          <BarChart
            data={dataArray}
            index="event_time"
            categories={['ZookeeperRequests', 'ZooKeeperWatch']}
            className="h-52"
            showLegend
            stack
          />
        </ChartCard>
      )}
    </ChartContainer>
  )
})

export default ChartZookeeperRequests
