'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export function PageViewBarChart({
  title = 'Daily Page Views',
  interval = 'toStartOfDay',
  className,
  chartClassName,
  chartCardContentClassName,
  lastHours = 24 * 14,
  showXAxis = true,
  showYAxis = true,
  showLegend = false,
  colors = ['--chart-indigo-300'],
  hostId,
  ...props
}: ChartProps & { colors?: string[] }) {
  const { data, isLoading, error, refresh } = useChartData<{
    event_time: string
    page_views: number
  }>({
    chartName: 'page-view',
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
        chartClassName={cn('h-52', chartClassName)}
      />
    )
  if (error) return <ChartError error={error} title={title} onRetry={refresh} />

  return (
    <ChartCard
      title={title}
      className={className}
      contentClassName={chartCardContentClassName}
      sql=""
      data={data || []}
    >
      <BarChart
        className={cn('h-52', chartClassName)}
        data={data || []}
        index="event_time"
        categories={['page_views']}
        readable="quantity"
        showLegend={showLegend}
        showXAxis={showXAxis}
        showYAxis={showYAxis}
        showLabel={true}
        colors={colors}
        {...props}
      />
    </ChartCard>
  )
}

export default PageViewBarChart
