'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/charts/primitives/area'
import { ChartCard } from '@/components/cards/chart-card'
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
  const swr = useChartData<{
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

  return (
    <ChartContainer swr={swr} title={title} className={className} chartClassName={chartClassName}>
      {(dataArray, sql) => (
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
      )}
    </ChartContainer>
  )
})

export default ChartDisksUsage
