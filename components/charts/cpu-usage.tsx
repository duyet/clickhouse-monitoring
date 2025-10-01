import { type ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/generic-charts/area'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval } from '@/lib/clickhouse-query'

export async function ChartCPUUsage({
  title,
  interval = 'toStartOfTenMinutes',
  lastHours = 24,
  className,
  chartClassName,
}: ChartProps) {
  const query = `
    SELECT
       ${applyInterval(interval, 'event_time')},
       avg(ProfileEvent_OSCPUVirtualTimeMicroseconds) / 1000000 as avg_cpu
    FROM merge(system, '^metric_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1`

  const { data } = await fetchData<{ event_time: string; avg_cpu: number }[]>({
    query,
  })

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
        categories={['avg_cpu']}
        className={chartClassName}
      />
    </ChartCard>
  )
}

export default ChartCPUUsage
