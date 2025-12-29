'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { AreaChart } from '@/components/generic-charts/area'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export function ChartDisksUsage({
  title = 'Disks Usage over last 30 days',
  interval = 'toStartOfDay',
  className,
  chartClassName,
  lastHours = 24 * 30,
  hostId,
  ...props
}: ChartProps) {
  const { data, isLoading, error, refresh } = useChartData<{
    event_time: string
    DiskAvailable_default: number
    DiskUsed_default: number
    readable_DiskAvailable_default: string
    readable_DiskUsed_default: string
  }>({
    chartName: 'disks-usage',
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
      sql=""
      data={data || []}
      data-testid="disk-usage-chart"
    >
      <AreaChart
        className={cn('h-52', chartClassName)}
        data={data || []}
        index="event_time"
        categories={['DiskAvailable_default', 'DiskUsed_default']}
        readableColumns={[
          'readable_DiskAvailable_default',
          'readable_DiskUsed_default',
        ]}
        stack
        {...props}
      />
    </ChartCard>
  )
}

export default ChartDisksUsage
