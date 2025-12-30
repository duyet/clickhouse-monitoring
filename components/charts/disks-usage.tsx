'use client'

import { memo } from 'react'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { AreaChart } from '@/components/generic-charts/area'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export const ChartDisksUsage = memo(function ChartDisksUsage({
  title = 'Disks Usage over last 30 days',
  interval = 'toStartOfDay',
  className,
  chartClassName,
  lastHours = 24 * 30,
  hostId,
  ...props
}: ChartProps) {
  const { data, isLoading, error, refresh, sql } = useChartData<{
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

  const dataArray = Array.isArray(data) ? data : undefined

  if (isLoading)
    return (
      <ChartSkeleton
        title={title}
        className={className}
        chartClassName={chartClassName}
      />
    )
  if (error) return <ChartError error={error} title={title} onRetry={refresh} />

  // Show empty state if no data
  if (!dataArray || dataArray.length === 0) {
    return <ChartEmpty title={title} className={className} />
  }

  return (
    <ChartCard
      title={title}
      className={className}
      sql={sql}
      data={dataArray}
      data-testid="disk-usage-chart"
    >
      <AreaChart
        className={cn('h-52', chartClassName)}
        data={dataArray}
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
})

export default ChartDisksUsage
