import { TableIcon } from 'lucide-react'

import { fetchData } from '@/lib/clickhouse'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface SampleDataProps {
  database: string
  table: string
  limit?: number
  className?: string
}

export async function SampleData({
  database,
  table,
  limit = 10,
  className,
}: SampleDataProps) {
  let data: { [key: string]: string }[] = []
  try {
    data = await fetchData(
      `SELECT *
       FROM ${database}.${table}
       LIMIT ${limit}`,
      {
        database,
        table,
      }
    )
  } catch (error) {
    console.log(error)

    return null
  }

  if (!data?.length) {
    return null
  }

  const headers = Object.keys(data[0])

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
          <TableIcon className="h-3 w-3" />
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
        <div className="w-fit overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={idx}>
                  {Object.values(row).map((value) => (
                    <TableCell key={value}>{value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
