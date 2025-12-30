'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/charts/primitives/bar'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'

export const ChartZookeeperWait = memo(function ChartZookeeperWait({
  title = 'ZooKeeper Wait Seconds',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
  hostId,
}: ChartProps) {
  const swr = useChartData<{
    event_time: string
    AVG_ProfileEvent_ZooKeeperWaitSeconds: number
    readable_AVG_ProfileEvent_ZooKeeperWaitSeconds: string
  }>({
    chartName: 'zookeeper-wait',
    interval,
    lastHours,
    hostId,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(dataArray, sql) => (
        <ChartCard title={title} sql={sql} data={dataArray} className={className} data-testid="zookeeper-wait-chart">
          <BarChart
            data={dataArray}
            index="event_time"
            categories={['AVG_ProfileEvent_ZooKeeperWaitSeconds']}
            readableColumn="readable_AVG_ProfileEvent_ZooKeeperWaitSeconds"
            className="h-52"
            showLegend
            stack
          />
        </ChartCard>
      )}
    </ChartContainer>
  )
})

export default ChartZookeeperWait
