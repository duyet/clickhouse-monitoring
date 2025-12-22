import { ClickHouseInfo, DatabaseTableCount, DiskSize, RunningQueries } from '@/components/charts/overview'
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
