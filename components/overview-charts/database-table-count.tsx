import { CodeIcon, Database, TableIcon } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

import { DialogSQL } from '@/components/dialogs/dialog-sql'
import { ErrorAlert } from '@/components/feedback/error-alert'
import { SingleLineSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { fetchData } from '@/lib/clickhouse'
import { getScopedLink } from '@/lib/scoped-link'
import { cn } from '@/lib/utils'

export async function DatabaseTableCount({
  hostId,
  className,
}: {
  hostId: number
  className?: string
}) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Database</CardTitle>
            <CardDescription className="text-xs">Overview</CardDescription>
          </div>
          <Link
            className="text-muted-foreground hover:text-foreground text-sm"
            href={await getScopedLink('/tables-overview')}
          >
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <Suspense fallback={<SingleLineSkeleton className="w-full" />}>
          <DatabaseCount hostId={hostId} />
        </Suspense>
        <Suspense fallback={<SingleLineSkeleton className="w-full" />}>
          <TablesCount hostId={hostId} />
        </Suspense>
      </CardContent>
    </Card>
  )
}

async function DatabaseCount({ hostId }: { hostId: number }) {
  const query =
    "SELECT countDistinct(database) as count FROM system.tables WHERE lower(database) NOT IN ('system', 'information_schema')"
  const { data, error } = await fetchData<{ count: number }[]>({
    query,
    hostId,
  })

  if (error) {
    return (
      <ErrorAlert
        title="Configuration error"
        message={error.message}
        errorType={error.type}
        query={query}
        compact={true}
      />
    )
  }

  if (!data || data.length === 0) return null

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Database className="size-4" />
        <span className="text-sm">{data[0].count} databases</span>
      </div>
      <DialogSQL
        sql={query}
        description=""
        button={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Show SQL"
            title="SQL of this"
          >
            <CodeIcon className="size-4" />
          </Button>
        }
      />
    </div>
  )
}

async function TablesCount({ hostId }: { hostId: number }) {
  const totalQuery =
    "SELECT countDistinct(format('{}.{}', database, table)) as count FROM system.tables WHERE lower(database) NOT IN ('system', 'information_schema')"
  const readonlyQuery =
    "SELECT countDistinct(format('{}.{}', database, table)) as count FROM system.replicas WHERE is_readonly = 1"

  const [totalData, readonlyData] = await Promise.all([
    fetchData<{ count: number }[]>({ query: totalQuery, hostId }),
    fetchData<{ count: number }[]>({ query: readonlyQuery, hostId }),
  ])

  if (totalData?.error) {
    return (
      <ErrorAlert
        title="Configuration error"
        message={totalData.error.message}
        errorType={totalData.error.type}
        query={totalQuery}
        compact={true}
      />
    )
  }

  if (!totalData?.data || totalData.data.length === 0) return null

  const totalCount = totalData.data[0].count
  const readonlyCount = readonlyData?.data?.[0]?.count || 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <TableIcon className="size-4" />
        <div className="flex items-center gap-1 text-sm">
          <span>{totalCount} tables</span>
          {readonlyCount > 0 && (
            <Link
              href={await getScopedLink('/readonly-tables')}
              className="text-orange-500 hover:text-orange-600"
            >
              ({readonlyCount} readonly)
            </Link>
          )}
        </div>
      </div>
      <DialogSQL
        sql={totalQuery}
        description=""
        button={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Show SQL"
            title="SQL of this"
          >
            <CodeIcon className="size-4" />
          </Button>
        }
      />
    </div>
  )
}
