import type { ChartProps } from '@/components/charts/chart-props'

import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { BarList } from '@/components/charts/primitives/bar-list'
import { REFRESH_INTERVAL, useChartData } from '@/lib/swr'

type DataRow = {
  status: string
  count: number
}

export const ChartDictionaryCount = function ChartDictionaryCount({
  title,
  className,
  hostId,
}: ChartProps) {
  const swr = useChartData<DataRow>({
    chartName: 'dictionary-count',
    hostId,
    refreshInterval: REFRESH_INTERVAL.MEDIUM_30S,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(rows, sql, metadata) => {
        const barData = rows.map((row) => ({
          name: row.status,
          value: Number(row.count),
        }))

        return (
          <ChartCard
            title={title}
            className={className}
            sql={sql}
            data={rows}
            metadata={metadata}
            data-testid="dictionary-count-chart"
          >
            <BarList data={barData} />
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
}
