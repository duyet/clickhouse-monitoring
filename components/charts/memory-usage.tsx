import { type ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/tremor/area'
import { fetchData } from '@/lib/clickhouse'

import { ChartCard } from '../chart-card'

export async function ChartMemoryUsage({
  title,
  interval = 'toStartOfTenMinutes',
  lastHours = 24,
  className,
}: ChartProps) {
  const sql = `
    SELECT ${interval}(event_time) as event_time,
           avg(CurrentMetric_MemoryTracking) AS avg_memory,
           formatReadableSize(avg_memory) AS readable_avg_memory
    FROM system.metric_log
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1 ASC`
  const data = await fetchData(sql)

  return (
    <ChartCard title={title} className={className} sql={sql}>
      <AreaChart
        data={data}
        index="event_time"
        categories={['avg_memory']}
        className={className}
        readable={true}
        readableColumns={['readable_avg_memory']}
      />
    </ChartCard>
  )
}

export default ChartMemoryUsage
