'use client'

import {
  type Cell,
  type ColumnDef,
  type ColumnMeta,
  flexRender,
  type Row,
  type RowData,
  type Table,
} from '@tanstack/react-table'

import { memo, type ReactNode } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

/**
 * Virtual row item from @tanstack/react-virtual
 */
export interface VirtualItem {
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
 * Performance: Optimized for large datasets (1000+ rows), memoized to prevent re-renders
 */
export const VirtualizedTableRow = memo(function VirtualizedTableRow<
  TData extends RowData,
>({ row, virtualRow }: VirtualizedTableRowProps<TData>) {
  return (
    <TableRow
      key={row.id}
      data-state={row.getIsSelected() && 'selected'}
      data-index={virtualRow.index}
      className={cn(
        'border-b border-border/50 transition-colors hover:bg-muted/50',
        virtualRow.index % 2 === 1 && 'odd:bg-muted/30'
      )}
      style={{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      {row.getVisibleCells().map((cell: Cell<TData, unknown>) => {
        const isSelectColumn = cell.column.id === 'select'
        return (
          <TableCell
            key={cell.id}
            className={cn(
              'py-3 text-sm',
              isSelectColumn ? 'px-2' : 'px-4'
            )}
            style={{
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
) => JSX.Element

/**
 * Props for StandardTableRow component
 */
export interface StandardTableRowProps<TData extends RowData> {
  row: Row<TData>
  index: number
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
>({ row, index }: StandardTableRowProps<TData>) {
  return (
    <TableRow
      key={row.id}
      data-state={row.getIsSelected() && 'selected'}
      className={cn(
        'border-b border-border/50 transition-colors hover:bg-muted/50',
        index % 2 === 1 && 'odd:bg-muted/30'
      )}
    >
      {row.getVisibleCells().map((cell: Cell<TData, unknown>) => {
        const isSelectColumn = cell.column.id === 'select'
        return (
          <TableCell
            key={cell.id}
            className={cn(
              'py-3 text-sm',
              isSelectColumn ? 'px-2' : 'px-4'
            )}
            style={{
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
) => JSX.Element

/**
 * Virtualizer interface from @tanstack/react-virtual
 */
export interface Virtualizer {
  getVirtualItems(): VirtualItem[]
}

/**
 * Props for TableBodyRows component
 */
export interface TableBodyRowsProps<TData extends RowData> {
  table: Table<TData>
  isVirtualized: boolean
  virtualizer: Virtualizer | null
}

/**
 * TableBodyRows - Renders table rows with or without virtualization
 *
 * @param table - TanStack Table instance
 * @param isVirtualized - Whether virtualization is enabled
 * @param virtualizer - Virtual row instance when virtualization is enabled
 *
 * Automatically chooses rendering strategy based on dataset size:
 * - Virtualized rendering for 1000+ rows
 * - Standard rendering for smaller datasets
 *
 * Performance: Virtualization reduces DOM nodes from thousands to ~100, memoized to prevent re-renders
 */
export const TableBodyRows = memo(function TableBodyRows<
  TData extends RowData,
>({ table, isVirtualized, virtualizer }: TableBodyRowsProps<TData>) {
  const rows = table.getRowModel().rows

  if (isVirtualized && virtualizer) {
    // Virtualized rendering for large datasets
    const virtualRows = virtualizer.getVirtualItems()
    return (
      <>
        {virtualRows.map((virtualRow: VirtualItem) => {
          const row = rows[virtualRow.index]
          return (
            <VirtualizedTableRow<TData>
              key={row.id}
              row={row}
              virtualRow={virtualRow}
            />
          )
        })}
      </>
    )
  }

  // Standard rendering for smaller datasets
  return (
    <>
      {rows.map((row: Row<TData>, index: number) => (
        <StandardTableRow<TData> key={row.id} row={row} index={index} />
      ))}
    </>
  )
}) as <TData extends RowData>(props: TableBodyRowsProps<TData>) => JSX.Element

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
        <EmptyState
          variant="no-data"
          title="No results"
          description={
            activeFilterCount > 0
              ? `No ${title?.toLowerCase() || 'data'} match your filters. Try clearing filters or adjusting your search.`
              : `No ${title?.toLowerCase() || 'data'} found. Try adjusting your query or check back later.`
          }
        />
      </TableCell>
    </TableRow>
  )
}) as <TData extends RowData, TValue extends ReactNode>(
  props: TableBodyEmptyStateProps<TData, TValue>
) => JSX.Element

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
}: TableBodyProps<TData, TValue>) {
  const rows = table.getRowModel().rows

  return (
    <>
      {rows?.length ? (
        <TableBodyRows
          table={table}
          isVirtualized={isVirtualized}
          virtualizer={virtualizer}
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
) => JSX.Element
