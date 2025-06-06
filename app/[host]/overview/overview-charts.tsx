import { ClickHouseInfo } from '@/components/overview-charts/clickhouse-info'
import { DatabaseTableCount } from '@/components/overview-charts/database-table-count'
import { DiskSize } from '@/components/overview-charts/disk-size'
import { RunningQueries } from '@/components/overview-charts/running-queries'
import { cn } from '@/lib/utils'

export async function OverviewCharts({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4',
        'md:grid-cols-3 lg:grid-cols-4',
        className
      )}
    >
      <RunningQueries />
      <DatabaseTableCount />
      <ClickHouseInfo hostName version uptime />
      <DiskSize />
    </div>
  )
}
