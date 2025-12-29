'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export function ChartQueryDuration({
  title = 'Avg Queries Duration over last 14 days (AVG(duration in seconds) / day)',
  interval = 'toStartOfDay',
  className,
  chartClassName,
  lastHours = 24 * 14,
  hostId,
  ...props
}: ChartProps) {
  const { data, isLoading, error, refresh } = useChartData<{
    event_time: string
    query_duration_ms: number
    query_duration_s: number
  }>({
    chartName: 'query-duration',
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
    <ChartCard title={title} className={className} sql="" data={data || []}>
      <BarChart
        className={cn('h-52', chartClassName)}
        data={data || []}
        index="event_time"
        categories={['query_duration_s']}
        colors={['--chart-rose-200']}
        colorLabel="--foreground"
        stack
        showLegend={false}
        {...props}
      />
    </ChartCard>
  )
}

export default ChartQueryDuration
