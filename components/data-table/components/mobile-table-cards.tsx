'use client'

import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  SearchX,
  SortAsc,
  SortDesc,
} from 'lucide-react'
import {
  type Cell,
  type Column,
  flexRender,
  type Row,
  type RowData,
  type Table,
} from '@tanstack/react-table'
import type { VirtualItem } from '@tanstack/react-virtual'

import type { UseVirtualRowsResult } from '@/components/data-table/hooks/use-virtual-rows'
import type {
  ExpandableConfig,
  ExpandedRenderer,
  RowClassNameFn,
} from '@/types/query-config'

import { Fragment } from 'react'
import { EXPAND_COLUMN_ID } from '@/components/data-table/column-defs'
import { DefaultExpandedRow } from '@/components/data-table/row-expand/default-renderer'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'

const UTILITY_COLUMNS = new Set(['select', 'action', EXPAND_COLUMN_ID])
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

function getColumnLabel<TData extends RowData>(column: Column<TData, unknown>) {
  return typeof column.columnDef.header === 'string'
    ? column.columnDef.header
    : formatColumnLabel(column.id)
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

function MobileSortMenu<TData extends RowData>({
  table,
}: {
  table: Table<TData>
}) {
  const sortableColumns = table
    .getVisibleLeafColumns()
    .filter((column) => column.getCanSort() && !UTILITY_COLUMNS.has(column.id))

  if (!sortableColumns.length) {
    return null
  }

  const activeSort = table.getState().sorting[0]
  const activeColumn = activeSort ? table.getColumn(activeSort.id) : null
  const activeLabel = activeColumn
    ? `${getColumnLabel(activeColumn)} ${activeSort.desc ? 'desc' : 'asc'}`
    : 'Sort'

  return (
    <div className="mb-3 flex justify-end">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 max-w-full gap-2 text-xs"
            data-testid="mobile-table-sort"
          >
            <ArrowUpDown className="size-3.5 shrink-0" />
            <span className="min-w-0 truncate">{activeLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="max-h-80 w-56 overflow-y-auto"
        >
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          {sortableColumns.map((column) => {
            const label = getColumnLabel(column)
            const isAsc =
              activeSort?.id === column.id && activeSort.desc === false
            const isDesc =
              activeSort?.id === column.id && activeSort.desc === true

            return (
              <Fragment key={column.id}>
                <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                  <SortAsc className="mr-2 size-3.5" />
                  <span className="min-w-0 flex-1 truncate">
                    {label} ascending
                  </span>
                  {isAsc && <Check className="ml-2 size-3.5" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                  <SortDesc className="mr-2 size-3.5" />
                  <span className="min-w-0 flex-1 truncate">
                    {label} descending
                  </span>
                  {isDesc && <Check className="ml-2 size-3.5" />}
                </DropdownMenuItem>
              </Fragment>
            )
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => table.resetSorting()}>
            <RotateCcw className="mr-2 size-3.5" />
            Reset sort
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

interface MobileTableCardProps<TData extends RowData> {
  row: Row<TData>
  rowClassName?: RowClassNameFn
  expandable?: true | ExpandableConfig
}

const MobileTableCard = function MobileTableCard<TData extends RowData>({
  row,
  rowClassName,
  expandable,
}: MobileTableCardProps<TData>) {
  const cells = row.getVisibleCells()
  const selectCell = cells.find((cell) => cell.column.id === 'select')
  const actionCell = cells.find((cell) => cell.column.id === 'action')
  const primaryCell = pickPrimaryCell(cells)
  const detailCells = cells.filter(
    (cell) =>
      cell.id !== primaryCell?.id && !UTILITY_COLUMNS.has(cell.column.id)
  )
  const customClass = rowClassName?.(row.original as Record<string, unknown>)
  const isExpandable = !!expandable && row.getCanExpand()
  const isExpanded = isExpandable && row.getIsExpanded()
  const ExpandIcon = isExpanded ? ChevronDown : ChevronRight

  return (
    <article
      data-testid="mobile-table-card"
      data-expanded={isExpanded || undefined}
      className={cn(
        'rounded-lg border border-border/60 bg-card/40 p-3',
        customClass
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        {isExpandable && (
          <button
            type="button"
            onClick={() => row.toggleExpanded()}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
            className="-ml-1 mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            data-testid="mobile-table-card-expand"
          >
            <ExpandIcon className="size-4" />
          </button>
        )}

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

      {isExpanded && (
        <div className="mt-3 border-t border-border/50 pt-3 animate-in fade-in slide-in-from-top-1 duration-150">
          {expandable === true ? (
            <DefaultExpandedRow row={row.original as Record<string, unknown>} />
          ) : (
            (expandable.renderExpanded as ExpandedRenderer)(
              row.original as Record<string, unknown>,
              { row: row as unknown as Row<Record<string, unknown>> }
            )
          )}
        </div>
      )}
    </article>
  )
} as <TData extends RowData>(
  props: MobileTableCardProps<TData>
) => React.JSX.Element

export interface MobileTableCardsProps<TData extends RowData> {
  table: Table<TData>
  title: string
  activeFilterCount: number
  rowClassName?: RowClassNameFn
  isVirtualized?: boolean
  virtualizer?: UseVirtualRowsResult['virtualizer']
  expandable?: true | ExpandableConfig
}

export const MobileTableCards = function MobileTableCards<
  TData extends RowData,
>({
  table,
  title,
  activeFilterCount,
  rowClassName,
  isVirtualized = false,
  virtualizer,
  expandable,
}: MobileTableCardsProps<TData>) {
  const rows = table.getRowModel().rows

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-border/50 bg-card/30 p-4">
        <Empty className="min-h-48 border-0 p-4">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX className="size-5" />
            </EmptyMedia>
            <EmptyTitle>No results</EmptyTitle>
            <EmptyDescription>
              {activeFilterCount > 0
                ? `No ${title?.toLowerCase() || 'data'} match your filters. Try clearing filters or adjusting your search.`
                : `No ${title?.toLowerCase() || 'data'} found. Try adjusting your query or check back later.`}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  const virtualRows =
    isVirtualized && virtualizer ? virtualizer.getVirtualItems() : null

  return (
    <div aria-label={`${title || 'Data'} cards`}>
      <MobileSortMenu table={table} />
      {virtualRows ? (
        <div
          className="relative"
          style={{ height: `${virtualizer?.getTotalSize() ?? 0}px` }}
        >
          {virtualRows.map((virtualRow: VirtualItem) => {
            const row = rows[virtualRow.index]
            if (!row) return null

            return (
              <div
                key={row.id}
                data-index={virtualRow.index}
                ref={(node) => {
                  if (node) virtualizer?.measureElement(node)
                }}
                className="absolute left-0 top-0 w-full pb-3"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <MobileTableCard
                  row={row}
                  rowClassName={rowClassName}
                  expandable={expandable}
                />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <MobileTableCard
              key={row.id}
              row={row}
              rowClassName={rowClassName}
              expandable={expandable}
            />
          ))}
        </div>
      )}
    </div>
  )
} as <TData extends RowData>(
  props: MobileTableCardsProps<TData>
) => React.JSX.Element
