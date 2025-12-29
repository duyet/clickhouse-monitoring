'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'

export function ChartReadonlyReplica({
  title = 'Readonly Replicated Tables',
  interval = 'toStartOfFifteenMinutes',
  lastHours = 24,
  className,
  hostId,
}: ChartProps) {
  const { data, isLoading, error, refresh } = useChartData<{
    event_time: string
    ReadonlyReplica: number
  }>({
    chartName: 'readonly-replica',
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
        chartClassName="h-52"
      />
    )
  if (error) return <ChartError error={error} title={title} onRetry={refresh} />

  return (
    <ChartCard title={title} sql="" className={className}>
      <BarChart
        data={data || []}
        index="event_time"
        categories={['ReadonlyReplica']}
        className="h-52"
      />
    </ChartCard>
  )
}

export default ChartReadonlyReplica
