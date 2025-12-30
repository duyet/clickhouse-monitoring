'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/charts/primitives/bar'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'

export const ChartMergeSumReadRows = memo(function ChartMergeSumReadRows({
  title,
  interval = 'toStartOfDay',
  lastHours = 24 * 14,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const swr = useChartData<{
    event_time: string
    sum_read_rows: number
    sum_read_rows_scale: number
    readable_sum_read_rows: string
  }>({
    chartName: 'merge-sum-read-rows',
    hostId,
    interval,
    lastHours,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className} chartClassName={chartClassName}>
      {(dataArray, sql) => (
        <ChartCard title={title} className={className} sql={sql} data={dataArray} data-testid="merge-sum-read-rows-chart">
          <BarChart
            data={dataArray}
            index="event_time"
            categories={['sum_read_rows_scale']}
            readableColumn="readable_sum_read_rows"
            labelPosition="inside"
            labelAngle={-90}
            colorLabel="--foreground"
            className={chartClassName}
            colors={['--chart-indigo-300']}
            autoMinValue={true}
            relative={false}
            allowDecimals={true}
          />
        </ChartCard>
      )}
    </ChartContainer>
  )
})

export default ChartMergeSumReadRows
