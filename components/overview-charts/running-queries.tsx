import { CodeIcon } from 'lucide-react'
import Link from 'next/link'

import { DialogSQL } from '@/components/dialog-sql'
import { ErrorAlert } from '@/components/error-alert'
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

export async function RunningQueries({ className }: { className?: string }) {
  const query =
    'SELECT COUNT() as count FROM system.processes WHERE is_cancelled = 0'
  const { data, error } = await fetchData<
    {
      count: number
    }[]
  >({
    query,
  })

  // Show error if query failed
  if (error) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Running Queries</CardTitle>
          <CardDescription className="text-xs">Active</CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorAlert
            title="Configuration error"
            message={error.message}
            errorType={error.type}
            query={query}
            compact={true}
          />
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.length) return <div />

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Running Queries</CardTitle>
            <CardDescription className="text-xs">Active</CardDescription>
          </div>
          <DialogSQL
            sql={query}
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
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">{data[0].count}</div>
          <Link
            className="text-muted-foreground hover:text-foreground text-sm"
            href={await getScopedLink('/running-queries')}
          >
            View all →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
