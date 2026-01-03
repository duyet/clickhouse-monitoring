'use client'

import { Loader2 } from 'lucide-react'
import useSWR from 'swr'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
    return <span className="block truncate">{stringValue}</span>
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={toggleExpand}
      onKeyDown={handleKeyDown}
      className={cn(
        'block cursor-pointer transition-colors',
        expanded ? 'whitespace-pre-wrap break-words' : 'truncate',
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

type RowData = Record<string, unknown>
const columnHelper = createColumnHelper<RowData>()

export function DataTab() {
  const hostId = useHostId()
  const { database, table: tableName } = useExplorerState()
  const [limit, setLimit] = useState<number>(100)
  const [offset, setOffset] = useState<number>(0)

  const {
    data: response,
    error,
    isLoading,
    isValidating,
  } = useSWR<ApiResponse<RowData[]>>(
    database && tableName
      ? `/api/v1/explorer/preview?hostId=${hostId}&database=${encodeURIComponent(database)}&table=${encodeURIComponent(tableName)}&limit=${limit}&offset=${offset}`
      : null,
    fetcher,
    {
      keepPreviousData: true,
    }
  )

  const rows = response?.data || []

  // Generate columns dynamically from data
  const columns = useMemo(() => {
    if (rows.length === 0) return []
    return Object.keys(rows[0]).map((key) =>
      columnHelper.accessor(key, {
        header: key,
        cell: (info) => <ExpandableCell value={info.getValue()} />,
        size: 200,
        minSize: 80,
        maxSize: 500,
      })
    )
  }, [rows])

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    defaultColumn: {
      size: 200,
      minSize: 80,
      maxSize: 500,
    },
  })

  if (!database || !tableName) {
    return null
  }

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
        No data available for {database}.{tableName}
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
        <Table
          style={{
            width: table.getCenterTotalSize(),
          }}
        >
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="relative select-none"
                    style={{
                      width: header.getSize(),
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {/* Column resize handle */}
                    <div
                      role="presentation"
                      onDoubleClick={() => header.column.resetSize()}
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={cn(
                        'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
                        'bg-transparent hover:bg-primary/50',
                        header.column.getIsResizing() && 'bg-primary'
                      )}
                    />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{
                      width: cell.column.getSize(),
                      maxWidth: cell.column.getSize(),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
