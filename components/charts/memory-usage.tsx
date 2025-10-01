import { type ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/generic-charts/area'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval } from '@/lib/clickhouse-query'
import { chartTickFormatters } from '@/lib/utils'

export async function ChartMemoryUsage({
  title,
  interval = 'toStartOfTenMinutes',
  lastHours = 24,
  className,
  chartClassName,
}: ChartProps) {
  const query = `
    SELECT ${applyInterval(interval, 'event_time')},
           avg(CurrentMetric_MemoryTracking) AS avg_memory,
           formatReadableSize(avg_memory) AS readable_avg_memory
    FROM merge(system, '^metric_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1 ASC`
  const { data } = await fetchData<
    {
      event_time: string
      avg_memory: number
      readable_avg_memory: string
    }[]
  >({ query })

  return (
    <ChartCard
      title={title}
      className={className}
      sql={query}
      data={data || []}
    >
      <AreaChart
        data={data || []}
        index="event_time"
        categories={['avg_memory']}
        className={chartClassName}
        colors={['--chart-12']}
        xAxisLabel="Time"
        yAxisLabel="Memory Usage"
        yAxisTickFormatter={chartTickFormatters.bytes}
      />
    </ChartCard>
  )
}

export default ChartMemoryUsage
