'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { AreaChart } from '@/components/generic-charts/area'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'
import { chartTickFormatters } from '@/lib/utils'

export function ChartMemoryUsage({
  title,
  interval = 'toStartOfTenMinutes',
  lastHours = 24,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const { data, isLoading, error, refresh } = useChartData<{
    event_time: string
    avg_memory: number
    readable_avg_memory: string
  }>({
    chartName: 'memory-usage',
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
  if (error) return <ChartError error={error} title={title} onRetry={refresh} />

  return (
    <ChartCard
      title={title}
      className={className}
      sql=""
      data={data || []}
      data-testid="memory-usage-chart"
    >
      <AreaChart
        data={data || []}
        index="event_time"
        categories={['avg_memory']}
        className={chartClassName}
        colors={['--chart-12']}
        xAxisLabel="Time"
        yAxisLabel="Memory Usage"
        yAxisTickFormatter={chartTickFormatters.bytes}
      />
    </ChartCard>
  )
}

export default ChartMemoryUsage
