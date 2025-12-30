'use client'

import { memo } from 'react'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/skeletons'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'
import type { ChartProps } from './chart-props'

export const ChartConnectionsHttp = memo(function ChartConnectionsHttp({
  title = 'HTTP Connections Last 7 days (Total Requests / Hour)',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const { data, isLoading, error, refresh, sql } = useChartData<{
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

  const dataArray = Array.isArray(data) ? data : undefined

  if (isLoading)
    return (
      <ChartSkeleton
        title={title}
        className={className}
        chartClassName={chartClassName}
      />
    )
  if (error) return <ChartError error={error} title={title} onRetry={refresh} />

  // Show empty state if no data
  if (!dataArray || dataArray.length === 0) {
    return <ChartEmpty title={title} className={className} />
  }

  return (
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
  )
})

export default ChartConnectionsHttp
