'use client'

import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'
import type { ChartProps } from './chart-props'

export function ChartConnectionsInterserver({
  title = 'Interserver Connections Last 7 days (Total Requests / Hour)',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const { data, isLoading, error, refresh } = useChartData<{
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
    <ChartCard title={title} sql="" data={data || []} className={className}>
      <BarChart
        data={data || []}
        index="event_time"
        categories={['CurrentMetric_InterserverConnection']}
        readableColumn="readable_CurrentMetric_InterserverConnection"
        className={cn('h-52', chartClassName)}
        stack
      />
    </ChartCard>
  )
}

export default ChartConnectionsInterserver
