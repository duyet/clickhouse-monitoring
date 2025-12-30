'use client'

import { memo } from 'react'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { BarList } from '@/components/generic-charts/bar-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useChartData } from '@/lib/swr'

export const ChartTopTableSize = memo(function ChartTopTableSize({
  title,
  className,
  hostId,
}: ChartProps) {
  const limit = 7
  const { data, isLoading, error, refresh, sql } = useChartData<{
    table: string
    compressed_bytes: number
    uncompressed_bytes: number
    compressed: string
    uncompressed: string
    compr_rate: number
    total_rows: number
    readable_total_rows: string
    part_count: number
  }>({
    chartName: 'top-table-size',
    hostId,
    params: { limit },
    refreshInterval: 30000,
  })

  const dataArray = Array.isArray(data) ? data : undefined

  if (isLoading) return <ChartSkeleton title={title} className={className} />
  if (error) return <ChartError error={error} title={title} onRetry={refresh} />

  // Show empty state if no data
  if (!dataArray || dataArray.length === 0) {
    return <ChartEmpty title={title} className={className} />
  }

  // For this chart, we need to separate by-size and by-count logic
  // Since the API only returns one query result, we'll use the same data
  // In a real scenario, you might want to create two separate chart endpoints
  const dataTopBySize = dataArray.map((row) => ({
    name: row.table,
    value: row.compressed_bytes,
    compressed: row.compressed,
  }))

  const dataTopByCount = dataArray.map((row) => ({
    name: row.table,
    value: row.total_rows,
    readable_total_rows: row.readable_total_rows,
  }))

  return (
    <ChartCard title={title} className={className} sql={sql} data={dataArray}>
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
          <BarList
            data={dataTopBySize}
            formatedColumn="compressed"
          />
        </TabsContent>
        <TabsContent value="by-count">
          <BarList
            data={dataTopByCount}
            formatedColumn="readable_total_rows"
          />
        </TabsContent>
      </Tabs>
    </ChartCard>
  )
})

export default ChartTopTableSize
