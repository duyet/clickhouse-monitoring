import { ChartCard } from '@/components/chart-card'
import { type ChartProps } from '@/components/charts/chart-props'
import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'

import { CardMultiMetrics } from '../tremor/card-multi-metrics'

export async function ChartReplicationQueueCount({
  title,
  className,
}: ChartProps) {
  const sql = `
    SELECT COUNT() as count_all,
           countIf(is_currently_executing) AS count_executing
    FROM system.replication_queue
  `
  const rows = await fetchData(sql)
  const count = rows?.[0] || { count_all: 0, count_executing: 0 }

  return (
    <ChartCard
      title={title}
      className={cn('justify-between', className)}
      sql={sql}
    >
      <div className="flex flex-col justify-between p-0">
        <CardMultiMetrics
          primary={
            <span className="flex flex-row items-center gap-2">
              {count.count_executing} executing
            </span>
          }
          items={[]}
          className="p-2"
        />
        <div className="pl-2 text-sm text-muted-foreground">
          {count.count_all} in total
        </div>
      </div>
    </ChartCard>
  )
}

export default ChartReplicationQueueCount
