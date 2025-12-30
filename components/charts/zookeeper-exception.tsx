'use client'

import { memo } from 'react'
import { ChartError, ChartSkeleton } from '@/components/charts'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'
import type { ChartProps } from './chart-props'

export const ChartKeeperException = memo(function ChartKeeperException({
  title = 'KEEPER_EXCEPTION last 7 days',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
  hostId,
}: ChartProps) {
  const { data, error, isLoading, refresh, sql } = useChartData<{
    event_time: string
    KEEPER_EXCEPTION: number
  }>({
    chartName: 'zookeeper-exception',
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
    <ChartCard title={title} sql={sql} data={dataArray} className={className}>
      <BarChart
        data={dataArray}
        index="event_time"
        categories={['KEEPER_EXCEPTION']}
        className="h-52"
        showLegend
        stack
      />
    </ChartCard>
  )
})
