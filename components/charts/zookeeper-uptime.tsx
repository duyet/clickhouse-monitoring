import { type ChartProps } from '@/components/charts/chart-props'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'

import { ArrowUpIcon } from '@radix-ui/react-icons'
import { CardMultiMetrics } from '../generic-charts/card-multi-metrics'

export async function ChartZookeeperUptime({
  title = 'Zookeeper Uptime',
  className,
  hostId,
}: ChartProps) {
  const query =
    'SELECT formatReadableTimeDelta(zookeeperSessionUptime()) AS uptime'

  const { data } = await fetchData<
    {
      uptime: string
    }[]
  >({ query, hostId })

  const uptime = (data || [])[0] || { uptime: 'N/A' }

  return (
    <ChartCard
      title={title}
      className={cn('justify-between', className)}
      sql={query}
    >
      <div className="flex flex-col justify-between p-0">
        <CardMultiMetrics
          primary={
            <span className="flex flex-row items-center gap-2">
              <ArrowUpIcon className="h-6 w-6" />
              {uptime.uptime}
            </span>
          }
          items={[]}
          className="p-2"
        />
        <div className="text-muted-foreground pl-2 text-sm"></div>
      </div>
    </ChartCard>
  )
}

export default ChartZookeeperUptime
