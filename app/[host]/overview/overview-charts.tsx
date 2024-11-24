import { ClickHouseInfo } from '@/components/overview-charts/clickhouse-info'
import { DatabaseTableCount } from '@/components/overview-charts/database-table-count'
import { RunningQueries } from '@/components/overview-charts/running-queries'
import { Card } from '@/components/ui/card'
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
      <Card className="min-w-xs rounded-sm border-0 shadow-none" />
    </div>
  )
}
