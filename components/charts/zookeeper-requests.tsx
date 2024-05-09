import { ChartCard } from '@/components/chart-card'
import { AreaChart } from '@/components/tremor/area'
import { fetchData } from '@/lib/clickhouse'
import { type ChartProps } from './chart-props'

const ZooKeeperRequestsChart = async ({
  title = 'ZooKeeper Requests Over Time',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
}: ChartProps) => {
  const query = `
    SELECT
      ${interval}(event_time) AS event_time,
      SUM(CurrentMetric_ZooKeeperRequest) AS requests
    FROM system.metric_log
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
    GROUP BY event_time
    ORDER BY event_time
  `

  const data = await fetchData<
    {
      event_time: string
      requests: number
    }[]
  >({
    query,
    format: 'JSONEachRow',
  })

  return (
    <ChartCard title={title} sql={query} className={className}>
      <AreaChart
        data={data}
        index="event_time"
        categories={['requests']}
        className="h-52"
      />
    </ChartCard>
  )
}

export default ZooKeeperRequestsChart
