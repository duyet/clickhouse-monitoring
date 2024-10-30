import { CircleAlert, CodeIcon, Database, TableIcon } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

import { DialogSQL } from '@/components/dialog-sql'
import { SingleLineSkeleton } from '@/components/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchData } from '@/lib/clickhouse'
import { getScopedLink } from '@/lib/scoped-link'
import { cn } from '@/lib/utils'

const metrics = [
  {
    query:
      "SELECT countDistinct(database) as count FROM system.tables WHERE lower(database) NOT IN ('system', 'information_schema')",
    icon: <Database className="size-4 opacity-70 hover:opacity-100" />,
    label: 'database(s)',
    href: '/database',
  },
  {
    query:
      "SELECT countDistinct(format('{}.{}', database, table)) as count FROM system.tables WHERE lower(database) NOT IN ('system', 'information_schema')",
    icon: <TableIcon className="size-4 opacity-70 hover:opacity-100" />,
    label: 'table(s)',
    href: '/database',
  },
  {
    query:
      "SELECT countDistinct(format('{}.{}', database, table)) as count FROM system.replicas WHERE is_readonly = 1",
    icon: <CircleAlert className="size-4 opacity-70 hover:opacity-100" />,
    label: 'readonly table(s)',
    href: '/readonly-tables',
    className: 'text-orange-500',
    hideZero: true,
  },
]

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
        {metrics.map((metric) => (
          <Suspense
            key={metric.query}
            fallback={<SingleLineSkeleton className="w-full" />}
          >
            <LinkCount {...metric} />
          </Suspense>
        ))}
      </CardContent>
    </Card>
  )
}

type LinkCountProps = {
  query: string
  icon: React.ReactNode
  label: string
  href: string
  hideZero?: boolean
  className?: string
}

async function LinkCount({
  query,
  icon,
  label,
  href,
  hideZero = true,
  className,
}: LinkCountProps) {
  const { data } = await fetchData<{ count: number }[]>({ query })

  if (!data || data.length === 0) return null
  if (hideZero && data[0].count == 0) return null

  return (
    <div
      className={cn(
        'group inline-flex w-full items-baseline gap-2 p-1 opacity-80 hover:opacity-100',
        className
      )}
    >
      <Link
        className="inline-flex items-baseline justify-between gap-2"
        href={await getScopedLink(href)}
      >
        <div className="inline-flex items-baseline gap-2 text-3xl font-bold">
          <span className="p-0">{data[0].count}</span>
        </div>
        <div className="inline-flex gap-1 truncate text-xs text-muted-foreground">
          {icon} {label} →
        </div>
      </Link>
      <DialogSQL
        sql={query}
        description=""
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
        contentClassName="max-w-screen-lg"
      />
    </div>
  )
}
