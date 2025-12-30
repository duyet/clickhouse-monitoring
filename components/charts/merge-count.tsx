'use client'

import { ArrowRightIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import { memo } from 'react'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { AreaChart } from '@/components/generic-charts/area'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export const ChartMergeCount = memo(function ChartMergeCount({
  title,
  interval = 'toStartOfFiveMinutes',
  lastHours = 12,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const { data, isLoading, error, refresh, sql } = useChartData<{
    event_time: string
    avg_CurrentMetric_Merge: number
    avg_CurrentMetric_PartMutation: number
  }>({
    chartName: 'merge-count',
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
      className={cn('justify-between', className)}
      contentClassName="flex flex-col justify-between"
      sql={sql}
      data={dataArray}
    >
      <AreaChart
        className={cn('h-52', chartClassName)}
        data={dataArray}
        index="event_time"
        categories={[
          'avg_CurrentMetric_Merge',
          'avg_CurrentMetric_PartMutation',
        ]}
        readable="quantity"
      />

      <div className="text-muted-foreground flex flex-row justify-between gap-2 text-right text-sm">
        <Link
          href={`/merges?host=${hostId}`}
          className="flex flex-row items-center gap-2"
        >
          Merges
          <ArrowRightIcon className="size-3" />
        </Link>
        <Link
          href={`/mutations?host=${hostId}`}
          className="flex flex-row items-center gap-2"
        >
          Mutations
          <ArrowRightIcon className="size-3" />
        </Link>
      </div>
    </ChartCard>
  )
})

export default ChartMergeCount
