import { type ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/generic-charts/area'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval } from '@/lib/clickhouse-query'
import { cn } from '@/lib/utils'

export async function ChartFailedQueryCount({
  title,
  interval = 'toStartOfMinute',
  className,
  chartClassName,
  chartCardContentClassName,
  lastHours = 24,
  showXAxis = true,
  showLegend = false,
  showCartesianGrid = true,
  breakdown = 'breakdown',
  ...props
}: ChartProps) {
  const query = `
    WITH event_count AS (
      SELECT ${applyInterval(interval, 'event_time')},
             COUNT() AS query_count
      FROM merge(system, '^query_log')
      WHERE
            type IN ['ExceptionBeforeStart', 'ExceptionWhileProcessing']
            AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
      GROUP BY 1
      ORDER BY 1
    ),
    query_type AS (
        SELECT ${applyInterval(interval, 'event_time')},
               type AS query_type,
               COUNT() AS count
        FROM merge(system, '^query_log')
        WHERE
              type IN ['ExceptionBeforeStart', 'ExceptionWhileProcessing']
              AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
        GROUP BY 1, 2
        ORDER BY 3 DESC
    ),
    breakdown AS (
      SELECT event_time,
             groupArray((query_type, count)) AS breakdown
      FROM query_type
      GROUP BY 1
    )
    SELECT event_time,
           query_count,
           breakdown.breakdown AS breakdown
    FROM event_count
    LEFT JOIN breakdown USING event_time
    ORDER BY 1
  `
  const { data } = await fetchData<
    {
      event_time: string
      query_count: number
      breakdown: Array<[string, number] | Record<string, string>>
    }[]
  >({ query })

  return (
    <ChartCard
      title={title}
      className={className}
      contentClassName={chartCardContentClassName}
      sql={query}
      data={data}
    >
      <AreaChart
        className={cn('h-52', chartClassName)}
        data={data}
        index="event_time"
        categories={['query_count']}
        readable="quantity"
        stack
        showLegend={showLegend}
        showXAxis={showXAxis}
        showCartesianGrid={showCartesianGrid}
        colors={['--chart-1']}
        breakdown={breakdown}
        breakdownLabel="query_type"
        breakdownValue="count"
        {...props}
      />
    </ChartCard>
  )
}

export default ChartFailedQueryCount
