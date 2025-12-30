'use client'

import { memo } from 'react'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartSkeleton } from '@/components/skeletons'
import { CardMultiMetrics } from '@/components/cards/card-multi-metrics'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export const ChartReplicationQueueCount = memo(
  function ChartReplicationQueueCount({
    title,
    className,
    hostId,
  }: ChartProps) {
    const { data, isLoading, error, refresh, sql } = useChartData<{
      count_all: number
      count_executing: number
    }>({
      chartName: 'replication-queue-count',
      hostId,
      refreshInterval: 30000,
    })

    const dataArray = Array.isArray(data) ? data : undefined

    if (isLoading) return <ChartSkeleton title={title} className={className} />
    if (error)
      return <ChartError error={error} title={title} onRetry={refresh} />

    // Show empty state if no data
    if (!dataArray || dataArray.length === 0) {
      return <ChartEmpty title={title} className={className} />
    }

    const count = dataArray[0]

    return (
      <ChartCard
        title={title}
        className={cn('justify-between', className)}
        sql={sql}
      >
        <div className="flex flex-col justify-between p-0">
          <CardMultiMetrics
            primary={
              <span className="flex flex-row items-center gap-2">
                {count.count_executing} executing
              </span>
            }
            items={[]}
            className="p-2"
          />
          <div className="text-muted-foreground pl-2 text-sm">
            {count.count_all} in total
          </div>
        </div>
      </ChartCard>
    )
  }
)

export default ChartReplicationQueueCount
