'use client'

import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'
import type { ChartProps } from './chart-props'

export function ChartConnectionsHttp({
  title = 'HTTP Connections Last 7 days (Total Requests / Hour)',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const { data, isLoading, error, refresh } = useChartData<{
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

  if (isLoading)
    return (
      <ChartSkeleton
        title={title}
        className={className}
        chartClassName={chartClassName}
      />
    )
  if (error)
    return <ChartError error={error} title={title} onRetry={refresh} />

  return (
    <ChartCard title={title} sql="" className={className} data={data || []}>
      <BarChart
        data={data || []}
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
  )
}

export default ChartConnectionsHttp
