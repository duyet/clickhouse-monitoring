'use client'

import {
  type ColumnOrderState,
  type ColumnSizingState,
  type RowSelectionState,
  type SortingState,
  type Table,
  type Updater,
} from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'

export interface TableStateConfig {
  defaultPageSize?: number
  enableRowSelection?: boolean
  enableColumnReordering?: boolean
}

export interface TableStateResult<TData> {
  // Sorting state
  sorting: SortingState
  setSorting: (updater: Updater<SortingState>) => void

  // Column visibility
  columnVisibility: Record<string, boolean>
  setColumnVisibility: (updater: Updater<Record<string, boolean>>) => void

  // Column sizing
  columnSizing: ColumnSizingState
  setColumnSizing: (updater: Updater<ColumnSizingState>) => void

  // Column ordering
  columnOrder: ColumnOrderState
  setColumnOrder: (updater: Updater<ColumnOrderState>) => void

  // Row selection
  rowSelection: RowSelectionState
  setRowSelection: (updater: Updater<RowSelectionState>) => void

  // Get current table state (for use with useReactTable)
  getTableState: () => {
    sorting: SortingState
    columnVisibility: Record<string, boolean>
    columnSizing: ColumnSizingState
    rowSelection: RowSelectionState
    columnOrder: ColumnOrderState
  }

  // Reset all state
  resetAllState: () => void

  // Get initial pagination state
  getInitialPagination: () => { pageSize: number }

  // Get initial column visibility
  getInitialColumnVisibility: (initialVisibility?: Record<string, boolean>) => Record<string, boolean>
}

/**
 * Custom hook for managing table state
 *
 * Centralizes all table state management:
 * - Sorting
 * - Pagination
 * - Column visibility
 * - Column sizing
 * - Column ordering
 * - Row selection
 *
 * Usage:
 * ```typescript
 * const {
 *   sorting, setSorting,
 *   columnVisibility, setColumnVisibility,
 *   // ... other state
 * } = useTableState({ defaultPageSize: 100 })
 *
 * const table = useReactTable({
 *   data,
 *   columns,
 *   state: {
 *     sorting,
 *     columnVisibility,
 *     // ...
 *   },
 *   onSortingChange: setSorting,
 *   onColumnVisibilityChange: setColumnVisibility,
 *   // ...
 * })
 * ```
 */
export function useTableState<TData>(config: TableStateConfig = {}): TableStateResult<TData> {
  const { defaultPageSize = 100, enableRowSelection = false } = config

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([])

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})

  // Column sizing
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  // Column ordering
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])

  // Row selection
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Get current table state
  const getTableState = useCallback(() => ({
    sorting,
    columnVisibility,
    columnSizing,
    rowSelection,
    columnOrder,
  }), [sorting, columnVisibility, columnSizing, rowSelection, columnOrder])

  // Reset all state
  const resetAllState = useCallback(() => {
    setSorting([])
    setColumnVisibility({})
    setColumnSizing({})
    setColumnOrder([])
    setRowSelection({})
  }, [])

  // Get initial pagination state
  const getInitialPagination = useCallback(() => ({
    pageSize: defaultPageSize,
  }), [defaultPageSize])

  // Get initial column visibility
  const getInitialColumnVisibility = useCallback((initialVisibility?: Record<string, boolean>) => {
    return initialVisibility || {}
  }, [])

  return useMemo(() => ({
    sorting,
    setSorting,
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
    columnOrder,
    setColumnOrder,
    rowSelection,
    setRowSelection,
    getTableState,
    resetAllState,
    getInitialPagination,
    getInitialColumnVisibility,
  }), [
    sorting,
    columnVisibility,
    columnSizing,
    columnOrder,
    rowSelection,
    getTableState,
    resetAllState,
    getInitialPagination,
    getInitialColumnVisibility,
  ])
}
