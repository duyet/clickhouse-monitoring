import { type ChartProps } from '@/components/charts/chart-props'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval, fillStep, nowOrToday } from '@/lib/clickhouse-query'
import { getHostIdCookie } from '@/lib/scoped-link' // Added import

export async function ChartQueryCount({
  title = 'Running Queries over last 14 days (query / day)',
  interval = 'toStartOfDay',
  className,
  chartClassName,
  chartCardContentClassName,
  lastHours = 24 * 14,
  showXAxis = true,
  showLegend = false,
  showCartesianGrid = true,
  breakdown = 'breakdown',
  ...props
}: ChartProps) {
  // Get host ID from cookie
  const hostId = await getHostIdCookie()

  const query = `
    WITH event_count AS (
      SELECT ${applyInterval(interval, 'event_time')},
             COUNT() AS query_count
      FROM merge(system, '^query_log')
      WHERE type = 'QueryFinish'
            AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
      GROUP BY event_time
      ORDER BY event_time WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
    ),
    query_kind AS (
      SELECT ${applyInterval(interval, 'event_time')},
               query_kind,
               COUNT() AS count
        FROM merge(system, '^query_log')
        WHERE type = 'QueryFinish'
              AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
        GROUP BY 1, 2
        ORDER BY 3 DESC
    ),
    breakdown AS (
      SELECT event_time,
             groupArray((query_kind, count)) AS breakdown
      FROM query_kind
      GROUP BY 1
    )
    SELECT event_time,
           query_count,
           breakdown.breakdown AS breakdown
    FROM event_count
    LEFT JOIN breakdown USING event_time
    ORDER BY 1
  `
  const { data } = await fetchData<
    {
      event_time: string
      query_count: number
      breakdown: Array<[string, number] | Record<string, string>>
    }[]
  >({
    query,
    hostId: hostId, // Added hostId parameter
  })

  // ... rest of the component would continue here
  // This shows the pattern for the fix
}
