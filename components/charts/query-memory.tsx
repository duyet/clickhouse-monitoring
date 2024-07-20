import { type ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'

export async function ChartQueryMemory({
  title,
  interval = 'toStartOfHour',
  className,
  chartClassName,
  lastHours = 24 * 7,
  ...props
}: ChartProps) {
  const query = `
    SELECT ${interval}(event_time) AS event_time,
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
    <ChartCard title={title} className={className} sql={query}>
      <BarChart
        className={cn('h-52', chartClassName)}
        data={data}
        index="event_time"
        categories={['memory_usage']}
        readableColumn="readable_memory_usage"
        stack
        showLegend={false}
        colors={['--chart-indigo-300']}
        {...props}
      />
    </ChartCard>
  )
}

export default ChartQueryMemory
