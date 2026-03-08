'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { memo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { BarList } from '@/components/charts/primitives/bar-list'
import { useChartData } from '@/lib/swr'

type DataRow = {
  query_preview: string
  execution_count: number
  peak_memory: number
  readable_peak_memory: string
  avg_memory: number
  readable_avg_memory: string
}

export const ChartTopMemoryQueries = memo(function ChartTopMemoryQueries({
  title,
  className,
  hostId,
}: ChartProps) {
  const swr = useChartData<DataRow>({
    chartName: 'top-memory-queries',
    hostId,
    refreshInterval: 60000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(dataArray, sql, metadata, staleError, mutate) => {
        const rows = dataArray as DataRow[]
        const barData = rows.map((row) => ({
          name: row.query_preview,
          value: row.peak_memory,
          formatted: row.readable_peak_memory,
        }))

        return (
          <ChartCard
            title={title}
            className={className}
            sql={sql}
            data={rows}
            metadata={metadata}
            data-testid="top-memory-queries-chart"
            staleError={staleError}
            onRetry={mutate}
          >
            <BarList data={barData} formatedColumn="formatted" />
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
})

export default ChartTopMemoryQueries
