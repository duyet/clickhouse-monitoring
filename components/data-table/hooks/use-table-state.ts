import { useState, useMemo } from 'react'
import type {
  ColumnOrderState,
  ColumnSizingState,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table'

export interface UseTableStateOptions {
  /** Initial page size (default: 100) */
  defaultPageSize?: number
  /** Initial column visibility state */
  initialColumnVisibility?: Record<string, boolean>
  /** Enable column reordering (default: true) */
  enableColumnReordering?: boolean
  /** Storage key for persisting column order to localStorage */
  columnOrderStorageKey?: string
  /** Query config name for localStorage key generation */
  queryConfigName?: string
}

export interface TableState {
  /** Sorting state */
  sorting: SortingState
  /** Column visibility state */
  columnVisibility: Record<string, boolean>
  /** Column sizing state */
  columnSizing: ColumnSizingState
  /** Row selection state */
  rowSelection: RowSelectionState
  /** Column order state */
  columnOrder: ColumnOrderState
}

export interface TableStateActions {
  /** Set sorting state */
  setSorting: (updater: SortingState | ((old: SortingState) => SortingState)) => void
  /** Set column visibility state */
  setColumnVisibility: (updater: Record<string, boolean> | ((old: Record<string, boolean>) => Record<string, boolean>)) => void
  /** Set column sizing state */
  setColumnSizing: (updater: ColumnSizingState | ((old: ColumnSizingState) => ColumnSizingState)) => void
  /** Set row selection state */
  setRowSelection: (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => void
  /** Set column order state */
  setColumnOrder: (updater: ColumnOrderState | ((old: ColumnOrderState) => ColumnOrderState)) => void
  /** Reset column order to default */
  resetColumnOrder: () => void
}

/**
 * Centralized state management for DataTable
 *
 * Handles all table state including sorting, column visibility, column sizing,
 * row selection, and column order in a single hook.
 *
 * Features:
 * - localStorage persistence for column order
 * - Type-safe state updates
 * - Memoized state to prevent unnecessary re-renders
 * - Support for both direct values and updater functions
 *
 * @example
 * ```tsx
 * const { state, actions } = useTableState({
 *   defaultPageSize: 100,
 *   enableColumnReordering: true,
 *   queryConfigName: 'my-table'
 * })
 * ```
 */
export function useTableState(options: UseTableStateOptions = {}): { state: TableState, actions: TableStateActions } {
  const {
    defaultPageSize = 100,
    initialColumnVisibility = {},
    enableColumnReordering = true,
    columnOrderStorageKey,
    queryConfigName,
  } = options

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([])

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(initialColumnVisibility)

  // Column sizing state
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  // Row selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Generate localStorage key
  const getStorageKey = useMemo(() => {
    return `data-table-column-order-${columnOrderStorageKey || queryConfigName || 'unnamed-table'}`
  }, [columnOrderStorageKey, queryConfigName])

  // Column order state with localStorage persistence
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

  // Enhanced actions with localStorage persistence
  const actions: TableStateActions = useMemo(() => ({
    setSorting: (updater) => {
      setSorting(updater)
    },

    setColumnVisibility: (updater) => {
      setColumnVisibility(updater)
    },

    setColumnSizing: (updater) => {
      setColumnSizing(updater)
    },

    setRowSelection: (updater) => {
      setRowSelection(updater)
    },

    setColumnOrder: (updater) => {
      // Update both React state and localStorage
      setColumnOrder(updater)

      if (enableColumnReordering && typeof window !== 'undefined') {
        const newOrder =
          typeof updater === 'function'
            ? (updater as (old: ColumnOrderState) => ColumnOrderState)(columnOrder)
            : updater
        try {
          localStorage.setItem(getStorageKey(), JSON.stringify(newOrder))
        } catch {
          // Ignore localStorage errors
        }
      }
    },

    resetColumnOrder: () => {
      setColumnOrder([])
      if (enableColumnReordering && typeof window !== 'undefined') {
        try {
          localStorage.removeItem(getStorageKey())
        } catch {
          // Ignore localStorage errors
        }
      }
    },
  }), [enableColumnReordering, getStorageKey, columnOrder])

  // Table state object
  const state: TableState = useMemo(() => ({
    sorting,
    columnVisibility,
    columnSizing,
    rowSelection,
    columnOrder,
  }), [sorting, columnVisibility, columnSizing, rowSelection, columnOrder])

  return { state, actions }
}