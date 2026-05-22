'use client'

import { SearchX } from 'lucide-react'
import {
  type Cell,
  flexRender,
  type Row,
  type RowData,
  type Table,
} from '@tanstack/react-table'

import type { RowClassNameFn } from '@/types/query-config'

import { memo } from 'react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'

const UTILITY_COLUMNS = new Set(['select', 'action'])
const PRIMARY_COLUMN_PRIORITY = [
  'query',
  'query_detail',
  'query_id',
  'database',
  'table',
  'name',
]

function formatColumnLabel(columnId: string) {
  return columnId.replaceAll('_', ' ')
}

function pickPrimaryCell<TData extends RowData>(cells: Cell<TData, unknown>[]) {
  return (
    PRIMARY_COLUMN_PRIORITY.map((columnId) =>
      cells.find((cell) => cell.column.id === columnId)
    ).find(Boolean) ??
    cells.find((cell) => !UTILITY_COLUMNS.has(cell.column.id)) ??
    cells[0]
  )
}

interface MobileTableCardProps<TData extends RowData> {
  row: Row<TData>
  rowClassName?: RowClassNameFn
}

const MobileTableCard = memo(function MobileTableCard<TData extends RowData>({
  row,
  rowClassName,
}: MobileTableCardProps<TData>) {
  const cells = row.getVisibleCells()
  const selectCell = cells.find((cell) => cell.column.id === 'select')
  const actionCell = cells.find((cell) => cell.column.id === 'action')
  const primaryCell = pickPrimaryCell(cells)
  const detailCells = cells.filter(
    (cell) =>
      cell.id !== primaryCell?.id &&
      cell.column.id !== 'select' &&
      cell.column.id !== 'action'
  )
  const customClass = rowClassName?.(row.original as Record<string, unknown>)

  return (
    <article
      data-testid="mobile-table-card"
      className={cn(
        'rounded-lg border border-border/60 bg-card/40 p-3 shadow-xs',
        customClass
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        {selectCell && (
          <div className="-ml-1 shrink-0 pt-1">
            {flexRender(
              selectCell.column.columnDef.cell,
              selectCell.getContext()
            )}
          </div>
        )}

        {primaryCell && (
          <div className="min-w-0 flex-1">
            <div className="mb-1 text-[0.68rem] font-medium uppercase text-muted-foreground">
              {formatColumnLabel(primaryCell.column.id)}
            </div>
            <div className="min-w-0 text-sm font-medium text-foreground [&_*]:max-w-full [&_button]:justify-start [&_code]:whitespace-normal">
              {flexRender(
                primaryCell.column.columnDef.cell,
                primaryCell.getContext()
              )}
            </div>
          </div>
        )}

        {actionCell && (
          <div className="-mr-1 shrink-0">
            {flexRender(
              actionCell.column.columnDef.cell,
              actionCell.getContext()
            )}
          </div>
        )}
      </div>

      {detailCells.length > 0 && (
        <dl className="mt-3 divide-y divide-border/50">
          {detailCells.map((cell) => (
            <div
              key={cell.id}
              className="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] gap-2 py-2 first:pt-0 last:pb-0"
            >
              <dt className="min-w-0 truncate text-xs text-muted-foreground">
                {formatColumnLabel(cell.column.id)}
              </dt>
              <dd className="min-w-0 text-right text-sm text-foreground [&_*]:max-w-full [&_code]:whitespace-normal">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  )
}) as <TData extends RowData>(
  props: MobileTableCardProps<TData>
) => React.JSX.Element

export interface MobileTableCardsProps<TData extends RowData> {
  table: Table<TData>
  title: string
  activeFilterCount: number
  rowClassName?: RowClassNameFn
}

export const MobileTableCards = memo(function MobileTableCards<
  TData extends RowData,
>({
  table,
  title,
  activeFilterCount,
  rowClassName,
}: MobileTableCardsProps<TData>) {
  const rows = table.getRowModel().rows

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-border/50 bg-card/30 p-4">
        <Empty className="min-h-48 border-0 p-4">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX className="h-5 w-5" />
            </EmptyMedia>
            <EmptyTitle>No results</EmptyTitle>
            <EmptyDescription>
              {activeFilterCount > 0
                ? `No ${title?.toLowerCase() || 'data'} match your filters.`
                : `No ${title?.toLowerCase() || 'data'} found.`}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col gap-3"
      aria-label={`${title || 'Data'} cards`}
    >
      {rows.map((row) => (
        <MobileTableCard key={row.id} row={row} rowClassName={rowClassName} />
      ))}
    </div>
  )
}) as <TData extends RowData>(
  props: MobileTableCardsProps<TData>
) => React.JSX.Element
