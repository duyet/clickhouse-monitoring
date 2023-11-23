import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'
import { ChartCard } from '@/components/chart-card'
import type { ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/tremor'

export async function ChartQueryCount({
  title,
  interval = 'toStartOfMinute',
  className,
  chartClassName,
  lastHours = 24,
  ...props
}: ChartProps) {
  const data = await fetchData(`
    SELECT ${interval}(event_time) AS event_time,
           COUNT() AS query_count
    FROM system.query_log
    WHERE type = 'QueryFinish'
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1
  `)

  return (
    <ChartCard title={title} className={className}>
      <AreaChart
        className={cn('h-52', chartClassName)}
        data={data}
        index="event_time"
        categories={['query_count']}
        readable="quantity"
        stack
        {...props}
      />
    </ChartCard>
  )
}

export default ChartQueryCount
