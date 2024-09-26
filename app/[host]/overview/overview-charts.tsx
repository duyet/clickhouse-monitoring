import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ClickHouseInfo } from './charts/clickhouse-info'
import { DatabaseTableCount } from './charts/database-table-count'
import { RunningQueries } from './charts/running-queries'

export async function OverviewCharts({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4',
        'md:grid-cols-3 lg:grid-cols-4',
        className
      )}
    >
      <RunningQueries />
      <DatabaseTableCount />
      <ClickHouseInfo />
      <Card className="min-w-xs rounded-sm border-0 shadow-none" />
    </div>
  )
}
