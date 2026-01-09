import type {
  ColumnOrderState,
  ColumnSizingState,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table'

import { useCallback, useMemo, useState } from 'react'

interface TableStateConfig {
  defaultPageSize?: number
  initialColumnVisibility?: Record<string, boolean>
  enableColumnReordering?: boolean
  columnOrderStorageKey?: string
  queryConfigName?: string
}

interface TableState {
  // Sorting state
  sorting: SortingState
  setSorting: (
    updater: SortingState | ((old: SortingState) => SortingState)
  ) => void

  // Pagination state (part of table instance, but we can track page size)
  pageSize: number
  setPageSize: (size: number) => void

  // Column visibility
  columnVisibility: Record<string, boolean>
  setColumnVisibility: (
    updater:
      | Record<string, boolean>
      | ((old: Record<string, boolean>) => Record<string, boolean>)
  ) => void

  // Column sizing
  columnSizing: ColumnSizingState
  setColumnSizing: (
    updater: ColumnSizingState | ((old: ColumnSizingState) => ColumnSizingState)
  ) => void

  // Column ordering
  columnOrder: ColumnOrderState
  setColumnOrder: (
    updater: ColumnOrderState | ((old: ColumnOrderState) => ColumnOrderState)
  ) => void

  // Row selection
  rowSelection: RowSelectionState
  setRowSelection: (
    updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)
  ) => void

  // Reset functions
  resetAll: () => void
  resetSorting: () => void
  resetPagination: () => void
  resetColumnVisibility: () => void
  resetColumnSizing: () => void
  resetColumnOrder: () => void
  resetRowSelection: () => void
}

/**
 * Centralized state management for DataTable component
 * Handles sorting, pagination, column visibility, sizing, ordering, and row selection
 */
export function useTableState(config: TableStateConfig = {}): TableState {
  const {
    defaultPageSize = 100,
    initialColumnVisibility = {},
    enableColumnReordering = true,
    columnOrderStorageKey,
    queryConfigName,
  } = config

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([])

  // Pagination state (page size)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(initialColumnVisibility)

  // Column sizing state
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  // Column ordering state with localStorage persistence
  const getStorageKey = useCallback(() => {
    return `data-table-column-order-${columnOrderStorageKey || queryConfigName || 'default'}`
  }, [columnOrderStorageKey, queryConfigName])

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => {
    if (enableColumnReordering && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(getStorageKey())
        if (saved) return JSON.parse(saved) as ColumnOrderState
      } catch {
        // Ignore localStorage errors
      }
    }
    return []
  })

  // Row selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Memoized storage key to prevent recreation
  const storageKey = useMemo(getStorageKey, [getStorageKey])

  // Handle column order changes with localStorage persistence
  const handleColumnOrderChange = useCallback(
    (
      updater: ColumnOrderState | ((old: ColumnOrderState) => ColumnOrderState)
    ) => {
      // Update state
      setColumnOrder(updater)

      // Save to localStorage
      if (enableColumnReordering && typeof window !== 'undefined') {
        const newOrder =
          typeof updater === 'function'
            ? (updater as (old: ColumnOrderState) => ColumnOrderState)(
                columnOrder
              )
            : updater
        try {
          localStorage.setItem(storageKey, JSON.stringify(newOrder))
        } catch {
          // Ignore localStorage errors
        }
      }
    },
    [enableColumnReordering, storageKey, columnOrder]
  )

  // Reset functions
  const resetAll = useCallback(() => {
    setSorting([])
    setPageSize(defaultPageSize)
    setColumnVisibility(initialColumnVisibility)
    setColumnSizing({})
    setColumnOrder([])
    setRowSelection({})
  }, [defaultPageSize, initialColumnVisibility])

  const resetSorting = useCallback(() => setSorting([]), [])
  const resetPagination = useCallback(
    () => setPageSize(defaultPageSize),
    [defaultPageSize]
  )
  const resetColumnVisibility = useCallback(
    () => setColumnVisibility(initialColumnVisibility),
    [initialColumnVisibility]
  )
  const resetColumnSizing = useCallback(() => setColumnSizing({}), [])
  const resetColumnOrder = useCallback(() => {
    handleColumnOrderChange([])
    if (enableColumnReordering && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey)
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [handleColumnOrderChange, enableColumnReordering, storageKey])
  const resetRowSelection = useCallback(() => setRowSelection({}), [])

  return {
    // Sorting
    sorting,
    setSorting,

    // Pagination
    pageSize,
    setPageSize,

    // Column visibility
    columnVisibility,
    setColumnVisibility,

    // Column sizing
    columnSizing,
    setColumnSizing,

    // Column ordering
    columnOrder,
    setColumnOrder: handleColumnOrderChange,

    // Row selection
    rowSelection,
    setRowSelection,

    // Reset functions
    resetAll,
    resetSorting,
    resetPagination,
    resetColumnVisibility,
    resetColumnSizing,
    resetColumnOrder,
    resetRowSelection,
  }
}
