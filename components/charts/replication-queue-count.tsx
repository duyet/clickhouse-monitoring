'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { CardMultiMetrics } from '@/components/generic-charts/card-multi-metrics'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export function ChartReplicationQueueCount({
  title,
  className,
  hostId,
}: ChartProps) {
  const { data, isLoading, error, refresh } = useChartData<{
    count_all: number
    count_executing: number
  }>({
    chartName: 'replication-queue-count',
    hostId,
    refreshInterval: 30000,
  })

  if (isLoading)
    return (
      <ChartSkeleton
        title={title}
        className={className}
      />
    )
  if (error)
    return <ChartError error={error} title={title} onRetry={refresh} />

  const count = data?.[0] || { count_all: 0, count_executing: 0 }

  return (
    <ChartCard
      title={title}
      className={cn('justify-between', className)}
      sql=""
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

export default ChartReplicationQueueCount
