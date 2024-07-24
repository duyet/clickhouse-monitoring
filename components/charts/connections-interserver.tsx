import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchDataWithCache } from '@/lib/clickhouse-cache'
import { cn } from '@/lib/utils'
import { type ChartProps } from './chart-props'

export async function ChartConnectionsInterserver({
  title = 'Interserver Connections Last 7 days (Total Requests / Hour)',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
  chartClassName,
}: ChartProps) {
  const query = `
    SELECT
      ${interval}(event_time) AS event_time,
      SUM(CurrentMetric_InterserverConnection) AS CurrentMetric_InterserverConnection,
      formatReadableQuantity(CurrentMetric_InterserverConnection) AS readable_CurrentMetric_InterserverConnection
    FROM system.metric_log
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
    GROUP BY event_time
    ORDER BY event_time
  `

  const { data } = await fetchDataWithCache<
    {
      event_time: string
      CurrentMetric_InterserverConnection: number
      readable_CurrentMetric_InterserverConnection: string
    }[]
  >({
    query,
    format: 'JSONEachRow',
  })

  return (
    <ChartCard title={title} sql={query} data={data} className={className}>
      <BarChart
        data={data}
        index="event_time"
        categories={['CurrentMetric_InterserverConnection']}
        readableColumn="readable_CurrentMetric_InterserverConnection"
        className={cn('h-52', chartClassName)}
        stack
      />
    </ChartCard>
  )
}

export default ChartConnectionsInterserver
