import type { ChartProps } from '@/components/charts/chart-props'
import { ErrorAlert } from '@/components/error-alert'
import { AreaChart } from '@/components/charts/base/area'
import { ChartCard } from '@/components/charts/base/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval } from '@/lib/clickhouse-query'
import { chartTickFormatters } from '@/lib/utils'

export async function ChartMemoryUsage({
  title,
  interval = 'toStartOfTenMinutes',
  lastHours = 24,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const query = `
    SELECT ${applyInterval(interval, 'event_time')},
           avg(CurrentMetric_MemoryTracking) AS avg_memory,
           formatReadableSize(avg_memory) AS readable_avg_memory
    FROM merge(system, '^metric_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1 ASC`
  const { data, error } = await fetchData<
    {
      event_time: string
      avg_memory: number
      readable_avg_memory: string
    }[]
  >({ query, hostId })

  if (error) return <ErrorAlert {...error} />
  if (!data) return null

  return (
    <ChartCard
      title={title}
      className={className}
      sql={query}
      data={data || []}
      data-testid="memory-usage-chart"
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
