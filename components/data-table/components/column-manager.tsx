import { useCallback, useMemo } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import type { ColumnOrderState, ColumnSizingState } from '@tanstack/react-table'

interface ColumnManagerProps {
  enableColumnReordering?: boolean
  enableColumnResizing?: boolean
  columnOrderStorageKey?: string
  onColumnOrderChange?: (order: ColumnOrderState) => void
  onColumnSizingChange?: (sizing: ColumnSizingState) => void
  onResetColumnOrder?: () => void
}

interface ColumnManagerActions {
  handleColumnOrderChange: (updaterOrValue: ColumnOrderState | ((old: ColumnOrderState) => ColumnOrderState)) => void
  handleColumnSizingChange: (updaterOrValue: ColumnSizingState | ((old: ColumnSizingState) => ColumnSizingState)) => void
  handleDragEndColumnReorder: (activeId: string, overId: string, table: any) => void
  handleResetColumnOrder: () => void
  getInitialColumnOrder: () => ColumnOrderState
}

/**
 * ColumnManager - Handles column-specific operations including visibility, ordering, and resizing
 *
 * This component provides a centralized way to manage column-related functionality:
 * - Column reordering with drag-and-drop support
 * - Column resizing with persistence
 * - Column order persistence to localStorage
 * - Reset functionality for column order
 *
 * Features:
 * - Optional localStorage persistence for column order
 * - Graceful handling of localStorage errors
 * - Support for both direct values and updater functions
 * - Integration with TanStack Table's column management
 */
export function useColumnManager({
  enableColumnReordering = true,
  enableColumnResizing = true,
  columnOrderStorageKey,
  onColumnOrderChange,
  onColumnSizingChange,
  onResetColumnOrder,
}: ColumnManagerProps): ColumnManagerActions {
  // Helper function to generate storage key
  const getStorageKey = useCallback(
    () => `data-table-column-order-${columnOrderStorageKey || 'default'}`,
    [columnOrderStorageKey]
  )

  // Get initial column order from localStorage
  const getInitialColumnOrder = useCallback((): ColumnOrderState => {
    if (enableColumnReordering && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(getStorageKey())
        if (saved) return JSON.parse(saved) as ColumnOrderState
      } catch {
        // Ignore localStorage errors
      }
    }
    return []
  }, [enableColumnReordering, getStorageKey])

  // Handle column order changes with localStorage persistence
  const handleColumnOrderChange = useCallback(
    (updaterOrValue: ColumnOrderState | ((old: ColumnOrderState) => ColumnOrderState)) => {
      // Update both React state and parent component
      onColumnOrderChange?.(updaterOrValue)

      // Save to localStorage
      if (enableColumnReordering && typeof window !== 'undefined') {
        const newOrder =
          typeof updaterOrValue === 'function'
            ? (updaterOrValue as (old: ColumnOrderState) => ColumnOrderState)(getInitialColumnOrder())
            : updaterOrValue
        try {
          localStorage.setItem(getStorageKey(), JSON.stringify(newOrder))
        } catch {
          // Ignore localStorage errors
        }
      }
    },
    [enableColumnReordering, onColumnOrderChange, getInitialColumnOrder, getStorageKey]
  )

  // Handle column sizing changes
  const handleColumnSizingChange = useCallback(
    (updaterOrValue: ColumnSizingState | ((old: ColumnSizingState) => ColumnSizingState)) => {
      onColumnSizingChange?.(updaterOrValue)
    },
    [onColumnSizingChange]
  )

  // Handle drag end event for column reordering
  const handleDragEndColumnReorder = useCallback(
    (activeId: string, overId: string, table: any) => {
      const currentOrder = table.getState().columnOrder

      // Get ALL columns from the table (not just sortable ones)
      const allColumnIds = table.getAllLeafColumns().map((col: any) => col.id)

      // Use currentOrder if it has values, otherwise use all columns in natural order
      const effectiveOrder = currentOrder.length > 0 ? currentOrder : allColumnIds

      const oldIndex = effectiveOrder.indexOf(activeId)
      const newIndex = effectiveOrder.indexOf(overId)

      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder ALL columns, not just the sortable ones
        const newOrder = arrayMove(effectiveOrder, oldIndex, newIndex)
        handleColumnOrderChange(newOrder)
      }
    },
    [handleColumnOrderChange]
  )

  // Reset column order to default
  const handleResetColumnOrder = useCallback(() => {
    handleColumnOrderChange([])
    if (enableColumnReordering && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(getStorageKey())
      } catch {
        // Ignore localStorage errors
      }
    }
    onResetColumnOrder?.()
  }, [handleColumnOrderChange, enableColumnReordering, getStorageKey, onResetColumnOrder])

  return {
    handleColumnOrderChange,
    handleColumnSizingChange,
    handleDragEndColumnReorder,
    handleResetColumnOrder,
    getInitialColumnOrder,
  }
}