import { ChartCard } from '@/components/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { BarChart } from '../tremor/bar'
import { type ChartProps } from './chart-props'

export async function ChartZookeeperWait({
  title = 'ZooKeeper Wait Seconds',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
}: ChartProps) {
  const query = `
    SELECT
      ${interval}(event_time) AS event_time,
      AVG(ProfileEvent_ZooKeeperWaitMicroseconds) / 1000000 AS AVG_ProfileEvent_ZooKeeperWaitSeconds,
      formatReadableTimeDelta(AVG_ProfileEvent_ZooKeeperWaitSeconds) AS readable_AVG_ProfileEvent_ZooKeeperWaitSeconds
    FROM system.metric_log
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
    GROUP BY event_time
    ORDER BY event_time
  `

  const data = await fetchData<
    {
      event_time: string
      AVG_ProfileEvent_ZooKeeperWaitSeconds: number
      readable_AVG_ProfileEvent_ZooKeeperWaitSeconds: string
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
        categories={['AVG_ProfileEvent_ZooKeeperWaitSeconds']}
        readableColumn="readable_AVG_ProfileEvent_ZooKeeperWaitSeconds"
        className="h-52"
        stack
      />
    </ChartCard>
  )
}

export default ChartZookeeperWait
