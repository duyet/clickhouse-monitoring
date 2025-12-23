import { TableIcon } from '@radix-ui/react-icons'

import { ServerComponentLazy } from '@/components/server-component-lazy'
import { Button } from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui'
import { cn } from '@/lib/utils'

import { SampleData } from './sample-data'

interface SampleDataButtonProps {
  database: string
  table: string
  limit?: number
  className?: string
}

export async function SampleDataButton({
  database,
  table,
  limit = 20,
  className,
}: SampleDataButtonProps) {
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
          <TableIcon className="size-3" />
          Sample Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-max">
        <DialogHeader>
          <DialogTitle>Sample Data</DialogTitle>
          <DialogDescription>
            First {limit} rows of {database}.{table}
          </DialogDescription>
        </DialogHeader>
        <ServerComponentLazy>
          <SampleData database={database} table={table} limit={limit} />
        </ServerComponentLazy>
      </DialogContent>
    </Dialog>
  )
}
