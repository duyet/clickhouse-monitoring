'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { memo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { BarList } from '@/components/charts/primitives/bar-list'
import { useChartData } from '@/lib/swr'

type DataRow = {
  table_path: string
  partition: string
  part_count: number
  readable_part_count: string
  total_rows: number
  readable_rows: string
  total_bytes: number
  readable_size: string
}

// ClickHouse too_many_parts threshold is typically 300 parts per partition.
// Health bands: green < 150, amber 150-300, red >= 300
function partHealthLabel(count: number): string {
  if (count >= 300) return 'critical'
  if (count >= 150) return 'warning'
  return 'healthy'
}

export const ChartPartitionPartHealth = memo(function ChartPartitionPartHealth({
  title,
  className,
  hostId,
}: ChartProps) {
  const swr = useChartData<DataRow>({
    chartName: 'partition-part-health',
    hostId,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(dataArray, sql, metadata) => {
        const rows = dataArray as DataRow[]
        const barData = rows.map((row) => ({
          name: `${row.table_path} :: ${row.partition}`,
          value: row.part_count,
          formatted: `${row.readable_part_count} parts · ${row.readable_rows} rows · ${row.readable_size}`,
          health: partHealthLabel(row.part_count),
        }))

        return (
          <ChartCard
            title={title}
            className={className}
            sql={sql}
            data={rows}
            metadata={metadata}
            data-testid="partition-part-health-chart"
          >
            <BarList data={barData} formatedColumn="formatted" />
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
})

export default ChartPartitionPartHealth
