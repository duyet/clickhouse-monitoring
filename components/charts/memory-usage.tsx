import { type ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/generic-charts/area'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchDataWithHost } from '@/lib/clickhouse-helpers'
import { applyInterval } from '@/lib/clickhouse-query'

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
  const { data } = await fetchDataWithHost<
    {
      event_time: string
      avg_memory: number
      readable_avg_memory: string
    }[]
  >({ query })

  return (
    <ChartCard title={title} className={className} sql={query} data={data || []} data-testid="memory-usage-chart">
      <AreaChart
        data={data || []}
        index="event_time"
        categories={['avg_memory']}
        className={chartClassName}
        colors={['--chart-12']}
      />
    </ChartCard>
  )
}

export default ChartMemoryUsage
