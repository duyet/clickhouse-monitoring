'use client'

import type {
  ColumnDef,
  ColumnOrderState,
  ColumnSizingState,
  RowData,
  Table,
} from '@tanstack/react-table'
import { arrayMove } from '@dnd-kit/sortable'
import { useCallback, useMemo } from 'react'
import { useAutoFitColumns } from './hooks/use-auto-fit-columns'

export interface ColumnManagerProps<TData extends RowData> {
  /** Table instance from TanStack Table */
  table: Table<TData>
  /** Column definitions */
  columns: ColumnDef<TData, unknown>[]
  /** Current column order */
  columnOrder: ColumnOrderState
  /** Callback to update column order */
  onColumnOrderChange: (order: ColumnOrderState) => void
  /** Current column sizing */
  columnSizing: ColumnSizingState
  /** Callback to update column sizing */
  onColumnSizingChange: (sizing: ColumnSizingState) => void
  /** Current column visibility */
  columnVisibility: Record<string, boolean>
  /** Callback to update column visibility */
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void
  /** Table container ref for auto-fit calculation */
  tableContainerRef: React.RefObject<HTMLDivElement>
  /** Enable column reordering (default: true) */
  enableColumnReordering?: boolean
  /** Callback to reset column order */
  onResetColumnOrder?: () => void
}

/**
 * ColumnManager - Handles column-specific operations
 *
 * Provides:
 * - Column visibility management
 * - Column reordering with drag-and-drop
 * - Column resizing
 * - Column auto-fitting
 * - Column order reset
 *
 * Usage:
 * ```typescript
 * const ColumnManager = ({ table, columns, columnOrder, onColumnOrderChange }) => {
 *   const { handleDragEnd, handleAutoFit, handleResetOrder } = ColumnManager(...)
 *   // Use in drag end handlers and toolbar
 * }
 * ```
 */
export function ColumnManager<TData extends RowData>({
  table,
  columns,
  columnOrder,
  onColumnOrderChange,
  columnSizing,
  onColumnSizingChange,
  columnVisibility,
  onColumnVisibilityChange,
  tableContainerRef,
  enableColumnReordering = true,
  onResetColumnOrder,
}: ColumnManagerProps<TData>) {
  // Auto-fit columns functionality
  const { autoFitColumn } = useAutoFitColumns<TData>(tableContainerRef)

  // Get all leaf columns for operations
  const allLeafColumns = useMemo(() => {
    return table.getAllLeafColumns()
  }, [table])

  // Handle drag end event for column reordering
  const handleDragEnd = useCallback(
    (activeId: string, overId: string) => {
      if (!enableColumnReordering) return

      const currentOrder = table.getState().columnOrder
      const allColumnIds = allLeafColumns.map((col) => col.id)

      // Use currentOrder if it has values, otherwise use all columns in natural order
      const effectiveOrder =
        currentOrder.length > 0 ? currentOrder : allColumnIds

      const oldIndex = effectiveOrder.indexOf(activeId)
      const newIndex = effectiveOrder.indexOf(overId)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(effectiveOrder, oldIndex, newIndex)
        onColumnOrderChange(newOrder)
      }
    },
    [enableColumnReordering, table, allLeafColumns, onColumnOrderChange]
  )

  // Handle auto-fit request for a specific column
  const handleAutoFit = useCallback(
    (columnId: string) => {
      const column = table.getColumn(columnId)
      if (!column) return

      const rows = table.getRowModel().rows
      const headerText = column.columnDef.header as string
      autoFitColumn(column, rows, headerText)
    },
    [table, autoFitColumn]
  )

  // Handle column visibility toggle
  const handleColumnVisibility = useCallback(
    (columnId: string, visible: boolean) => {
      onColumnVisibilityChange({
        ...columnVisibility,
        [columnId]: visible,
      })
    },
    [columnVisibility, onColumnVisibilityChange]
  )

  // Toggle all columns visibility
  const handleToggleAllColumns = useCallback(
    (visible: boolean) => {
      const newVisibility: Record<string, boolean> = {}
      allLeafColumns.forEach((col) => {
        newVisibility[col.id] = visible
      })
      onColumnVisibilityChange(newVisibility)
    },
    [allLeafColumns, onColumnVisibilityChange]
  )

  // Show all columns
  const handleShowAllColumns = useCallback(() => {
    handleToggleAllColumns(true)
  }, [handleToggleAllColumns])

  // Hide all columns
  const handleHideAllColumns = useCallback(() => {
    handleToggleAllColumns(false)
  }, [handleToggleAllColumns])

  // Reset column order to default (natural order)
  const handleResetOrder = useCallback(() => {
    if (onResetColumnOrder) {
      onResetColumnOrder()
    } else {
      onColumnOrderChange([])
    }
    // Clear sizing as well
    onColumnSizingChange({})
  }, [onResetColumnOrder, onColumnOrderChange, onColumnSizingChange])

  // Reset column visibility to default
  const handleResetVisibility = useCallback(() => {
    // Clear all visibility overrides
    onColumnVisibilityChange({})
  }, [onColumnVisibilityChange])

  // Reset column sizing
  const handleResetSizing = useCallback(() => {
    onColumnSizingChange({})
  }, [onColumnSizingChange])

  // Reset all column settings
  const handleResetAll = useCallback(() => {
    handleResetOrder()
    handleResetVisibility()
    handleResetSizing()
  }, [handleResetOrder, handleResetVisibility, handleResetSizing])

  // Get column order with fallback
  const getColumnOrder = useCallback(() => {
    const currentOrder = table.getState().columnOrder
    const allIds = allLeafColumns.map((col) => col.id)
    return currentOrder.length > 0 ? currentOrder : allIds
  }, [table, allLeafColumns])

  // Get visible columns count
  const getVisibleColumnsCount = useCallback(() => {
    return allLeafColumns.filter((col) => columnVisibility[col.id] !== false)
      .length
  }, [allLeafColumns, columnVisibility])

  // Get total columns count
  const getTotalColumnsCount = useCallback(() => {
    return allLeafColumns.length
  }, [allLeafColumns])

  return {
    // State management
    handleDragEnd,
    handleAutoFit,
    handleColumnVisibility,
    handleToggleAllColumns,
    handleShowAllColumns,
    handleHideAllColumns,

    // Reset operations
    handleResetOrder,
    handleResetVisibility,
    handleResetSizing,
    handleResetAll,

    // Utility getters
    getColumnOrder,
    getVisibleColumnsCount,
    getTotalColumnsCount,

    // Expose raw operations
    allLeafColumns,
    enableColumnReordering,
  }
}
