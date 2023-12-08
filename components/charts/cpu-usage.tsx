import { fetchData } from '@/lib/clickhouse'
import type { ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/tremor'

import { ChartCard } from '../chart-card'

export async function ChartCPUUsage({
  title,
  interval = 'toStartOfTenMinutes',
  lastHours = 24,
  className,
}: ChartProps) {
  const sql = `
    SELECT ${interval}(event_time)::INT AS event_time,
           avg(ProfileEvent_OSCPUVirtualTimeMicroseconds) / 1000000 as avg_cpu
    FROM system.metric_log
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1 WITH FILL STEP 60`
  const data = await fetchData(sql)

  return (
    <ChartCard title={title} className={className} sql={sql}>
      <AreaChart
        data={data}
        index="event_time"
        categories={['avg_cpu']}
        className={className}
      />
    </ChartCard>
  )
}

export default ChartCPUUsage
