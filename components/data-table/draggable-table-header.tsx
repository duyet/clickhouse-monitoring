/**
 * Draggable Table Header Component
 *
 * Standalone component that integrates with @dnd-kit for column reordering.
 * This file is lazy-loaded only when column reordering is enabled.
 *
 * Separated from table-header.tsx to enable code splitting.
 */

'use client'

import { GripVertical } from 'lucide-react'
import { flexRender, type Header } from '@tanstack/react-table'

import type { DraggableTableHeaderProps } from './lazy-dnd'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { memo } from 'react'
import { ColumnHeaderDropdown } from '@/components/data-table/buttons/column-header-dropdown'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

/**
 * ColumnResizer component (duplicated from table-header.tsx to keep this file standalone)
 */
interface ColumnResizerProps {
  header: Header<any, unknown>
  onAutoFit?: (columnId: string) => void
}

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
 * DraggableTableHeader - Column header with drag-and-drop support
 *
 * Integrates with @dnd-kit for column reordering while maintaining
 * all existing functionality (sorting, resizing, etc.).
 *
 * This component is lazy-loaded to reduce initial bundle size.
 */
export const DraggableTableHeader = memo(function DraggableTableHeader({
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
  const _canSort = header.column.getCanSort()

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
            {_canSort && <ColumnHeaderDropdown header={header} />}
          </div>
        </div>
      </div>
      {canResize && <ColumnResizer header={header} onAutoFit={onAutoFit} />}
    </TableHead>
  )
})
