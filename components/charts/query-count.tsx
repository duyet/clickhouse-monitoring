import { type ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/generic-charts/area'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchDataWithCache } from '@/lib/clickhouse-cache'
import { cn } from '@/lib/utils'

export async function ChartQueryCount({
  title,
  interval = 'toStartOfMinute',
  className,
  chartClassName,
  lastHours = 24,
  ...props
}: ChartProps) {
  const query = `
    WITH event_count AS (
      SELECT ${interval}(event_time) AS event_time,
             COUNT() AS query_count
      FROM merge(system, '^query_log')
      WHERE type = 'QueryFinish'
            AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
      GROUP BY 1
      ORDER BY 1
    ),
    query_kind AS (
        SELECT ${interval}(event_time) AS event_time,
               query_kind,
               COUNT() AS count
        FROM merge(system, '^query_log')
        WHERE type = 'QueryFinish'
              AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
        GROUP BY 1, 2
        ORDER BY 3 DESC
    ),
    breakdown AS (
      SELECT event_time,
             groupArray((query_kind, count)) AS breakdown
      FROM query_kind
      GROUP BY 1
    )
    SELECT event_time,
           query_count,
           breakdown.breakdown AS breakdown
    FROM event_count
    LEFT JOIN breakdown USING event_time
    ORDER BY 1
  `
  const { data } = await fetchDataWithCache<
    {
      event_time: string
      query_count: number
      breakdown: Array<[string, number] | Record<string, string>>
    }[]
  >({ query })

  return (
    <ChartCard title={title} className={className} sql={query} data={data}>
      <AreaChart
        className={cn('h-52', chartClassName)}
        data={data}
        index="event_time"
        categories={['query_count']}
        readable="quantity"
        stack
        showLegend={false}
        colors={['--chart-yellow']}
        breakdown="breakdown"
        breakdownLabel="query_kind"
        breakdownValue="count"
        {...props}
      />
    </ChartCard>
  )
}

export default ChartQueryCount
