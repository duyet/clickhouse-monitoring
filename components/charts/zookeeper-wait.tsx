'use client'

import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'
import { ChartSkeleton, ChartError } from '@/components/charts'
import type { ChartProps } from './chart-props'

export function ChartZookeeperWait({
  title = 'ZooKeeper Wait Seconds',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
  hostId,
}: ChartProps) {
  const { data, error, isLoading, refresh } = useChartData<{
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

  if (isLoading) {
    return <ChartSkeleton title={title} className={className} />
  }

  if (error) {
    return (
      <ChartError
        title={title}
        error={error}
        onRetry={refresh}
        className={className}
      />
    )
  }

  return (
    <ChartCard title={title} sql="" data={data || []} className={className}>
      <BarChart
        data={data || []}
        index="event_time"
        categories={['AVG_ProfileEvent_ZooKeeperWaitSeconds']}
        readableColumn="readable_AVG_ProfileEvent_ZooKeeperWaitSeconds"
        className="h-52"
        showLegend
        stack
      />
    </ChartCard>
  )
}

export default ChartZookeeperWait
