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
  /** Callback when double-clicking column resizer to auto-fit */
  onAutoFit?: (columnId: string) => void
}

/**
 * Props for ColumnResizer component
 */
interface ColumnResizerProps {
  header: Header<any, unknown>
  /** Callback when double-clicking to auto-fit column width */
  onAutoFit?: (columnId: string) => void
}

/**
 * ColumnResizer - Drag handle for column resizing
 *
 * Double-click to auto-fit column width to content.
 * Drag to manually resize.
 */
function ColumnResizer({ header, onAutoFit }: ColumnResizerProps) {
  const handleDoubleClick = () => {
    if (onAutoFit) {
      onAutoFit(header.column.id)
    } else {
      header.column.resetSize()
    }
  }

  return (
    <div
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      onDoubleClick={handleDoubleClick}
      className={cn(
        'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
        'bg-transparent hover:bg-primary/50 active:bg-primary',
        'transition-colors',
        header.column.getIsResizing() && 'bg-primary'
      )}
      title={onAutoFit ? 'Drag to resize, double-click to auto-fit' : 'Drag to resize, double-click to reset'}
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
 * - Column resizing with drag handles and auto-fit on double-click
 *
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const TableHeaderRow = memo(function TableHeaderRow({
  headers,
  enableResize = true,
  onAutoFit,
}: TableHeaderRowProps) {
  return (
    <TableRow className="border-b border-border hover:bg-transparent">
      {headers.map((header) => {
        const canResize = enableResize && header.column.getCanResize()
        const isSelectColumn = header.column.id === 'select'
        return (
          <TableHead
            key={header.id}
            scope="col"
            className={cn(
              'relative py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground',
              isSelectColumn ? 'px-2' : 'px-4'
            )}
            style={{
              minWidth: header.column.columnDef.minSize ?? 50,
              maxWidth: header.column.columnDef.maxSize ?? undefined,
            }}
          >
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
            {canResize && <ColumnResizer header={header} onAutoFit={onAutoFit} />}
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
  /** Callback when double-clicking column resizer to auto-fit */
  onAutoFit?: (columnId: string) => void
}

/**
 * TableHeader - Renders the complete table header section
 *
 * @param headerGroups - Array of header groups from TanStack Table
 * @param onAutoFit - Callback for auto-fitting column width
 *
 * Renders all header groups (typically one) with TableHeaderRow components.
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const TableHeader = memo(function TableHeader({
  headerGroups,
  onAutoFit,
}: TableHeaderProps) {
  return (
    <>
      {headerGroups.map((headerGroup: any) => (
        <TableHeaderRow
          key={headerGroup.id}
          headers={headerGroup.headers}
          onAutoFit={onAutoFit}
        />
      ))}
    </>
  )
})
