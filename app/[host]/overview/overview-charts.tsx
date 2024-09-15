import ChartQueryCount from '@/components/charts/query-count'
import { SingleLineSkeleton } from '@/components/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { fetchData } from '@/lib/clickhouse'
import { getScopedLink } from '@/lib/scoped-link'
import { cn } from '@/lib/utils'
import { CircleAlert, Database } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

export async function RunningQueries({ className }: { className?: string }) {
  const query = `SELECT COUNT() as count FROM system.processes`
  const { data } = await fetchData<
    {
      count: number
    }[]
  >({ query })

  if (!data || !data.length) return <div />

  return (
    <Card className={cn('min-w-xs rounded-sm border-0 shadow-none', className)}>
      <CardContent className="relative content-between p-0">
        <div className="absolute left-0 top-0 z-50 flex flex-row items-center gap-1 gap-2 p-4 pb-0">
          <div className="text-2xl font-bold">{data[0].count}</div>
          <Link
            className="text-xs text-muted-foreground"
            href={getScopedLink('/running-queries')}
          >
            running queries →
          </Link>
        </div>

        <ChartQueryCount
          interval="toStartOfDay"
          lastHours={24 * 7}
          className="border-0 p-0 shadow-none"
          chartClassName="min-h-[100px] h-32 shadow-none"
          chartCardContentClassName="p-0"
          showXAxis={false}
          showCartesianGrid={false}
          breakdown={''}
          showLegend={false}
          chartConfig={{
            query_count: {
              color: 'hsl(var(--chart-5))',
            },
          }}
        />
      </CardContent>
    </Card>
  )
}

export async function LinkDatabaseCount({ className }: { className?: string }) {
  const query = `SELECT countDistinct(database) as count FROM system.tables`
  const { data } = await fetchData<
    {
      count: number
    }[]
  >({ query })

  if (!data) return <div />

  return (
    <Link
      className={cn(
        'inline-flex items-baseline gap-1 gap-2 p-1 opacity-80 hover:opacity-100',
        className
      )}
      href={getScopedLink('/database')}
    >
      <div className="inline-flex items-baseline gap-2 text-3xl font-bold">
        <Database className="opacity-70 hover:opacity-100" />
        <span className="p-0">{data[0].count}</span>
      </div>
      <div className="text-xs text-muted-foreground">database(s) →</div>
    </Link>
  )
}

export async function LinkTableCount({ className }: { className?: string }) {
  const query = `SELECT countDistinct(format('{}.{}', database, table)) as count FROM system.tables`
  const { data } = await fetchData<
    {
      count: number
    }[]
  >({ query })

  if (!data) return <div />

  return (
    <Link
      className={cn(
        'inline-flex items-baseline gap-1 gap-2 p-1 opacity-80 hover:opacity-100',
        className
      )}
      href={getScopedLink('/database')}
    >
      <div className="inline-flex items-baseline gap-2 text-3xl font-bold">
        <Database className="opacity-70 hover:opacity-100" />
        <span className="p-0">{data[0].count}</span>
      </div>
      <div className="text-xs text-muted-foreground">table(s) →</div>
    </Link>
  )
}

export async function LinkReadonlyTableCount({
  className,
}: {
  className?: string
}) {
  let data
  try {
    const resp = await fetchData<
      {
        count: number
      }[]
    >({
      query: `
        SELECT countDistinct(format('{}.{}', database, table)) as count
        FROM system.replicas
        WHERE is_readonly = 1`,
    })
    data = resp.data
  } catch (e) {
    console.error('<LinkReadonlyTableCount /> error:', e)

    // Possible issue when no-replica cluster setup
    return <div />
  }

  if (!data || (data.length && data[0].count == 0)) return <div />

  return (
    <Link
      className={cn(
        'inline-flex items-baseline gap-1 gap-2 p-1 text-orange-500 opacity-80 hover:opacity-100',
        className
      )}
      href={getScopedLink('/readonly-tables')}
    >
      <div className="inline-flex items-baseline gap-2 text-3xl font-bold">
        <CircleAlert className="opacity-70 hover:opacity-100" />
        <span className="p-0">{data[0].count}</span>
      </div>
      <div className="text-xs text-orange-500">readonly table(s) →</div>
    </Link>
  )
}

export async function DatabaseTableCount({
  className,
}: {
  className?: string
}) {
  return (
    <Card
      className={cn(
        'min-w-xs content-center rounded-sm shadow-none',
        className
      )}
    >
      <CardContent className="flex flex-col content-center p-2 pt-2">
        <Suspense fallback={<SingleLineSkeleton />}>
          <LinkDatabaseCount />
        </Suspense>
        <Suspense fallback={<SingleLineSkeleton />}>
          <LinkTableCount />
        </Suspense>
        <Suspense fallback={<SingleLineSkeleton />}>
          <LinkReadonlyTableCount />
        </Suspense>
      </CardContent>
    </Card>
  )
}

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
      <Card className="min-w-xs rounded-sm border-0 shadow-none" />
      <Card className="min-w-xs rounded-sm border-0 shadow-none" />
    </div>
  )
}
