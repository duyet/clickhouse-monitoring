import { fetchData } from '@/lib/clickhouse'
import { type ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/tremor/bar'

import { ChartCard } from '../chart-card'

export async function ChartMergeAvgDuration({
  title,
  interval = 'toStartOfDay',
  lastHours = 24 * 14,
  className,
}: ChartProps) {
  const sql = `
    SELECT
        ${interval}(event_time) as event_time,
        AVG(duration_ms) AS avg_duration_ms,
        formatReadableTimeDelta(avg_duration_ms / 1000) AS readable_avg_duration_ms,
        bar(avg_duration_ms, 0, MAX(avg_duration_ms) OVER ()) AS bar
    FROM merge(system, '^part_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
      AND event_type = 'MergeParts'
      AND merge_reason = 'RegularMerge'
    GROUP BY 1
    ORDER BY 1 ASC
  `
  const data = await fetchData(sql)

  return (
    <ChartCard title={title} className={className} sql={sql}>
      <BarChart
        data={data}
        index="event_time"
        categories={['avg_duration_ms']}
        readableColumn="readable_avg_duration_ms"
        className={className}
      />
    </ChartCard>
  )
}

export default ChartMergeAvgDuration
