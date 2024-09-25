import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval } from '@/lib/clickhouse-query'
import Link from 'next/link'
import { ChartWarnMessage } from '../chart-warn-message'
import { type ChartProps } from './chart-props'

export async function ChartZookeeperError({
  title = 'ZooKeeper Errors',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
}: ChartProps) {
  const query = `
    SELECT
      ${applyInterval(interval, 'event_time')},
      sum(value) AS error_count
    FROM merge(system, '^error_log')
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
      AND error = 'KEEPER_EXCEPTION'
    GROUP BY event_time
    ORDER BY event_time
  `

  let data

  try {
    const resp = await fetchData<
      {
        event_time: string
        error_count: number
      }[]
    >({
      query,
      format: 'JSONEachRow',
    })

    data = resp.data
  } catch (e) {
    if ((e as Error).message.includes('Unknown table expression identifier')) {
      return (
        <ChartCard title={title} sql={query} className={className}>
          <ChartWarnMessage>
            <>
              system.error_log is not enabled.{' '}
              <Link
                href="https://clickhouse.com/docs/en/operations/server-configuration-parameters/settings#error_log"
                target="_blank"
                className="hover:underline"
              >
                See more
              </Link>
            </>
          </ChartWarnMessage>
        </ChartCard>
      )
    }

    throw e
  }

  return (
    <ChartCard title={title} sql={query} data={data} className={className}>
      <BarChart
        data={data}
        index="event_time"
        categories={['error_count']}
        className="h-52"
        showLegend
        stack
      />
    </ChartCard>
  )
}

export default ChartZookeeperError
