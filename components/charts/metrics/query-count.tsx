import type { ChartProps } from '@/components/charts/chart-props'
import { ErrorAlert } from '@/components/error-alert'
import { AreaChart } from '@/components/charts/base/area'
import { ChartCard } from '@/components/charts/base/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval, fillStep, nowOrToday } from '@/lib/clickhouse-query'
import { cn } from '@/lib/utils'

export async function ChartQueryCount({
  title = 'Running Queries over last 14 days (query / day)',
  interval = 'toStartOfDay',
  className,
  chartClassName,
  chartCardContentClassName,
  lastHours = 24 * 14,
  showXAxis = true,
  showLegend = false,
  showCartesianGrid = true,
  breakdown = 'breakdown',
  hostId,
  ...props
}: ChartProps) {
  const query = `
    WITH event_count AS (
      SELECT ${applyInterval(interval, 'event_time')},
             COUNT() AS query_count
      FROM merge(system, '^query_log')
      WHERE type = 'QueryFinish'
            AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
      GROUP BY event_time
      ORDER BY event_time WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
    ),
    query_kind AS (
      SELECT ${applyInterval(interval, 'event_time')},
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
  const { data, error } = await fetchData<
    {
      event_time: string
      query_count: number
      breakdown: Array<[string, number] | Record<string, string>>
    }[]
  >({ query, hostId })

  if (error) return <ErrorAlert {...error} />
  if (!data) return null

  return (
    <ChartCard
      title={title}
      className={className}
      contentClassName={chartCardContentClassName}
      sql={query}
      data={data || []}
      data-testid="query-count-chart"
    >
      <AreaChart
        className={cn('h-52', chartClassName)}
        data={data || []}
        index="event_time"
        categories={['query_count']}
        readable="quantity"
        stack
        showLegend={showLegend}
        showXAxis={showXAxis}
        showCartesianGrid={showCartesianGrid}
        colors={['--chart-yellow']}
        breakdown={breakdown}
        breakdownLabel="query_kind"
        breakdownValue="count"
        {...props}
      />
    </ChartCard>
  )
}

export default ChartQueryCount
