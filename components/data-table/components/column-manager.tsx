import type {
  Column,
  ColumnOrderState,
  ColumnSizingState,
  RowData,
  Table,
} from '@tanstack/react-table'

import { arrayMove } from '@dnd-kit/sortable'
import { useCallback, useMemo } from 'react'

interface ColumnManagerConfig {
  enableColumnReordering?: boolean
  columnOrderStorageKey?: string
  queryConfigName?: string
}

interface ColumnManager<TData extends RowData> {
  // Column visibility
  isColumnVisible: (columnId: string) => boolean
  toggleColumnVisibility: (columnId: string) => void
  toggleAllColumns: (visible: boolean) => void

  // Column sizing
  isColumnResizable: (columnId: string) => boolean
  getColumnWidth: (columnId: string) => number | undefined
  setColumnWidth: (columnId: string, width: number) => void

  // Column ordering
  moveColumn: (columnId: string, targetColumnId: string) => void
  resetColumnOrder: () => void
  canReorderColumns: boolean

  // Auto-fit
  autoFitColumn: (columnId: string, headerText?: string) => void

  // Drag and drop
  handleDragEnd: (activeId: string, overId: string) => void

  // Bulk operations
  getVisibleColumns: () => Column<TData, any>[]
  getHiddenColumns: () => Column<TData, any>[]
  getColumnOrderDisplay: () => string[]
}

/**
 * Handles column-specific operations including visibility, sizing, ordering, and auto-fitting
 */
export function useColumnManager<TData extends RowData>(
  table: Table<TData>,
  config: ColumnManagerConfig = {}
): ColumnManager<TData> {
  const {
    enableColumnReordering = true,
    columnOrderStorageKey,
    queryConfigName,
  } = config

  // Get storage key for column order persistence
  const storageKey = useMemo(
    () =>
      `data-table-column-order-${columnOrderStorageKey || queryConfigName || 'default'}`,
    [columnOrderStorageKey, queryConfigName]
  )

  // Check if a column is visible
  const isColumnVisible = useCallback(
    (columnId: string) => {
      return table
        .getAllLeafColumns()
        .some((col) => col.id === columnId && col.getIsVisible())
    },
    [table]
  )

  // Toggle column visibility
  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      const column = table.getColumn(columnId)
      if (column) {
        column.toggleVisibility()
      }
    },
    [table]
  )

  // Toggle all columns visibility
  const toggleAllColumns = useCallback(
    (visible: boolean) => {
      table.getAllLeafColumns().forEach((column) => {
        if (column.id !== 'select') {
          // Don't hide selection column
          column.toggleVisibility(visible)
        }
      })
    },
    [table]
  )

  // Check if a column is resizable
  const isColumnResizable = useCallback(
    (columnId: string) => {
      const column = table.getColumn(columnId)
      return column ? !column.columnDef.enableResizing === false : false
    },
    [table]
  )

  // Get column width
  const getColumnWidth = useCallback(
    (columnId: string) => {
      return table.getState().columnSizing[columnId]
    },
    [table]
  )

  // Set column width
  const setColumnWidth = useCallback(
    (columnId: string, width: number) => {
      table.setColumnSizing((prev) => ({
        ...prev,
        [columnId]: width,
      }))
    },
    [table]
  )

  // Move column to new position
  const moveColumn = useCallback(
    (columnId: string, targetColumnId: string) => {
      const currentOrder = table.getState().columnOrder
      const allColumnIds = table.getAllLeafColumns().map((col) => col.id)

      const effectiveOrder =
        currentOrder.length > 0 ? currentOrder : allColumnIds
      const oldIndex = effectiveOrder.indexOf(columnId)
      const newIndex = effectiveOrder.indexOf(targetColumnId)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(effectiveOrder, oldIndex, newIndex)
        table.setColumnOrder(newOrder)

        // Persist to localStorage
        if (enableColumnReordering && typeof window !== 'undefined') {
          try {
            localStorage.setItem(storageKey, JSON.stringify(newOrder))
          } catch {
            // Ignore localStorage errors
          }
        }
      }
    },
    [table, enableColumnReordering, storageKey]
  )

  // Reset column order to default
  const resetColumnOrder = useCallback(() => {
    table.setColumnOrder([])
    if (enableColumnReordering && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey)
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [table, enableColumnReordering, storageKey])

  // Auto-fit column width
  const autoFitColumn = useCallback(
    (columnId: string, headerText?: string) => {
      const column = table.getColumn(columnId)
      if (!column) return

      const header = headerText || (column.columnDef.header as string)
      const rows = table.getRowModel().rows

      // Calculate max content width for this column
      let maxWidth = header.length * 8 // Minimum width based on header text

      rows.forEach((row) => {
        const cellValue = row.getValue(columnId)
        const cellText = String(cellValue || '')
        const cellWidth = cellText.length * 8
        maxWidth = Math.max(maxWidth, cellWidth)
      })

      // Set with some padding
      const finalWidth = Math.min(maxWidth + 32, 500) // Max width of 500px
      setColumnWidth(columnId, finalWidth)
    },
    [table, setColumnWidth]
  )

  // Handle drag end for column reordering
  const handleDragEnd = useCallback(
    (activeId: string, overId: string) => {
      moveColumn(activeId, overId)
    },
    [moveColumn]
  )

  // Get visible columns
  const getVisibleColumns = useCallback(() => {
    return table.getAllLeafColumns().filter((column) => column.getIsVisible())
  }, [table])

  // Get hidden columns
  const getHiddenColumns = useCallback(() => {
    return table.getAllLeafColumns().filter((column) => !column.getIsVisible())
  }, [table])

  // Get column order for display
  const getColumnOrderDisplay = useCallback(() => {
    const currentOrder = table.getState().columnOrder
    const allColumnIds = table.getAllLeafColumns().map((col) => col.id)

    return currentOrder.length > 0 ? currentOrder : allColumnIds
  }, [table])

  return {
    // Column visibility
    isColumnVisible,
    toggleColumnVisibility,
    toggleAllColumns,

    // Column sizing
    isColumnResizable,
    getColumnWidth,
    setColumnWidth,

    // Column ordering
    moveColumn,
    resetColumnOrder,
    canReorderColumns: enableColumnReordering,

    // Auto-fit
    autoFitColumn,

    // Drag and drop
    handleDragEnd,

    // Bulk operations
    getVisibleColumns,
    getHiddenColumns,
    getColumnOrderDisplay,
  }
}
