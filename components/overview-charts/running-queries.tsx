import { CodeIcon } from 'lucide-react'
import Link from 'next/link'

import ChartQueryCount from '@/components/charts/query-count'
import { DialogSQL } from '@/components/dialog-sql'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchData } from '@/lib/clickhouse'
import { getScopedLink } from '@/lib/scoped-link'
import { cn } from '@/lib/utils'

export async function RunningQueries({ className }: { className?: string }) {
  const query =
    'SELECT COUNT() as count FROM system.processes WHERE is_cancelled = 0'
  const { data } = await fetchData<
    {
      count: number
    }[]
  >({
    query,
  })

  if (!data || !data.length) return <div />

  return (
    <Card className={cn('min-w-xs rounded-sm border-0 shadow-none', className)}>
      <CardContent className="group relative content-between p-0">
        <div className="absolute left-0 top-0 z-50 flex flex-row items-center gap-2 p-4 pb-0">
          <div className="text-2xl font-bold">{data[0].count}</div>
          <Link
            className="text-xs text-muted-foreground"
            href={await getScopedLink('/running-queries')}
          >
            running queries →
          </Link>
        </div>
        <div className="absolute right-0 top-0 z-50">
          <DialogSQL
            sql={query}
            button={
              <Button
                variant="outline"
                className="ml-auto h-fit border-0 p-2 opacity-0 shadow-none group-hover:opacity-100"
                aria-label="Show SQL"
                title="SQL of this"
              >
                <CodeIcon className="size-3" />
              </Button>
            }
          />
        </div>

        <ChartQueryCount
          title=""
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
