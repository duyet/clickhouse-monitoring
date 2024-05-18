import { ChartCard } from '@/components/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'
import { BarChart } from '../tremor/bar'
import { type ChartProps } from './chart-props'

export async function ChartConnectionsHttp({
  title = 'HTTP Connections Last 7 days (Total Requests / Hour)',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
  chartClassName,
}: ChartProps) {
  const query = `
    SELECT
      ${interval}(event_time) AS event_time,
      SUM(CurrentMetric_HTTPConnection) AS CurrentMetric_HTTPConnection,
      formatReadableQuantity(CurrentMetric_HTTPConnection) AS readable_CurrentMetric_HTTPConnection
    FROM system.metric_log
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
    GROUP BY event_time
    ORDER BY event_time
  `

  const data = await fetchData<
    {
      event_time: string
      CurrentMetric_HTTPConnection: number
      readable_CurrentMetric_HTTPConnection: string
    }[]
  >({
    query,
    format: 'JSONEachRow',
  })

  return (
    <ChartCard title={title} sql={query} className={className}>
      <BarChart
        data={data}
        index="event_time"
        categories={['CurrentMetric_HTTPConnection']}
        readableColumn="readable_CurrentMetric_HTTPConnection"
        className={cn('h-52', chartClassName)}
        stack
      />
    </ChartCard>
  )
}

export default ChartConnectionsHttp
