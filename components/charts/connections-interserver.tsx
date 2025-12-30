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

export const ChartConnectionsInterserver = memo(
  function ChartConnectionsInterserver({
    title = 'Interserver Connections Last 7 days (Total Requests / Hour)',
    interval = 'toStartOfHour',
    lastHours = 24 * 7,
    className,
    chartClassName,
    hostId,
  }: ChartProps) {
    const { data, isLoading, error, refresh, sql } = useChartData<{
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

    const dataArray = Array.isArray(data) ? data : undefined

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

    // Show empty state if no data
    if (!dataArray || dataArray.length === 0) {
      return <ChartEmpty title={title} className={className} />
    }

    return (
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
    )
  }
)

export default ChartConnectionsInterserver
