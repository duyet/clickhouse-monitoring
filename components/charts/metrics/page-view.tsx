import type { ChartProps } from '@/components/charts/chart-props'
import { ErrorAlert } from '@/components/error-alert'
import { BarChart } from '@/components/charts/base/bar'
import { ChartCard } from '@/components/charts/base/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval, fillStep, nowOrToday } from '@/lib/clickhouse-query'
import { cn } from '@/lib/utils'

export async function PageViewBarChart({
  title = 'Daily Page Views',
  interval = 'toStartOfDay',
  className,
  chartClassName,
  chartCardContentClassName,
  lastHours = 24 * 14,
  showXAxis = true,
  showYAxis = true,
  showLegend = false,
  colors = ['--chart-indigo-300'],
  hostId,
  ...props
}: ChartProps & { colors?: string[] }) {
  const eventTimeExpr = applyInterval(interval, 'event_time', 'event_time')
  const query = `
    SELECT ${eventTimeExpr},
           count() AS page_views
    FROM system.monitoring_events
    WHERE kind = 'PageView'
      AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY event_time
    ORDER BY event_time WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `
  const { data, error } = await fetchData<
    {
      event_time: string
      page_views: number
    }[]
  >({ query, hostId })

  if (error) return <ErrorAlert {...error} />
  if (!data) return null

  return (
    <ChartCard
      title={title}
      className={className}
      contentClassName={chartCardContentClassName}
      sql={query}
      data={data || []}
    >
      <BarChart
        className={cn('h-52', chartClassName)}
        data={data || []}
        index="event_time"
        categories={['page_views']}
        readable="quantity"
        showLegend={showLegend}
        showXAxis={showXAxis}
        showYAxis={showYAxis}
        showLabel={true}
        colors={colors}
        {...props}
      />
    </ChartCard>
  )
}

export default PageViewBarChart
