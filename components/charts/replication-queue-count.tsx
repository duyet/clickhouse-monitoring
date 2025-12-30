'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
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
    const swr = useChartData<{
      count_all: number
      count_executing: number
    }>({
      chartName: 'replication-queue-count',
      hostId,
      refreshInterval: 30000,
    })

    return (
      <ChartContainer swr={swr} title={title} className={className}>
        {(dataArray, sql) => {
          const count = dataArray[0] as {
            count_all: number
            count_executing: number
          }

          return (
            <ChartCard
              title={title}
              className={cn('justify-between', className)}
              sql={sql}
              data={dataArray}
              data-testid="replication-queue-count-chart"
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
        }}
      </ChartContainer>
    )
  }
)

export default ChartReplicationQueueCount
