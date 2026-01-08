'use client'

import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import { flexRender, type Header } from '@tanstack/react-table'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { memo } from 'react'
import { ColumnHeaderDropdown } from '@/components/data-table/buttons/column-header-dropdown'
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
  /** Enable column reordering with drag-and-drop */
  enableColumnReordering?: boolean
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
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={header.column.getSize()}
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      onDoubleClick={handleDoubleClick}
      className={cn(
        'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
        'bg-transparent hover:bg-primary/50 active:bg-primary',
        'transition-colors',
        header.column.getIsResizing() && 'bg-primary'
      )}
      title={
        onAutoFit
          ? 'Drag to resize, double-click to auto-fit'
          : 'Drag to resize, double-click to reset'
      }
    />
  )
}

/**
 * Props for DraggableTableHeader component
 */
interface DraggableTableHeaderProps {
  header: Header<any, unknown>
  enableResize?: boolean
  onAutoFit?: (columnId: string) => void
  isSelectColumn?: boolean
}

/**
 * DraggableTableHeader - Column header with drag-and-drop support
 *
 * Integrates with @dnd-kit for column reordering while maintaining
 * all existing functionality (sorting, resizing, etc.).
 */
function DraggableTableHeader({
  header,
  enableResize,
  onAutoFit,
  isSelectColumn,
}: DraggableTableHeaderProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: header.column.id,
    })

  const canResize = enableResize && header.column.getCanResize()
  const canSort = header.column.getCanSort()
  const _isSorted = header.column.getIsSorted()

  const style = {
    // Apply CSS transform during drag for visual feedback
    // After drag ends, TanStack Table's columnOrder state takes over
    transform: CSS.Transform.toString(transform),
    width: 'auto' as const,
    minWidth: 0,
  }

  return (
    <TableHead
      ref={setNodeRef}
      key={header.id}
      scope="col"
      className={cn(
        'relative py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground',
        isSelectColumn ? 'px-2' : 'px-4',
        // Visual feedback during drag
        isDragging && 'opacity-50'
      )}
      style={style}
      colSpan={header.colSpan}
    >
      <div className="group flex items-center">
        {/* Drag handle for column reordering - hidden by default, shown on hover */}
        <button
          {...attributes}
          {...listeners}
          className={cn(
            'mr-1.5 cursor-grab active:cursor-grabbing text-muted-foreground opacity-0',
            'group-hover:opacity-40 hover:opacity-100 focus:opacity-100',
            'focus:outline-none',
            'transition-opacity',
            'disabled:cursor-default disabled:opacity-50'
          )}
          aria-label={`Drag to reorder ${header.column.id} column`}
          tabIndex={0}
          style={{ touchAction: 'none' }}
          onClick={(e) => e.stopPropagation()} // Prevent drag from triggering sort
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1">
          <div className="group flex items-center gap-1">
            <span className="flex-1">
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
            </span>
            {/* Dropdown menu for sort/copy actions - shown on hover */}
            {canSort && <ColumnHeaderDropdown header={header} />}
          </div>
        </div>
      </div>
      {canResize && <ColumnResizer header={header} onAutoFit={onAutoFit} />}
    </TableHead>
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
 * - Column reordering with drag-and-drop (when enabled)
 *
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const TableHeaderRow = memo(function TableHeaderRow({
  headers,
  enableResize = true,
  onAutoFit,
  enableColumnReordering = false,
}: TableHeaderRowProps) {
  // Extract column IDs for SortableContext (when reordering is enabled)
  const _columnIds = headers.map((header) => header.column.id)

  return (
    <TableRow className="border-b border-border hover:bg-transparent">
      {headers.map((header) => {
        const canResize = enableResize && header.column.getCanResize()
        const isSelectColumn = header.column.id === 'select'
        const canSort = header.column.getCanSort()

        // Select column is never draggable
        if (isSelectColumn) {
          return (
            <TableHead
              key={header.id}
              scope="col"
              className={cn(
                'relative py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground',
                'px-2'
              )}
              style={{
                width: 'auto',
                minWidth: 0,
              }}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
          )
        }

        // If column reordering is enabled, use DraggableTableHeader
        if (enableColumnReordering) {
          return (
            <DraggableTableHeader
              key={header.id}
              header={header}
              enableResize={enableResize}
              onAutoFit={onAutoFit}
              isSelectColumn={isSelectColumn}
            />
          )
        }

        // Standard header without drag-and-drop, but with sort dropdown and click-to-sort
        const isSorted = header.column.getIsSorted()
        return (
          <TableHead
            key={header.id}
            scope="col"
            className={cn(
              'relative py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground',
              isSelectColumn ? 'px-2' : 'px-4',
              // Show pointer cursor for sortable columns
              canSort && 'cursor-pointer hover:text-foreground'
            )}
            style={{
              minWidth: header.column.columnDef.minSize ?? 50,
              maxWidth: header.column.columnDef.maxSize ?? undefined,
              width: header.column.getSize(),
            }}
          >
            <div className="group flex items-center">
              <div className="flex-1">
                <div className="group flex items-center gap-1">
                  {/* Sort indicator */}
                  {isSorted === 'asc' && (
                    <ArrowUp className="h-3.5 w-3.5 text-primary" />
                  )}
                  {isSorted === 'desc' && (
                    <ArrowDown className="h-3.5 w-3.5 text-primary" />
                  )}
                  <span
                    role={canSort ? 'button' : undefined}
                    tabIndex={canSort ? 0 : undefined}
                    className={cn(
                      'flex-1',
                      // Make header clickable for sorting
                      canSort && 'cursor-pointer'
                    )}
                    onClick={(e) => {
                      if (canSort) {
                        const toggleHandler =
                          header.column.getToggleSortingHandler()
                        if (toggleHandler) {
                          toggleHandler(e)
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (canSort && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        const toggleHandler =
                          header.column.getToggleSortingHandler()
                        if (toggleHandler) {
                          toggleHandler(e)
                        }
                      }
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </span>
                  {/* Dropdown menu for sort/copy actions - shown on hover */}
                  {canSort && <ColumnHeaderDropdown header={header} />}
                </div>
              </div>
            </div>
            {canResize && (
              <ColumnResizer header={header} onAutoFit={onAutoFit} />
            )}
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
  /** Enable column reordering with drag-and-drop */
  enableColumnReordering?: boolean
}

/**
 * TableHeader - Renders the complete table header section
 *
 * @param headerGroups - Array of header groups from TanStack Table
 * @param onAutoFit - Callback for auto-fitting column width
 * @param enableColumnReordering - Enable drag-and-drop column reordering
 *
 * Renders all header groups (typically one) with TableHeaderRow components.
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const TableHeader = memo(function TableHeader({
  headerGroups,
  onAutoFit,
  enableColumnReordering = false,
}: TableHeaderProps) {
  return (
    <>
      {headerGroups.map((headerGroup: any) => (
        <TableHeaderRow
          key={headerGroup.id}
          headers={headerGroup.headers}
          onAutoFit={onAutoFit}
          enableColumnReordering={enableColumnReordering}
        />
      ))}
    </>
  )
})
