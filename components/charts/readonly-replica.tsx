import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval } from '@/lib/clickhouse-query'
import { type ChartProps } from './chart-props'

export async function ChartReadonlyReplica({
  title = 'Readonly Replicated Tables',
  interval = 'toStartOfFifteenMinutes',
  lastHours = 24,
  className,
  hostId,
}: ChartProps) {
  const query = `
    SELECT ${applyInterval(interval, 'event_time')},
           MAX(CurrentMetric_ReadonlyReplica) AS ReadonlyReplica
    FROM merge(system, '^metric_log')
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
    GROUP BY event_time
    ORDER BY event_time
  `

  const { data } = await fetchData<
    {
      event_time: string
      ReadonlyReplica: number
    }[]
  >({
    query,
    format: 'JSONEachRow',
    hostId,
  })

  return (
    <ChartCard title={title} sql={query} className={className}>
      <BarChart
        data={data || []}
        index="event_time"
        categories={['ReadonlyReplica']}
        className="h-52"
      />
    </ChartCard>
  )
}

export default ChartReadonlyReplica
