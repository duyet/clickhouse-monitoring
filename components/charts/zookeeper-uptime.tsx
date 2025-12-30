'use client'

import { memo } from 'react'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'
import { ChartSkeleton, ChartError } from '@/components/charts'
import { cn } from '@/lib/utils'
import { ArrowUpIcon } from '@radix-ui/react-icons'
import { CardMultiMetrics } from '../generic-charts/card-multi-metrics'

export const ChartZookeeperUptime = memo(function ChartZookeeperUptime({
  title = 'Zookeeper Uptime',
  className,
  hostId,
}: ChartProps) {
  const { data, error, isLoading, refresh, sql } = useChartData<{
    uptime: string
  }>({
    chartName: 'zookeeper-uptime',
    hostId,
    refreshInterval: 30000,
  })

  const dataArray = Array.isArray(data) ? data : undefined

  if (isLoading) {
    return <ChartSkeleton title={title} className={className} />
  }

  if (error) {
    return (
      <ChartError
        title={title}
        error={error}
        onRetry={refresh}
        className={className}
      />
    )
  }

  // Show empty state if no data
  if (!dataArray || dataArray.length === 0) {
    return <ChartEmpty title={title} className={className} />
  }

  const uptime = dataArray[0]

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
              <ArrowUpIcon className="h-6 w-6" />
              {uptime.uptime}
            </span>
          }
          items={[]}
          className="p-2"
        />
        <div className="text-muted-foreground pl-2 text-sm"></div>
      </div>
    </ChartCard>
  )
})
