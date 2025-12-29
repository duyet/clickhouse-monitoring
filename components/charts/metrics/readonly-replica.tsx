import { ErrorAlert } from '@/components/error-alert'
import { BarChart } from '@/components/charts/base/bar'
import { ChartCard } from '@/components/charts/base/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval } from '@/lib/clickhouse-query'
import type { ChartProps } from '../chart-props'

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

  const { data, error } = await fetchData<
    {
      event_time: string
      ReadonlyReplica: number
    }[]
  >({
    query,
    format: 'JSONEachRow',
    hostId,
  })

  if (error) return <ErrorAlert {...error} />
  if (!data) return null

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
