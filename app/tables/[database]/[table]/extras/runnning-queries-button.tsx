import { BarChartIcon } from '@radix-ui/react-icons'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ServerComponentLazy } from '@/components/server-component-lazy'

import { RunningQueries } from './running-queries'
import { RunningQueriesCount } from './running-queries-count'

interface RunningQueriesButtonProps {
  database: string
  table: string
  limit?: number
  className?: string
}

export async function RunningQueriesButton({
  database,
  table,
  limit = 20,
  className,
}: RunningQueriesButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'text-muted-foreground flex flex-row items-center gap-2',
            className
          )}
          aria-label="Table Info"
          title="More about this table"
        >
          <BarChartIcon className="size-3" />
          Running Queries
          <RunningQueriesCount database={database} table={table} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-max">
        <DialogHeader>
          <DialogTitle>
            Running Queries on {database}.{table}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <ServerComponentLazy>
          <RunningQueries database={database} table={table} limit={limit} />
        </ServerComponentLazy>
      </DialogContent>
    </Dialog>
  )
}
