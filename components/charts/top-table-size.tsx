'use client'

import { memo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarList } from '@/components/charts/primitives/bar-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useChartData } from '@/lib/swr'

type DataRow = {
  table: string
  compressed_bytes: number
  uncompressed_bytes: number
  compressed: string
  uncompressed: string
  compr_rate: number
  total_rows: number
  readable_total_rows: string
  part_count: number
}

export const ChartTopTableSize = memo(function ChartTopTableSize({
  title,
  className,
  hostId,
}: ChartProps) {
  const limit = 7
  const swr = useChartData<DataRow>({
    chartName: 'top-table-size',
    hostId,
    params: { limit },
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(dataArray, sql) => {
        // For this chart, we need to separate by-size and by-count logic
        // Since the API only returns one query result, we'll use the same data
        // In a real scenario, you might want to create two separate chart endpoints
        const dataTopBySize = dataArray.map((row) => ({
          name: row.table as string,
          value: row.compressed_bytes as number,
          formatted: row.compressed as string,
        }))

        const dataTopByCount = dataArray.map((row) => ({
          name: row.table as string,
          value: row.total_rows as number,
          formatted: row.readable_total_rows as string,
        }))

        return (
          <ChartCard
            title={title}
            className={className}
            sql={sql}
            data={dataArray}
            data-testid="top-table-size-chart"
          >
            <Tabs defaultValue="by-size">
              <TabsList className="mb-5">
                <TabsTrigger key="by-size" value="by-size">
                  Top tables by Size
                </TabsTrigger>
                <TabsTrigger key="by-count" value="by-count">
                  Top tables by Row Count
                </TabsTrigger>
              </TabsList>
              <TabsContent value="by-size">
                <BarList data={dataTopBySize} formatedColumn="formatted" />
              </TabsContent>
              <TabsContent value="by-count">
                <BarList data={dataTopByCount} formatedColumn="formatted" />
              </TabsContent>
            </Tabs>
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
})

export default ChartTopTableSize
