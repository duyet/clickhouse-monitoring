'use client'

import { SearchX } from 'lucide-react'
import {
  type Cell,
  type ColumnDef,
  type ColumnMeta,
  flexRender,
  type Row,
  type RowData,
  type Table,
} from '@tanstack/react-table'

import type { RowClassNameFn } from '@/types/query-config'

import { memo, type ReactNode } from 'react'
import { useTableDensityContext } from '@/components/data-table/context/table-density-context'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const VIRTUALIZED_CELL_CLASS = 'text-sm whitespace-nowrap tabular-nums'
const STANDARD_CELL_CLASS = 'text-sm align-middle break-words tabular-nums'
const DEFAULT_COLUMN_SIZE = 150

function getCellWidth<TData extends RowData>(cell: Cell<TData, unknown>) {
  return (
    cell.column.getSize?.() ?? cell.column.columnDef.size ?? DEFAULT_COLUMN_SIZE
  )
}

/**
 * Virtual row item from @tanstack/react-virtual
 */
export interface VirtualItem {
  end: number
  index: number
  size: number
  start: number
}

/**
 * Props for VirtualizedTableRow component
 */
export interface VirtualizedTableRowProps<TData extends RowData> {
  row: Row<TData>
  virtualRow: VirtualItem
  rowClassName?: RowClassNameFn
}

/**
 * VirtualizedTableRow - Renders a single table row with virtualization styling
 *
 * Handles:
 * - Absolute positioning for virtual scrolling
 * - Dynamic height based on virtual row size
 * - Zebra striping with odd rows
 * - Hover effects
 *
 * Performance: Optimized for large datasets, memoized to prevent re-renders
 */
