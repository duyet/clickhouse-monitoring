'use client'

import { ArrowUpIcon } from '@radix-ui/react-icons'

import type { ChartProps } from '@/components/charts/chart-props'

import { memo } from 'react'
import { CardMultiMetrics } from '@/components/cards/card-multi-metrics'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export const ChartZookeeperUptime = memo(function ChartZookeeperUptime({
  title = 'Zookeeper Uptime',
  className,
  hostId,
}: ChartProps) {
  const swr = useChartData<{
    uptime: string
  }>({
    chartName: 'zookeeper-uptime',
    hostId,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(dataArray, sql, metadata) => {
        const uptime = dataArray[0] as { uptime: string }

        return (
          <ChartCard
            title={title}
            className={cn('justify-between', className)}
            sql={sql}
            data={dataArray}
            metadata={metadata}
            data-testid="zookeeper-uptime-chart"
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
      }}
    </ChartContainer>
  )
})
