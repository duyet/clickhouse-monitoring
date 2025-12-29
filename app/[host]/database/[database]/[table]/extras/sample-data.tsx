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
import { ApiErrorType } from '@/lib/api/types'
import { useFetchData } from '@/lib/swr'
import { escapeQualifiedIdentifier, validateLimit } from '@/lib/sql-utils'
import { useMemo } from 'react'

interface SampleDataProps {
  hostId?: number
  database: string
  table: string
  limit?: number
  className?: string
}

export function SampleData({
  hostId,
  database,
  table,
  limit = 10,
  className,
}: SampleDataProps) {
  // Validate and sanitize inputs to prevent SQL injection
  const sanitizedLimit = useMemo(() => {
    try {
      return validateLimit(limit)
    } catch {
      return null // Will show error below
    }
  }, [limit])

  // Escape database and table names to prevent SQL injection
  const qualifiedTable = useMemo(
    () => escapeQualifiedIdentifier(database, table),
    [database, table]
  )

  const { data, isLoading, error, refresh } = useFetchData<
    { [key: string]: string }[]
  >(
    `SELECT *
     FROM ${qualifiedTable}
     LIMIT ${sanitizedLimit ?? 10}`,
    {},
    hostId,
    30000 // refresh every 30 seconds
  )

  // Show validation error if limit is invalid
  if (sanitizedLimit === null) {
    return (
      <ChartError
        error={{
          type: ApiErrorType.ValidationError,
          message: 'Invalid limit parameter',
        }}
        title="Invalid limit parameter"
      />
    )
  }

  if (isLoading) {
    return <TableSkeleton rows={5} />
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
