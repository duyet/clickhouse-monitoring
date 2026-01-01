'use client'

import useSWR from 'swr'

import { useExplorerState } from '../hooks/use-explorer-state'
import { useMemo, useState } from 'react'
import { TableSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useHostId } from '@/lib/swr/use-host'

interface ApiResponse<T> {
  data: T
  metadata?: {
    rows?: number
    [key: string]: unknown
  }
}

const PAGE_SIZE_OPTIONS = [100, 500, 1000] as const

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function DataTab() {
  const hostId = useHostId()
  const { database, table } = useExplorerState()
  const [limit, setLimit] = useState<number>(100)
  const [offset, setOffset] = useState<number>(0)

  const {
    data: response,
    error,
    isLoading,
  } = useSWR<ApiResponse<Record<string, unknown>[]>>(
    database && table
      ? `/api/v1/explorer/preview?hostId=${hostId}&database=${encodeURIComponent(database)}&table=${encodeURIComponent(table)}&limit=${limit}&offset=${offset}`
      : null,
    fetcher
  )

  const rows = response?.data || []
  const columns = useMemo(() => {
    if (rows.length === 0) return []
    return Object.keys(rows[0])
  }, [rows])

  if (!database || !table) {
    return null
  }

  if (isLoading) {
    return <TableSkeleton />
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Failed to load data: {error.message}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No data available for {database}.{table}
      </div>
    )
  }

  const currentPage = Math.floor(offset / limit) + 1
  const hasNextPage = rows.length === limit

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={String(limit)}
            onValueChange={(v) => {
              setLimit(Number(v))
              setOffset(0)
            }}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNextPage}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-3">
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
