import Link from 'next/link'

import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval, fillStep } from '@/lib/clickhouse-query'
import { ChartWarnMessage } from '../chart-warn-message'
import { type ChartProps } from './chart-props'

export async function ChartKeeperException({
  title = 'KEEPER_EXCEPTION last 7 days',
  interval = 'toStartOfHour',
  lastHours = 24 * 7,
  className,
}: ChartProps) {
  const query = `
    SELECT
      ${applyInterval(interval, 'event_time')},
      sum(value) AS KEEPER_EXCEPTION 
    FROM merge(system, '^error_log')
    WHERE event_time >= now() - INTERVAL ${lastHours} HOUR
      AND error = 'KEEPER_EXCEPTION'
    GROUP BY event_time
    ORDER BY event_time WITH FILL TO now() STEP ${fillStep(interval)}
  `

  let data

  try {
    const resp = await fetchData<
      {
        event_time: string
        KEEPER_EXCEPTION: number
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
        categories={['KEEPER_EXCEPTION']}
        className="h-52"
        showLegend
        stack
      />
    </ChartCard>
  )
}

export default ChartKeeperException
