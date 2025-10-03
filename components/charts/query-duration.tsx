import { type ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval, fillStep, nowOrToday } from '@/lib/clickhouse-query'
import { getScopedLink } from '@/lib/scoped-link'
import { cn } from '@/lib/utils'

export async function ChartQueryDuration({
  title = 'Avg Queries Duration over last 14 days (AVG(duration in seconds) / day)',
  interval = 'toStartOfDay',
  className,
  chartClassName,
  lastHours = 24 * 14,
  hostId,
  ...props
}: ChartProps) {
  const query = `
    SELECT ${applyInterval(interval, 'event_time')},
           AVG(query_duration_ms) AS query_duration_ms,
           ROUND(query_duration_ms / 1000, 2) AS query_duration_s
    FROM merge(system, '^query_log')
    WHERE type = 'QueryFinish'
          AND query_kind = 'Select'
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY event_time
    ORDER BY event_time ASC
    WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `
  const { data } = await fetchData<
    {
      event_time: string
      query_duration_ms: number
      query_duration_s: number
    }[]
  >({
    query,
    clickhouse_settings: {
      use_query_cache: 1,
      query_cache_ttl: 300,
      query_cache_system_table_handling: 'save',
      query_cache_nondeterministic_function_handling: 'save',
    },
    hostId,
  })

  return (
    <ChartCard
      title={title}
      className={className}
      sql={query}
      data={data || []}
    >
      <BarChart
        className={cn('h-52', chartClassName)}
        data={data || []}
        index="event_time"
        categories={['query_duration_s']}
        colors={['--chart-rose-200']}
        colorLabel="--foreground"
        stack
        showLegend={false}
        onClickHref={await getScopedLink(
          '/history-queries?event_time=[event_time]'
        )}
        {...props}
      />
    </ChartCard>
  )
}

export default ChartQueryDuration
