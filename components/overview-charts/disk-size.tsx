import { CodeIcon } from 'lucide-react'
import Link from 'next/link'

import { DialogSQL } from '@/components/dialog-sql'
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

export async function DiskSize({ className }: { className?: string }) {
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
  const { data } = await fetchData<
    {
      name: string
      used_space: number
      readable_used_space: string
      total_space: number
      readable_total_space: string
    }[]
  >({
    query,
  })

  if (!data || !data.length) return <div />

  const first = data[0]

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Disk Size</CardTitle>
            <CardDescription className="text-xs">
              {first.readable_total_space} total ({first.name} disk)
            </CardDescription>
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
          <div className="text-2xl font-bold">
            {first.readable_used_space} used
          </div>
          <Link
            className="text-muted-foreground hover:text-foreground text-sm"
            href={await getScopedLink('/disks')}
          >
            View all →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
