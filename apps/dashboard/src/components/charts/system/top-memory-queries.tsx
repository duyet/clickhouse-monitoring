import type { ChartProps } from '@/components/charts/chart-props'

import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { BarList } from '@/components/charts/primitives/bar-list'
import { REFRESH_INTERVAL, useChartData } from '@/lib/swr'

type DataRow = {
  query_preview: string
  execution_count: number
  peak_memory: number
  readable_peak_memory: string
  avg_memory: number
  readable_avg_memory: string
}

export const ChartTopMemoryQueries = function ChartTopMemoryQueries({
  title,
  className,
  chartCardContentClassName,
  hostId,
}: ChartProps) {
  const swr = useChartData<DataRow>({
    chartName: 'top-memory-queries',
    hostId,
    refreshInterval: REFRESH_INTERVAL.DEFAULT_60S,
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
            contentClassName={chartCardContentClassName}
          >
            <div className="min-h-0 flex-1 overflow-auto">
              <BarList data={barData} formatedColumn="formatted" />
            </div>
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
}

export default ChartTopMemoryQueries
