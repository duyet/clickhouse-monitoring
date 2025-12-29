'use client'

import { ErrorAlert } from '@/components/error-alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useFetchData } from '@/lib/swr'
import { cn } from '@/lib/utils'

interface OverviewChartsProps {
  hostId: number
  className?: string
}

export function OverviewCharts({ hostId, className }: OverviewChartsProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4',
        'md:grid-cols-3 lg:grid-cols-4',
        className
      )}
    >
      <RunningQueries hostId={hostId} />
      <DatabaseTableCount hostId={hostId} />
      <ClickHouseInfo hostId={hostId} />
      <DiskSize hostId={hostId} />
    </div>
  )
}

function RunningQueries({ hostId }: { hostId: number }) {
  const query =
    'SELECT COUNT() as count FROM system.processes WHERE is_cancelled = 0'
  const { data, error } = useFetchData<{ count: number }[]>(
    query,
    {},
    hostId,
    30000
  )

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Running Queries</CardTitle>
          <CardDescription className="text-xs">Active</CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorAlert
            title="Configuration error"
            message={error.message}
            query={query}
            compact={true}
          />
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.length) return <div />

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm">Running Queries</CardTitle>
        <CardDescription className="text-xs">Active</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">{data[0].count}</div>
          <a
            className="text-muted-foreground hover:text-foreground text-sm"
            href={`/running-queries?host=${hostId}`}
          >
            View all →
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

function DatabaseTableCount({ hostId }: { hostId: number }) {
  const databaseQuery =
    "SELECT countDistinct(database) as count FROM system.tables WHERE lower(database) NOT IN ('system', 'information_schema')"
  const tablesQuery =
    "SELECT countDistinct(format('{}.{}', database, table)) as count FROM system.tables WHERE lower(database) NOT IN ('system', 'information_schema')"

  const { data: databaseData, error: databaseError } = useFetchData<
    { count: number }[]
  >(databaseQuery, {}, hostId, 30000)
  const { data: tablesData, error: tablesError } = useFetchData<
    { count: number }[]
  >(tablesQuery, {}, hostId, 30000)

  if (databaseError || tablesError) {
    return (
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Database</CardTitle>
          <CardDescription className="text-xs">Overview</CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorAlert
            title="Configuration error"
            message={
              databaseError?.message || tablesError?.message || 'Unknown error'
            }
            query={databaseQuery}
            compact={true}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Database</CardTitle>
            <CardDescription className="text-xs">Overview</CardDescription>
          </div>
          <a
            className="text-muted-foreground hover:text-foreground text-sm"
            href={`/tables-overview?host=${hostId}`}
          >
            View all →
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center justify-between">
          <span className="text-sm">
            {databaseData?.[0]?.count || 0} databases
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">{tablesData?.[0]?.count || 0} tables</span>
        </div>
      </CardContent>
    </Card>
  )
}

function ClickHouseInfo({ hostId }: { hostId: number }) {
  const hostNameQuery = 'SELECT hostName() as val'
  const versionQuery = 'SELECT version() as val'
  const uptimeQuery =
    "SELECT splitByString(' and ', formatReadableTimeDelta(uptime()))[1] as val"

  const { data: hostNameData } = useFetchData<{ val: string }[]>(
    hostNameQuery,
    {},
    hostId,
    30000
  )
  const { data: versionData } = useFetchData<{ val: string }[]>(
    versionQuery,
    {},
    hostId,
    30000
  )
  const { data: uptimeData } = useFetchData<{ val: string }[]>(
    uptimeQuery,
    {},
    hostId,
    30000
  )

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm">System Info</CardTitle>
        <CardDescription className="text-xs">ClickHouse</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Host</span>
          <div
            className="truncate text-sm font-medium"
            title={hostNameData?.[0]?.val || ''}
          >
            {hostNameData?.[0]?.val || '-'}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Version</span>
          <div
            className="truncate text-sm font-medium"
            title={versionData?.[0]?.val || ''}
          >
            {versionData?.[0]?.val || '-'}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Uptime</span>
          <div
            className="truncate text-sm font-medium"
            title={uptimeData?.[0]?.val || ''}
          >
            {uptimeData?.[0]?.val || '-'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DiskSize({ hostId }: { hostId: number }) {
  const query = `
    SELECT name,
           (total_space - unreserved_space) AS used_space,
           formatReadableSize(used_space) AS readable_used_space,
           total_space,
           formatReadableSize(total_space) AS readable_total_space
    FROM system.disks
    ORDER BY name
    LIMIT 1
  `
  const { data, error } = useFetchData<
    {
      name: string
      used_space: number
      readable_used_space: string
      total_space: number
      readable_total_space: string
    }[]
  >(query, {}, hostId, 30000)

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Disk Size</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorAlert
            title="Configuration error"
            message={error.message}
            query={query}
            compact={true}
          />
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.length) return <div />

  const first = data[0]

  return (
    <Card>
      <CardHeader className="pb-0">
        <div>
          <CardTitle className="text-sm">Disk Size</CardTitle>
          <CardDescription className="text-xs">
            {first.readable_total_space} total ({first.name} disk)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {first.readable_used_space} used
          </div>
          <a
            className="text-muted-foreground hover:text-foreground text-sm"
            href={`/disks?host=${hostId}`}
          >
            View all →
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
