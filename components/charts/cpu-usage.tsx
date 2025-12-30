'use client'

import { memo } from 'react'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartSkeleton } from '@/components/skeletons'
import { AreaChart } from '@/components/generic-charts/area'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'
import { chartTickFormatters } from '@/lib/utils'

export const ChartCPUUsage = memo(function ChartCPUUsage({
  title,
  interval = 'toStartOfTenMinutes',
  lastHours = 24,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const { data, isLoading, error, refresh, sql } = useChartData<{
    event_time: string
    avg_cpu: number
  }>({
    chartName: 'cpu-usage',
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
      data-testid="cpu-usage-chart"
    >
      <AreaChart
        data={dataArray}
        index="event_time"
        categories={['avg_cpu']}
        className={chartClassName}
        yAxisTickFormatter={chartTickFormatters.duration}
      />
    </ChartCard>
  )
})

export default ChartCPUUsage
