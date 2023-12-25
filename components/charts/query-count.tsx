import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'
import { ChartCard } from '@/components/chart-card'
import { type ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/tremor/area'

export async function ChartQueryCount({
  title,
  interval = 'toStartOfMinute',
  className,
  chartClassName,
  lastHours = 24,
  ...props
}: ChartProps) {
  const sql = `
    SELECT ${interval}(event_time) AS event_time,
           COUNT() AS query_count,
           (
              SELECT groupArray((query_kind, count))
              FROM (
                SELECT query_kind, COUNT() AS count
                FROM system.query_log
                WHERE type = 'QueryFinish'
                      AND ${interval}(event_time) = ${interval}(system.query_log.event_time)
                GROUP BY 1
                ORDER BY 2 DESC
              )
           ) AS breakdown
    FROM system.query_log
    WHERE type = 'QueryFinish'
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1
  `
  const data = await fetchData(sql)

  return (
    <ChartCard title={title} className={className} sql={sql}>
      <AreaChart
        className={cn('h-52', chartClassName)}
        data={data}
        index="event_time"
        categories={['query_count']}
        readable="quantity"
        stack
        breakdown="breakdown"
        showLegend={false}
        {...props}
      />
    </ChartCard>
  )
}

export default ChartQueryCount
