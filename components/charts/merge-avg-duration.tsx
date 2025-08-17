import { type ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval, fillStep, nowOrToday } from '@/lib/clickhouse-query'
import { getHostIdCookie } from '@/lib/scoped-link'

export async function ChartMergeAvgDuration({
  title,
  interval = 'toStartOfDay',
  lastHours = 24 * 14,
  className,
  chartClassName,
}: ChartProps) {
  const hostId = await getHostIdCookie()
  const query = `
    SELECT
        ${applyInterval(interval, 'event_time')},
        AVG(duration_ms) AS avg_duration_ms,
        formatReadableTimeDelta(avg_duration_ms / 1000, 'seconds', 'milliseconds') AS readable_avg_duration_ms,
        bar(avg_duration_ms, 0, MAX(avg_duration_ms) OVER ()) AS bar
    FROM merge(system, '^part_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
      AND event_type = 'MergeParts'
      AND merge_reason = 'RegularMerge'
    GROUP BY 1
    ORDER BY 1 ASC
    WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `
  const { data } = await fetchData<
    {
      event_time: string
      avg_duration_ms: number
      readable_avg_duration_ms: string
      bar: number
    }[]
  >({ query, hostId })

  return (
    <ChartCard title={title} className={className} sql={query} data={data || []}>
      <BarChart
        data={data || []}
        index="event_time"
        categories={['avg_duration_ms']}
        readableColumn="readable_avg_duration_ms"
        className={chartClassName}
        showLabel={false}
      />
    </ChartCard>
  )
}

export default ChartMergeAvgDuration
