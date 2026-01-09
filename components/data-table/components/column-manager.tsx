'use client'

import { type Table } from '@tanstack/react-table'
import { type ColumnOrderState } from '@tanstack/react-table'
import { arrayMove } from '@dnd-kit/sortable'
import { useCallback, useMemo } from 'react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { useAutoFitColumns } from '@/components/data-table/hooks/use-auto-fit-columns'

interface ColumnManagerProps<TData> {
  /** TanStack Table instance */
  table: Table<TData>
  /** Enable column reordering with drag-and-drop (default: true) */
  enableColumnReordering?: boolean
  /** Callback to reset column order */
  onResetColumnOrder?: () => void
  /** Callback for auto-fit column */
  onAutoFit?: (columnId: string) => void
  /** Container ref for auto-fit calculations */
  tableContainerRef?: React.RefObject<HTMLDivElement>
  /** Show/hide the auto-fit column option */
  showAutoFit?: boolean
}

/**
 * ColumnManager - Handles column-specific operations
 *
 * Features:
 * - Column visibility toggles
 * - Column reordering (drag-and-drop) support
 * - Auto-fit column width calculation
 * - Reset column order functionality
 *
 * This component provides a unified interface for all column operations,
 * abstracting away the complexity of TanStack Table state management.
 */
export function ColumnManager<TData>({
  table,
  enableColumnReordering = true,
  onResetColumnOrder,
  onAutoFit,
  tableContainerRef,
  showAutoFit = false,
}: ColumnManagerProps<TData>) {
  // Get all visible columns
  const allColumns = table.getAllLeafColumns()
  const visibleColumns = allColumns.filter((col) => col.getIsVisible())

  // Auto-fit functionality
  const { autoFitColumn } = useAutoFitColumns<TData>(tableContainerRef)
  const rows = table.getRowModel().rows

  // Handle auto-fit for a specific column
  const handleAutoFitColumn = useCallback(
    (columnId: string) => {
      if (!onAutoFit) {
        const column = table.getColumn(columnId)
        if (!column) return

        const headerText = column.columnDef.header as string
        autoFitColumn(column, rows, headerText)
      } else {
        onAutoFit(columnId)
      }
    },
    [table, rows, autoFitColumn, onAutoFit]
  )

  // Handle drag end for column reordering
  const handleDragEnd = useCallback(
    (activeId: string, overId: string) => {
      if (!enableColumnReordering) return

      const currentOrder = table.getState().columnOrder
      const allColumnIds = table.getAllLeafColumns().map((col) => col.id)
      const effectiveOrder = currentOrder.length > 0 ? currentOrder : allColumnIds

      const oldIndex = effectiveOrder.indexOf(activeId)
      const newIndex = effectiveOrder.indexOf(overId)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(effectiveOrder, oldIndex, newIndex)
        table.setColumnOrder(newOrder)
      }
    },
    [table, enableColumnReordering]
  )

  // Reset column order handler
  const handleResetOrder = useCallback(() => {
    if (onResetColumnOrder) {
      onResetColumnOrder()
    } else {
      table.setColumnOrder([])
    }
  }, [table, onResetColumnOrder])

  // Column visibility toggle
  const toggleColumnVisibility = useCallback(
    (columnId: string, visible: boolean) => {
      table.setColumnVisibility((prev) => ({
        ...prev,
        [columnId]: visible,
      }))
    },
    [table]
  )

  // Toggle all columns visibility
  const toggleAllColumns = useCallback(
    (visible: boolean) => {
      table.setColumnVisibility((prev) => {
        const newState: Record<string, boolean> = {}
        allColumns.forEach((col) => {
          newState[col.id] = visible
        })
        return newState
      })
    },
    [table, allColumns]
  )

  // Memoize the column list for rendering
  const columnList = useMemo(() => {
    return allColumns.map((column) => ({
      id: column.id,
      header: column.columnDef.header as string,
      isVisible: column.getIsVisible(),
    }))
  }, [allColumns])

  return (
    <div className="flex items-center gap-2">
      {/* Column Visibility Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            aria-label="Toggle column visibility"
          >
            <Eye className="mr-2 h-4 w-4" />
            Columns ({visibleColumns.length}/{allColumns.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Column Visibility</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Toggle all */}
          <DropdownMenuCheckboxItem
            checked={visibleColumns.length === allColumns.length}
            onCheckedChange={(checked) => toggleAllColumns(checked)}
          >
            All Columns
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />

          {/* Individual columns */}
          {columnList.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.isVisible}
              onCheckedChange={(checked) => toggleColumnVisibility(column.id, checked)}
            >
              {column.header || column.id}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Auto-fit Column Selector */}
      {showAutoFit && visibleColumns.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              aria-label="Auto-fit column"
              title="Auto-fit column width to content"
            >
              Auto-fit
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Auto-fit Column</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {visibleColumns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleAutoFitColumn(column.id)
                  }
                }}
                showIcon={false}
              >
                {column.columnDef.header as string || column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Reset Column Order */}
      {enableColumnReordering && (
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={handleResetOrder}
          aria-label="Reset column order"
          title="Reset column order to default"
        >
          Reset Order
        </Button>
      )}
    </div>
  )
}