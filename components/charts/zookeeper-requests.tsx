import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval } from '@/lib/clickhouse-query'
import type { ChartProps } from './chart-props'

export async function ChartZookeeperRequests({
  title = 'ZooKeeper Requests Over Time',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
  hostId,
}: ChartProps) {
  const query = `
    SELECT
      ${applyInterval(interval, 'event_time')},
      SUM(CurrentMetric_ZooKeeperRequest) AS ZookeeperRequests,
      formatReadableQuantity(ZookeeperRequests) AS readable_ZookeeperRequests,
      SUM(CurrentMetric_ZooKeeperWatch) AS ZooKeeperWatch,
      formatReadableQuantity(ZooKeeperWatch) AS readable_ZooKeeperWatch
    FROM merge(system, '^metric_log')
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
    GROUP BY event_time
    ORDER BY event_time
  `

  const { data } = await fetchData<
    {
      event_time: string
      ZookeeperRequests: number
      ZooKeeperWatch: number
    }[]
  >({
    query,
    format: 'JSONEachRow',
    hostId,
  })

  return (
    <ChartCard
      title={title}
      sql={query}
      data={data || []}
      className={className}
    >
      <BarChart
        data={data || []}
        index="event_time"
        categories={['ZookeeperRequests', 'ZooKeeperWatch']}
        className="h-52"
        showLegend
        stack
      />
    </ChartCard>
  )
}

export default ChartZookeeperRequests
