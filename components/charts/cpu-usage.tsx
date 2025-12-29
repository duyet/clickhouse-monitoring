'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { AreaChart } from '@/components/generic-charts/area'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'
import { chartTickFormatters } from '@/lib/utils'

export function ChartCPUUsage({
  title,
  interval = 'toStartOfTenMinutes',
  lastHours = 24,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const { data, isLoading, error, refresh } = useChartData<{
    event_time: string
    avg_cpu: number
  }>({
    chartName: 'cpu-usage',
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
      data-testid="cpu-usage-chart"
    >
      <AreaChart
        data={data || []}
        index="event_time"
        categories={['avg_cpu']}
        className={chartClassName}
        xAxisLabel="Time"
        yAxisLabel="CPU Usage (seconds)"
        yAxisTickFormatter={chartTickFormatters.duration}
      />
    </ChartCard>
  )
}

export default ChartCPUUsage
