'use client'

import { Loader2 } from 'lucide-react'
import useSWR from 'swr'

import { useExplorerState } from '../hooks/use-explorer-state'
import { memo, useCallback, useMemo, useState } from 'react'
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
import { cn } from '@/lib/utils'

const MAX_CELL_LENGTH = 100

/**
 * Expandable cell component for long text content
 * Shows truncated text inline with click-to-expand functionality
 */
const ExpandableCell = memo(function ExpandableCell({
  value,
}: {
  value: unknown
}) {
  const [expanded, setExpanded] = useState(false)
  const stringValue = String(value ?? '')
  const isLong = stringValue.length > MAX_CELL_LENGTH

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggleExpand()
      }
    },
    [toggleExpand]
  )

  if (!isLong) {
    return <span className="whitespace-nowrap">{stringValue}</span>
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={toggleExpand}
      onKeyDown={handleKeyDown}
      className={cn(
        'cursor-pointer transition-colors',
        expanded ? 'whitespace-pre-wrap break-words' : 'whitespace-nowrap',
        !expanded && 'hover:text-primary'
      )}
      title={expanded ? 'Click to collapse' : 'Click to expand'}
      aria-expanded={expanded}
    >
      {expanded ? stringValue : `${stringValue.slice(0, MAX_CELL_LENGTH)}…`}
    </span>
  )
})

interface ApiResponse<T> {
  data: T
  metadata?: {
    rows?: number
    [key: string]: unknown
  }
}

const PAGE_SIZE_OPTIONS = [100, 500, 1000] as const

const fetcher = (
  url: string
): Promise<ApiResponse<Record<string, unknown>[]>> =>
  fetch(url).then((res) => res.json())

export function DataTab() {
  const hostId = useHostId()
  const { database, table } = useExplorerState()
  const [limit, setLimit] = useState<number>(100)
  const [offset, setOffset] = useState<number>(0)

  const {
    data: response,
    error,
    isLoading,
    isValidating,
  } = useSWR<ApiResponse<Record<string, unknown>[]>>(
    database && table
      ? `/api/v1/explorer/preview?hostId=${hostId}&database=${encodeURIComponent(database)}&table=${encodeURIComponent(table)}&limit=${limit}&offset=${offset}`
      : null,
    fetcher,
    {
      keepPreviousData: true, // Keep showing old data while loading new page
    }
  )

  const rows = response?.data || []
  const columns = useMemo(() => {
    if (rows.length === 0) return []
    return Object.keys(rows[0])
  }, [rows])

  if (!database || !table) {
    return null
  }

  // Show skeleton only on initial load, not during pagination
  if (isLoading && !response) {
    return <TableSkeleton />
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Failed to load data: {error.message}
      </div>
    )
  }

  if (rows.length === 0 && !isValidating) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No data available for {database}.{table}
      </div>
    )
  }

  const currentPage = Math.floor(offset / limit) + 1
  const hasNextPage = rows.length === limit
  const isPaginating = isValidating && !!response

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
            disabled={isPaginating}
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
          {isPaginating && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            Page {currentPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0 || isPaginating}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNextPage || isPaginating}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'overflow-x-auto rounded-md border transition-opacity',
          isPaginating && 'opacity-60'
        )}
      >
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
                  <td key={col} className="px-4 py-3 max-w-md">
                    <ExpandableCell value={row[col]} />
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
