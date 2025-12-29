'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChartError } from '@/components/charts/chart-error'
import { TableSkeleton } from '@/components/skeleton'
import { useFetchData } from '@/lib/swr'

interface RunningQueriesProps {
  hostId?: number
  database: string
  table: string
  limit?: number
  className?: string
}

export function RunningQueries({
  hostId,
  database,
  table,
  className,
}: RunningQueriesProps) {
  const { data, isLoading, error, refresh } = useFetchData<
    { [key: string]: string }[]
  >(
    `SELECT query, user, elapsed,
       formatReadableQuantity(read_rows) as read_rows,
       formatReadableQuantity(total_rows_approx) as total_rows_approx,
       formatReadableSize(peak_memory_usage) as readable_peak_memory_usage,
       formatReadableSize(memory_usage) || ' (peak ' || readable_peak_memory_usage || ')' as memory_usage
     FROM system.processes
     WHERE (query LIKE '%{database: String}%')
       AND (query LIKE '%{table: String}%')
     `,
    {
      database,
      table,
    },
    hostId,
    5000 // refresh every 5 seconds for running queries
  )

  if (isLoading) {
    return <TableSkeleton rows={3} />
  }

  if (error) {
    return <ChartError error={error} onRetry={refresh} />
  }

  if (!data?.length) {
    return <span className="text-muted-foreground">No rows</span>
  }

  const headers = Object.keys(data[0])

  return (
    <div className="w-full overflow-auto">
      <Table className={className}>
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
              {Object.values(row).map((value) => {
                if (typeof value === 'object') {
                  return (
                    <TableCell key={value}>
                      <pre className="overflow-auto hover:text-clip">
                        <code>{JSON.stringify(value, null, 2)}</code>
                      </pre>
                    </TableCell>
                  )
                }

                return <TableCell key={value}>{value}</TableCell>
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
