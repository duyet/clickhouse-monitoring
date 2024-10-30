import { type ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval } from '@/lib/clickhouse-query'
import { getScopedLink } from '@/lib/scoped-link'
import { cn } from '@/lib/utils'

export async function ChartQueryMemory({
  title = 'Avg Memory Usage for queries over last 14 days',
  interval = 'toStartOfDay',
  className,
  chartClassName,
  lastHours = 24 * 14,
  ...props
}: ChartProps) {
  const query = `
    SELECT ${applyInterval(interval, 'event_time')},
           AVG(memory_usage) AS memory_usage,
           formatReadableSize(memory_usage) AS readable_memory_usage
    FROM merge(system, '^query_log')
    WHERE type = 'QueryFinish'
          AND query_kind = 'Select'
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY event_time
    ORDER BY event_time ASC
  `
  const { data } = await fetchData<
    {
      event_time: string
      memory_usage: number
      readable_memory_usage: string
    }[]
  >({ query })

  return (
    <ChartCard title={title} className={className} sql={query} data={data}>
      <BarChart
        className={cn('h-52', chartClassName)}
        data={data}
        index="event_time"
        categories={['memory_usage']}
        readableColumn="readable_memory_usage"
        stack
        showLegend={false}
        showLabel={false}
        colors={['--chart-indigo-300']}
        onClickHref={await getScopedLink(
          '/history-queries?event_time=[event_time]'
        )}
        {...props}
      />
    </ChartCard>
  )
}

export default ChartQueryMemory
