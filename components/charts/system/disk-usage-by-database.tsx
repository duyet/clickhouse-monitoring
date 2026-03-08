'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { memo, useId } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { BarList } from '@/components/charts/primitives/bar-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useChartData } from '@/lib/swr'

type DataRow = {
  database: string
  total_bytes: number
  readable_size: string
  total_rows: number
  readable_rows: string
  part_count: number
}

export const ChartDiskUsageByDatabase = memo(function ChartDiskUsageByDatabase({
  title,
  className,
  hostId,
}: ChartProps) {
  const tabsId = useId()
  const swr = useChartData<DataRow>({
    chartName: 'disk-usage-by-database',
    hostId,
    refreshInterval: 60000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(dataArray, sql, metadata, staleError, mutate) => {
        const rows = dataArray as DataRow[]

        const dataBySize = rows.map((row) => ({
          name: row.database,
          value: row.total_bytes,
          formatted: row.readable_size,
        }))

        const dataByRows = rows.map((row) => ({
          name: row.database,
          value: row.total_rows,
          formatted: row.readable_rows,
        }))

        return (
          <ChartCard
            title={title}
            className={className}
            sql={sql}
            data={dataArray}
            metadata={metadata}
            data-testid="disk-usage-by-database-chart"
            staleError={staleError}
            onRetry={mutate}
          >
            <Tabs
              id={tabsId}
              defaultValue="by-size"
              className="overflow-hidden"
            >
              <TabsList className="h-11 sm:h-9 gap-1 mb-3 p-1">
                <TabsTrigger
                  key="by-size"
                  value="by-size"
                  className="!h-auto min-h-10 sm:min-h-0 px-3 sm:px-2 py-2 sm:py-1"
                >
                  By Disk Size
                </TabsTrigger>
                <TabsTrigger
                  key="by-rows"
                  value="by-rows"
                  className="!h-auto min-h-10 sm:min-h-0 px-3 sm:px-2 py-2 sm:py-1"
                >
                  By Row Count
                </TabsTrigger>
              </TabsList>
              <TabsContent value="by-size" className="overflow-hidden">
                <BarList data={dataBySize} formatedColumn="formatted" />
              </TabsContent>
              <TabsContent value="by-rows" className="overflow-hidden">
                <BarList data={dataByRows} formatedColumn="formatted" />
              </TabsContent>
            </Tabs>
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
})

export default ChartDiskUsageByDatabase