export const VirtualizedTableRow = memo(function VirtualizedTableRow<
  TData extends RowData,
>({ row, virtualRow, rowClassName }: VirtualizedTableRowProps<TData>) {
  const { cellClassName } = useTableDensityContext()
  const customClass = rowClassName?.(row.original as Record<string, unknown>)
  return (
    <TableRow
      key={row.id}
      data-state={row.getIsSelected() ? 'selected' : undefined}
      data-index={virtualRow.index}
      className={cn(
        'border-b border-border/50 transition-colors hover:bg-accent/50 dark:hover:bg-accent/20',
        virtualRow.index % 2 === 1 && 'odd:bg-muted/30',
        row.getIsSelected() && 'border-l-2 border-l-primary',
        customClass
      )}
      style={{
        height: `${virtualRow.size}px`,
      }}
    >
      {row.getVisibleCells().map((cell: Cell<TData, unknown>) => {
        return (
          <TableCell
            key={cell.id}
            className={cn(VIRTUALIZED_CELL_CLASS, cellClassName)}
            style={{
              width: getCellWidth(cell),
              minWidth: cell.column.columnDef.minSize ?? 50,
              maxWidth: cell.column.columnDef.maxSize ?? undefined,
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableRow>
  )
}) as <TData extends RowData>(
  props: VirtualizedTableRowProps<TData>
) => React.JSX.Element

/**
 * Props for StandardTableRow component
 */
export interface StandardTableRowProps<TData extends RowData> {
  row: Row<TData>
  index: number
  rowClassName?: RowClassNameFn
}

/**
 * StandardTableRow - Renders a single table row without virtualization
 *
 * Handles:
 * - Standard row rendering with flexRender
 * - Zebra striping with odd rows
 * - Hover effects
 * - Selection state
 *
 * Performance: Suitable for small to medium datasets (< 1000 rows), memoized to prevent re-renders
 */
export const StandardTableRow = memo(function StandardTableRow<
  TData extends RowData,
>({ row, index, rowClassName }: StandardTableRowProps<TData>) {
  const { cellClassName } = useTableDensityContext()
  const customClass = rowClassName?.(row.original as Record<string, unknown>)
  return (
    <TableRow
      key={row.id}
      data-state={row.getIsSelected() ? 'selected' : undefined}
      className={cn(
        'border-b border-border/50 transition-colors hover:bg-accent/50 dark:hover:bg-accent/20',
        index % 2 === 1 && 'odd:bg-muted/30',
        row.getIsSelected() && 'border-l-2 border-l-primary',
        customClass
      )}
    >
      {row.getVisibleCells().map((cell: Cell<TData, unknown>) => {
        return (
          <TableCell
            key={cell.id}
            className={cn(STANDARD_CELL_CLASS, cellClassName)}
            style={{
              width: getCellWidth(cell),
              minWidth: cell.column.columnDef.minSize ?? 50,
              maxWidth: cell.column.columnDef.maxSize ?? undefined,
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableRow>
  )
}) as <TData extends RowData>(
  props: StandardTableRowProps<TData>
) => React.JSX.Element

/**
 * Virtualizer interface from @tanstack/react-virtual
 */
export interface Virtualizer {
  getVirtualItems(): VirtualItem[]
  getTotalSize(): number
}

/**
 * Props for TableBodyRows component
 */
export interface TableBodyRowsProps<TData extends RowData> {
  table: Table<TData>
  isVirtualized: boolean
  virtualizer: Virtualizer | null
  rowClassName?: RowClassNameFn
}

/**
 * TableBodyRows - Renders table rows with or without virtualization
 *
 * @param table - TanStack Table instance
 * @param isVirtualized - Whether virtualization is enabled
 * @param virtualizer - Virtual row instance when virtualization is enabled
 *
 * Automatically chooses rendering strategy based on dataset size:
 * - Virtualized rendering for large row sets
 * - Standard rendering for smaller datasets
 *
 * Performance: Virtualization reduces DOM nodes from thousands to ~100, memoized to prevent re-renders
 */
export const TableBodyRows = memo(function TableBodyRows<
  TData extends RowData,
>({
  table,
  isVirtualized,
  virtualizer,
  rowClassName,
}: TableBodyRowsProps<TData>) {
  const rows = table.getRowModel().rows

  if (isVirtualized && virtualizer) {
    // Virtualized rendering for large datasets
    const virtualRows = virtualizer.getVirtualItems()
    const firstVirtualRow = virtualRows[0]
    const lastVirtualRow = virtualRows.at(-1)
    const paddingTop = firstVirtualRow?.start ?? 0
    const paddingBottom = lastVirtualRow
      ? Math.max(virtualizer.getTotalSize() - lastVirtualRow.end, 0)
      : 0
    const colSpan = Math.max(table.getVisibleLeafColumns().length, 1)

    return (
      <>
        {paddingTop > 0 && (
          <TableRow
            aria-hidden="true"
            data-virtual-spacer="top"
            className="border-0 hover:bg-transparent"
          >
            <TableCell
              colSpan={colSpan}
              className="border-0 p-0"
              style={{ height: `${paddingTop}px` }}
            />
          </TableRow>
        )}
        {virtualRows.map((virtualRow: VirtualItem) => {
          const row = rows[virtualRow.index]
          if (!row) return null

          return (
            <VirtualizedTableRow<TData>
              key={row.id}
              row={row}
              virtualRow={virtualRow}
              rowClassName={rowClassName}
            />
          )
        })}
        {paddingBottom > 0 && (
          <TableRow
            aria-hidden="true"
            data-virtual-spacer="bottom"
            className="border-0 hover:bg-transparent"
          >
            <TableCell
              colSpan={colSpan}
              className="border-0 p-0"
              style={{ height: `${paddingBottom}px` }}
            />
          </TableRow>
        )}
      </>
    )
  }

  // Standard rendering for smaller datasets
  return (
    <>
      {rows.map((row: Row<TData>, index: number) => (
        <StandardTableRow<TData>
          key={row.id}
          row={row}
          index={index}
          rowClassName={rowClassName}
        />
      ))}
    </>
  )
}) as <TData extends RowData>(
  props: TableBodyRowsProps<TData>
) => React.JSX.Element

/**
 * Column metadata type for column definitions
 */
export type ColumnMetaType = ColumnMeta<unknown, unknown>

/**
 * Props for TableBodyEmptyState component
 */
export interface TableBodyEmptyStateProps<
  TData extends RowData,
  TValue extends ReactNode,
> {
  columnDefs: ColumnDef<TData, TValue>[]
  title: string
  activeFilterCount: number
}

/**
 * TableBodyEmptyState - Renders empty state when no rows are available
 *
 * @param columnDefs - Column definitions for colspan calculation
 * @param title - Table title for context in empty state message
 * @param activeFilterCount - Number of active filters for contextual messaging
 *
 * Shows different messages based on whether filters are active:
 * - With filters: Suggests clearing filters
 * - Without filters: Suggests adjusting query or checking back later
 *
 * Performance: Memoized to prevent re-renders
 */
export const TableBodyEmptyState = memo(function TableBodyEmptyState<
  TData extends RowData,
  TValue extends ReactNode,
>({
  columnDefs,
  title,
  activeFilterCount,
}: TableBodyEmptyStateProps<TData, TValue>) {
  return (
    <TableRow>
      <TableCell colSpan={columnDefs.length} className="h-64 p-4">
        <Empty className="h-full min-h-48 border-0 p-4 md:p-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX className="h-5 w-5" />
            </EmptyMedia>
            <EmptyTitle>No results</EmptyTitle>
            <EmptyDescription>
              {activeFilterCount > 0
                ? `No ${title?.toLowerCase() || 'data'} match your filters. Try clearing filters or adjusting your search.`
                : `No ${title?.toLowerCase() || 'data'} found. Try adjusting your query or check back later.`}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </TableCell>
    </TableRow>
  )
}) as <TData extends RowData, TValue extends ReactNode>(
  props: TableBodyEmptyStateProps<TData, TValue>
) => React.JSX.Element

/**
 * Props for TableBody component
 */
export interface TableBodyProps<
  TData extends RowData,
  TValue extends ReactNode,
> {
  table: Table<TData>
  columnDefs: ColumnDef<TData, TValue>[]
  isVirtualized: boolean
  virtualizer: Virtualizer | null
  title: string
  activeFilterCount: number
  rowClassName?: RowClassNameFn
}

/**
 * TableBody - Renders the complete table body section
 *
 * @param table - TanStack Table instance
 * @param columnDefs - Column definitions for empty state
 * @param isVirtualized - Whether virtualization is enabled
 * @param virtualizer - Virtual row instance
 * @param title - Table title for empty state context
 * @param activeFilterCount - Active filter count for empty state context
 *
 * Handles:
 * - Conditional rendering of rows vs empty state
 * - Virtualization strategy selection
 * - Contextual empty state messaging
 *
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const TableBody = memo(function TableBody<
  TData extends RowData,
  TValue extends ReactNode,
>({
  table,
  columnDefs,
  isVirtualized,
  virtualizer,
  title,
  activeFilterCount,
  rowClassName,
}: TableBodyProps<TData, TValue>) {
  const rows = table.getRowModel().rows

  return (
    <>
      {rows?.length ? (
        <TableBodyRows
          table={table}
          isVirtualized={isVirtualized}
          virtualizer={virtualizer}
          rowClassName={rowClassName}
        />
      ) : (
        <TableBodyEmptyState
          columnDefs={columnDefs}
          title={title}
          activeFilterCount={activeFilterCount}
        />
      )}
    </>
  )
}) as <TData extends RowData, TValue extends ReactNode>(
  props: TableBodyProps<TData, TValue>
) => React.JSX.Element
