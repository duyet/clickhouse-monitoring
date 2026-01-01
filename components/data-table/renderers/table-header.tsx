'use client'

import { flexRender, type Header } from '@tanstack/react-table'

import { memo } from 'react'
import { TableHead, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

/**
 * Props for TableHeaderRow component
 */
export interface TableHeaderRowProps {
  headers: Header<any, unknown>[]
  /** Whether column resizing is enabled */
  enableResize?: boolean
}

/**
 * ColumnResizer - Drag handle for column resizing
 */
function ColumnResizer({ header }: { header: Header<any, unknown> }) {
  return (
    <div
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      onDoubleClick={() => header.column.resetSize()}
      className={cn(
        'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
        'bg-transparent hover:bg-primary/50 active:bg-primary',
        'transition-colors',
        header.column.getIsResizing() && 'bg-primary'
      )}
      title="Drag to resize, double-click to reset"
    />
  )
}

/**
 * TableHeaderRow - Renders a single header row with sortable columns
 *
 * Handles:
 * - Column header rendering with flexRender for custom content
 * - Placeholder cells for expandable rows
 * - Consistent styling with hover effects
 * - Column resizing with drag handles
 *
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const TableHeaderRow = memo(function TableHeaderRow({
  headers,
  enableResize = true,
}: TableHeaderRowProps) {
  return (
    <TableRow className="border-b border-border hover:bg-transparent">
      {headers.map((header) => {
        const canResize = enableResize && header.column.getCanResize()
        return (
          <TableHead
            key={header.id}
            scope="col"
            className="relative px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
            style={{
              width: header.getSize(),
              minWidth: header.column.columnDef.minSize ?? 50,
              maxWidth: header.column.columnDef.maxSize ?? undefined,
            }}
          >
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
            {canResize && <ColumnResizer header={header} />}
          </TableHead>
        )
      })}
    </TableRow>
  )
})

/**
 * Props for TableHeader component
 */
export interface TableHeaderProps {
  headerGroups: any
}

/**
 * TableHeader - Renders the complete table header section
 *
 * @param headerGroups - Array of header groups from TanStack Table
 *
 * Renders all header groups (typically one) with TableHeaderRow components.
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const TableHeader = memo(function TableHeader({
  headerGroups,
}: TableHeaderProps) {
  return (
    <>
      {headerGroups.map((headerGroup: any) => (
        <TableHeaderRow key={headerGroup.id} headers={headerGroup.headers} />
      ))}
    </>
  )
})
