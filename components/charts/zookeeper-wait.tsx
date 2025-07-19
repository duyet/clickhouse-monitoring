import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval } from '@/lib/clickhouse-query'
import { type ChartProps } from './chart-props'

export async function ChartZookeeperWait({
  title = 'ZooKeeper Wait Seconds',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
}: ChartProps) {
  const query = `
    SELECT
      ${applyInterval(interval, 'event_time')},
      AVG(ProfileEvent_ZooKeeperWaitMicroseconds) / 1000000 AS AVG_ProfileEvent_ZooKeeperWaitSeconds,
      formatReadableTimeDelta(AVG_ProfileEvent_ZooKeeperWaitSeconds) AS readable_AVG_ProfileEvent_ZooKeeperWaitSeconds
    FROM merge(system, '^metric_log')
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
    GROUP BY event_time
    ORDER BY event_time
  `

  const { data } = await fetchData<
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
    <ChartCard title={title} sql={query} data={data || []} className={className}>
      <BarChart
        data={data || []}
        index="event_time"
        categories={['AVG_ProfileEvent_ZooKeeperWaitSeconds']}
        readableColumn="readable_AVG_ProfileEvent_ZooKeeperWaitSeconds"
        className="h-52"
        showLegend
        stack
      />
    </ChartCard>
  )
}

export default ChartZookeeperWait
