'use client'

import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import { flexRender, type Header } from '@tanstack/react-table'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { memo } from 'react'
import { ColumnHeaderDropdown } from '@/components/data-table/buttons/column-header-dropdown'
import { Button } from '@/components/ui/button'
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
  /** Compact mode — reduces header padding to match dense body cells */
  compact?: boolean
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
      // PointerSensor (dnd-kit) listens for pointerdown to start a column
      // drag; stop it here so resize wins. Also block the synthetic click so
      // the header sort handler doesn't fire on mouseup.
      onPointerDown={(e) => {
        e.stopPropagation()
        header.getResizeHandler()(e)
      }}
      onTouchStart={(e) => {
        e.stopPropagation()
        header.getResizeHandler()(e)
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation()
        handleDoubleClick()
      }}
      className={cn(
        'absolute right-0 top-0 z-20 h-full w-2 -mr-1 cursor-col-resize select-none touch-none',
        'after:absolute after:right-1 after:top-0 after:h-full after:w-px',
        'after:bg-border/40 hover:after:bg-primary active:after:bg-primary',
        'after:transition-colors',
        header.column.getIsResizing() && 'after:bg-primary'
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
  compact?: boolean
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
  compact,
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
    width: header.column.getSize(),
    minWidth: header.column.columnDef.minSize ?? 50,
    maxWidth: header.column.columnDef.maxSize ?? undefined,
  }

  const headerPy = compact ? 'py-0.5' : 'py-1.5'
  const headerPx = isSelectColumn ? 'px-2' : compact ? 'px-1' : 'px-4'

  return (
    <TableHead
      ref={setNodeRef}
      key={header.id}
      scope="col"
      className={cn('relative', headerPy, headerPx, isDragging && 'opacity-50')}
      style={style}
      colSpan={header.colSpan}
    >
      <div className="group flex min-w-0 items-center pr-2">
        {/* Drag handle for column reordering - hidden by default, shown on hover */}
        <Button
          {...attributes}
          {...listeners}
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            'mr-1.5 hidden size-7 shrink-0 cursor-grab text-muted-foreground opacity-0 sm:inline-flex',
            'active:cursor-grabbing',
            'group-hover:opacity-40 hover:opacity-100 focus:opacity-100 focus-visible:opacity-100',
            'transition',
            'disabled:cursor-default disabled:opacity-50'
          )}
          aria-label={`Drag to reorder ${header.column.id} column`}
          tabIndex={0}
          style={{ touchAction: 'none' }}
          onClick={(e) => e.stopPropagation()} // Prevent drag from triggering sort
        >
          <GripVertical data-icon className="h-3.5 w-3.5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="group flex min-w-0 items-center gap-1">
            <span className="min-w-0 flex-1 truncate">
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
  compact = false,
}: TableHeaderRowProps) {
  // Header padding matches body cell density
  const headerPx = compact ? 'px-1' : 'px-4'
  const headerPy = compact ? 'py-0.5' : 'py-1.5'

  return (
    <TableRow className="border-b border-border/70 hover:bg-transparent">
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
              className={cn('relative', headerPy, 'px-2')}
              style={{
                width: header.column.getSize(),
                minWidth: header.column.columnDef.minSize ?? 50,
                maxWidth: header.column.columnDef.maxSize ?? undefined,
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
              compact={compact}
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
              'relative',
              headerPy,
              isSelectColumn ? 'px-2' : headerPx,
              // Show pointer cursor for sortable columns
              canSort && 'cursor-pointer hover:text-foreground'
            )}
            style={{
              minWidth: header.column.columnDef.minSize ?? 50,
              maxWidth: header.column.columnDef.maxSize ?? undefined,
              width: header.column.getSize(),
            }}
          >
            <div className="group flex min-w-0 items-center pr-2">
              <div className="min-w-0 flex-1">
                <div className="group flex min-w-0 items-center gap-1">
                  {/* Sort indicator */}
                  {isSorted === 'asc' && (
                    <ArrowUp className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                  {isSorted === 'desc' && (
                    <ArrowDown className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                  <span
                    role={canSort ? 'button' : undefined}
                    tabIndex={canSort ? 0 : undefined}
                    className={cn(
                      'min-w-0 flex-1 truncate',
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
  /** Compact mode — reduces header padding to match dense body cells */
  compact?: boolean
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
  compact = false,
}: TableHeaderProps) {
  return (
    <>
      {headerGroups.map((headerGroup: any) => (
        <TableHeaderRow
          key={headerGroup.id}
          headers={headerGroup.headers}
          onAutoFit={onAutoFit}
          enableColumnReordering={enableColumnReordering}
          compact={compact}
        />
      ))}
    </>
  )
})
