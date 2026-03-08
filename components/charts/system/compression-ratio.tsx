'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { memo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { BarList } from '@/components/charts/primitives/bar-list'
import { useChartData } from '@/lib/swr'

type DataRow = {
  table_path: string
  compressed_size: string
  uncompressed_size: string
  compression_ratio: number
  readable_rows: string
}

export const ChartCompressionRatio = memo(function ChartCompressionRatio({
  title,
  className,
  hostId,
}: ChartProps) {
  const swr = useChartData<DataRow>({
    chartName: 'compression-ratio',
    hostId,
    refreshInterval: 300000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(dataArray, sql, metadata) => {
        const rows = dataArray as DataRow[]
        const barData = rows.map((row) => ({
          name: row.table_path,
          value: row.compression_ratio,
          formatted: `${row.compression_ratio}x (${row.compressed_size} → ${row.uncompressed_size})`,
        }))

        return (
          <ChartCard
            title={title}
            className={className}
            sql={sql}
            data={rows}
            metadata={metadata}
          >
            <BarList data={barData} formatedColumn="formatted" />
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
})

export default ChartCompressionRatio
