import { BarChartIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { getScopedLink } from '@/lib/scoped-link'
import { cn } from '@/lib/utils'

interface HistoryQueriesButtonProps {
  database: string
  table: string
  className?: string
}

export async function HistoryQueriesButton({
  database,
  table,
  className,
}: HistoryQueriesButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Link
          aria-label="History Queries"
          title="History Queries"
          href={getScopedLink(
            `/history-queries?database=${database}&table=${table}`
          )}
        >
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'flex flex-row items-center gap-2 text-muted-foreground',
              className
            )}
          >
            <BarChartIcon className="size-3" />
            History Queries
          </Button>
        </Link>
      </DialogTrigger>
    </Dialog>
  )
}
