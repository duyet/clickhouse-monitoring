import { type ChartProps } from '@/components/charts/chart-props'
import { CardMultiMetrics } from '@/components/generic-charts/card-multi-metrics'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchDataWithHost } from '@/lib/clickhouse-helpers'
import { cn } from '@/lib/utils'

export async function ChartReplicationQueueCount({
  title,
  className,
}: ChartProps) {
  const query = `
    SELECT COUNT() as count_all,
           countIf(is_currently_executing) AS count_executing
    FROM system.replication_queue
  `
  const { data } = await fetchDataWithHost<
    {
      count_all: number
      count_executing: number
    }[]
  >({ query })

  const count = data?.[0] || { count_all: 0, count_executing: 0 }

  return (
    <ChartCard
      title={title}
      className={cn('justify-between', className)}
      sql={query}
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
        <div className="text-muted-foreground pl-2 text-sm">
          {count.count_all} in total
        </div>
      </div>
    </ChartCard>
  )
}

export default ChartReplicationQueueCount
