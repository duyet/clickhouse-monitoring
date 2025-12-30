'use client'

import { memo } from 'react'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartSkeleton } from '@/components/skeletons'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'

export const ChartReadonlyReplica = memo(function ChartReadonlyReplica({
  title = 'Readonly Replicated Tables',
  interval = 'toStartOfFifteenMinutes',
  lastHours = 24,
  className,
  hostId,
}: ChartProps) {
  const { data, isLoading, error, refresh, sql } = useChartData<{
    event_time: string
    ReadonlyReplica: number
  }>({
    chartName: 'readonly-replica',
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
        chartClassName="h-52"
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
        categories={['ReadonlyReplica']}
        className="h-52"
      />
    </ChartCard>
  )
})

export default ChartReadonlyReplica
