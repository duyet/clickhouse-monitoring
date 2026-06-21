import type { ChartProps } from '@/components/charts/chart-props'

import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import { BarList } from '@/components/charts/primitives/bar-list'
import { REFRESH_INTERVAL, useChartData } from '@/lib/swr'

type DataRow = {
  database: string
  table: string
  replica_name: string
  replication_lag: number
  queue_size: number
  inserts_in_queue: number
  merges_in_queue: number
  active_replicas: number
  total_replicas: number
}

export const ChartReplicationLag = function ChartReplicationLag({
  title,
  className,
  hostId,
}: ChartProps) {
  const swr = useChartData<DataRow>({
    chartName: 'replication-lag',
    hostId,
    refreshInterval: REFRESH_INTERVAL.MEDIUM_30S,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(dataArray, sql, metadata) => {
        const rows = dataArray as DataRow[]
        const barData = rows.map((row) => ({
          name: `${row.database}.${row.table} (${row.replica_name})`,
          value: row.replication_lag,
          formatted: String(row.replication_lag),
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
}

export default ChartReplicationLag
