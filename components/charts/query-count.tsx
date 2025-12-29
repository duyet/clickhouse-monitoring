'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { AreaChart } from '@/components/generic-charts/area'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export function ChartQueryCount({
  title = 'Running Queries over last 14 days (query / day)',
  interval = 'toStartOfDay',
  className,
  chartClassName,
  chartCardContentClassName,
  lastHours = 24 * 14,
  showXAxis = true,
  showLegend = false,
  showCartesianGrid = true,
  breakdown = 'breakdown',
  hostId,
  ...props
}: ChartProps) {
  const { data, isLoading, error, refresh } = useChartData<{
    event_time: string
    query_count: number
    breakdown: Array<[string, number] | Record<string, string>>
  }>({
    chartName: 'query-count',
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
    <ChartCard
      title={title}
      className={className}
      contentClassName={chartCardContentClassName}
      sql=""
      data={data || []}
      data-testid="query-count-chart"
    >
      <AreaChart
        className={cn('h-52', chartClassName)}
        data={data || []}
        index="event_time"
        categories={['query_count']}
        readable="quantity"
        stack
        showLegend={showLegend}
        showXAxis={showXAxis}
        showCartesianGrid={showCartesianGrid}
        colors={['--chart-yellow']}
        breakdown={breakdown}
        breakdownLabel="query_kind"
        breakdownValue="count"
        {...props}
      />
    </ChartCard>
  )
}

export default ChartQueryCount
