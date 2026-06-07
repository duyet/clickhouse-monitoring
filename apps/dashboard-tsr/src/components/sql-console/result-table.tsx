import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { activateOnEnterOrSpace } from '@/lib/a11y'
import { cn } from '@/lib/utils'

const MAX_CELL_LENGTH = 120
const PAGE_SIZE = 50

type RowData = Record<string, unknown>
const columnHelper = createColumnHelper<RowData>()

function renderCellValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function ExpandableCell({ value }: { value: unknown }) {
  const [expanded, setExpanded] = useState(false)
  const str = renderCellValue(value)
  const isLong = str.length > MAX_CELL_LENGTH
  const toggle = () => setExpanded((p) => !p)

  const isNullish = value === null || value === undefined
  if (isNullish) {
    return <span className="text-muted-foreground/50 italic">null</span>
  }
  if (!isLong) {
    return <span className="block whitespace-pre-wrap break-words">{str}</span>
  }
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={activateOnEnterOrSpace(toggle)}
      className={cn(
        'block cursor-pointer transition-colors',
        expanded ? 'whitespace-pre-wrap break-words' : 'truncate',
        !expanded && 'hover:text-primary'
      )}
      title={expanded ? 'Click to collapse' : 'Click to expand'}
      aria-expanded={expanded}
    >
      {expanded ? str : `${str.slice(0, MAX_CELL_LENGTH)}…`}
    </span>
  )
}

/**
 * Generic, self-paginating result grid for arbitrary row shapes. Columns are
 * derived from the first row's keys. Used by the Results tab and any tab that
 * shows tabular data. No CodeMirror here — safe to mount inside Radix tabs.
 */
export function ResultTable({
  rows,
  emptyMessage = 'Query returned no rows.',
}: {
  rows: RowData[]
  emptyMessage?: string
}) {
  const columns =
    rows.length === 0
      ? []
      : Object.keys(rows[0]).map((key) =>
          columnHelper.accessor((r) => r[key], {
            id: key,
            header: key,
            cell: (info) => <ExpandableCell value={info.getValue()} />,
            size: 220,
            minSize: 80,
            maxSize: 600,
          })
        )

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: 'onChange',
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    defaultColumn: { size: 220, minSize: 80, maxSize: 600 },
  })

  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground p-6 text-center text-sm">
        {emptyMessage}
      </div>
    )
  }

  const pageCount = table.getPageCount()
  const pageIndex = table.getState().pagination.pageIndex

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-md border">
        <Table style={{ minWidth: table.getCenterTotalSize(), width: '100%' }}>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="relative select-none font-mono text-xs"
                    style={{ minWidth: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    <div
                      role="presentation"
                      onDoubleClick={() => header.column.resetSize()}
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={cn(
                        'absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none',
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
                    className="align-top font-mono text-xs"
                    style={{ minWidth: cell.column.getSize(), maxWidth: 600 }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <div className="text-muted-foreground flex items-center justify-end gap-3 text-xs">
          <span>
            Page {pageIndex + 1} of {pageCount} · {rows.length} rows
          </span>
          <button
            type="button"
            className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-muted"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 disabled:opacity-40 hover:bg-muted"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
