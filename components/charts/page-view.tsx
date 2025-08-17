import { type ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/generic-charts/bar'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { applyInterval, fillStep, nowOrToday } from '@/lib/clickhouse-query'
import { getHostIdCookie } from '@/lib/scoped-link'
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
  ...props
}: ChartProps & { colors?: string[] }) {
  const hostId = await getHostIdCookie()
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
  const { data } = await fetchData<
    {
      event_time: string
      page_views: number
    }[]
  >({ query, hostId })

  return (
    <ChartCard
      title={title}
      className={className}
      contentClassName={chartCardContentClassName}
      sql={query}
      data={data}
    >
      <BarChart
        className={cn('h-52', chartClassName)}
        data={data}
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
