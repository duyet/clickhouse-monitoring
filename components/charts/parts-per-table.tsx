'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { memo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { BarList } from '@/components/charts/primitives/bar-list'
import { useChartData } from '@/lib/swr'

type DataRow = {
  table_path: string
  part_count: number
  readable_part_count: string
  total_rows: number
  readable_size: string
}

export const ChartPartsPerTable = memo(function ChartPartsPerTable({
  title,
  className,
  hostId,
}: ChartProps) {
  const swr = useChartData<DataRow>({
    chartName: 'parts-per-table',
    hostId,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(dataArray, sql, metadata) => {
        const barData = dataArray.map((row) => ({
          name: row.table_path as string,
          value: row.part_count as number,
          formatted: row.readable_part_count as string,
        }))

        return (
          <ChartCard
            title={title}
            className={className}
            sql={sql}
            data={dataArray}
            metadata={metadata}
            data-testid="parts-per-table-chart"
          >
            <BarList data={barData} formatedColumn="formatted" />
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
})

export default ChartPartsPerTable
