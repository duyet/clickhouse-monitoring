import { InfoCircledIcon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { fetchData } from '@/lib/clickhouse'
import { cn } from '@/lib/utils'

interface TableInfoProps {
  database: string
  table: string
  className?: string
}

export async function TableInfo({
  database,
  table,
  className,
}: TableInfoProps) {
  let tableInfo: { [key: string]: string }[] = []
  try {
    tableInfo = await fetchData(
      `SELECT
           engine,
           uuid,
           data_paths,
           metadata_path,
           metadata_modification_time,
           storage_policy,
           parts,
           active_parts,
           total_marks,
           formatReadableQuantity(total_rows) as total_rows,
           formatReadableSize(total_bytes) as compressed,
           partition_key,
           sorting_key,
           primary_key,
           active_parts
       FROM system.tables
       WHERE database = {database: String} AND name = {table: String}
      `,
      {
        database,
        table,
      }
    )
  } catch (error) {
    console.log(error)

    return null
  }

  if (!tableInfo?.length) {
    return null
  }

  const info = tableInfo[0]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'flex flex-row items-center gap-2 text-muted-foreground',
            className
          )}
          aria-label="Table Info"
          title="More about this table"
        >
          <InfoCircledIcon className="size-3" />
          Table Info
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-max">
        <DialogHeader>
          <DialogTitle>Table Info</DialogTitle>
          <DialogDescription>More about this table</DialogDescription>
        </DialogHeader>
        <div className="w-fit overflow-auto">
          <ul className="list-inside list-disc">
            {Object.entries(info).map(([key, value]) => (
              <li key={key}>
                <span className="font-semibold">{key}</span> = {value}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
