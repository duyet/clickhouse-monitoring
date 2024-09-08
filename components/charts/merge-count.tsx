import { ArrowRightIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

import { type ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/generic-charts/area'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { getScopedLink } from '@/lib/scoped-link'
import { cn } from '@/lib/utils'

export async function ChartMergeCount({
  title,
  interval = 'toStartOfFiveMinutes',
  lastHours = 12,
  className,
  chartClassName,
}: ChartProps) {
  const query = `
    SELECT ${interval}(event_time) AS event_time,
           avg(CurrentMetric_Merge) AS avg_CurrentMetric_Merge,
           avg(CurrentMetric_PartMutation) AS avg_CurrentMetric_PartMutation
    FROM merge(system, '^metric_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1
  `

  const { data } = await fetchData<
    {
      event_time: string
      avg_CurrentMetric_Merge: number
      avg_CurrentMetric_PartMutation: number
    }[]
  >({ query })

  return (
    <ChartCard
      title={title}
      className={cn('justify-between', className)}
      sql={query}
      data={data}
    >
      <AreaChart
        className={cn('h-52', chartClassName)}
        data={data}
        index="event_time"
        categories={[
          'avg_CurrentMetric_Merge',
          'avg_CurrentMetric_PartMutation',
        ]}
        readable="quantity"
      />

      <div className="flex flex-row justify-between gap-2 text-right text-sm text-muted-foreground">
        <Link
          href={getScopedLink('/mutations')}
          className="flex flex-row items-center gap-2"
        >
          Merges
          <ArrowRightIcon className="size-3" />
        </Link>
        <Link
          href={getScopedLink('/mutations')}
          className="flex flex-row items-center gap-2"
        >
          Mutations
          <ArrowRightIcon className="size-3" />
        </Link>
      </div>
    </ChartCard>
  )
}

export default ChartMergeCount
