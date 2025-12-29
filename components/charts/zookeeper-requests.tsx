'use client'

import { ChartEmpty } from '@/components/charts/chart-empty'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'
import { ChartSkeleton, ChartError } from '@/components/charts'
import type { ChartProps } from './chart-props'

export function ChartZookeeperRequests({
  title = 'ZooKeeper Requests Over Time',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
  hostId,
}: ChartProps) {
  const { data, error, isLoading, refresh, sql } = useChartData<{
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

  const dataArray = Array.isArray(data) ? data : undefined

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

  // Show empty state if no data
  if (!dataArray || dataArray.length === 0) {
    return <ChartEmpty title={title} className={className} />
  }

  return (
    <ChartCard
      title={title}
      sql={sql}
      data={dataArray}
      className={className}
    >
      <BarChart
        data={dataArray}
        index="event_time"
        categories={['ZookeeperRequests', 'ZooKeeperWatch']}
        className="h-52"
        showLegend
        stack
      />
    </ChartCard>
  )
}

export default ChartZookeeperRequests
