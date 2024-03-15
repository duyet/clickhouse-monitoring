import { ChartCard } from '@/components/chart-card'
import { type ChartProps } from '@/components/charts/chart-props'
import {
  CardMultiMetrics,
  type CardMultiMetricsProps,
} from '@/components/tremor/card-multi-metrics'
import { fetchData } from '@/lib/clickhouse'

export async function ChartSummaryUsedByMutations({
  title,
  className,
}: ChartProps) {
  const sql = `
    SELECT COUNT() as running_count
    FROM system.mutations
    WHERE is_done = 0
  `
  const rows = await fetchData(sql)
  const count = rows?.[0] || { running_count: 0 }

  const items: CardMultiMetricsProps['items'] = []

  return (
    <ChartCard title={title} className={className} sql={sql}>
      <div className="flex flex-col justify-between p-0">
        <CardMultiMetrics
          primary={
            <span className="flex flex-row items-center gap-2">
              {count.running_count} running mutations
            </span>
          }
          items={items}
          className="p-2"
        />
      </div>
    </ChartCard>
  )
}

export default ChartSummaryUsedByMutations
