'use client'

import {
  type ColumnOrderState,
  type ColumnSizingState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useState, useCallback, useMemo } from 'react'
import type { QueryConfig } from '@/types/query-config'

interface UseTableStateOptions {
  queryConfig: QueryConfig
  allColumns: string[]
  configuredColumns: string[]
  enableRowSelection?: boolean
  defaultPageSize?: number
}

interface UseTableStateResult<TData> {
  // State
  sorting: SortingState
  columnVisibility: VisibilityState
  columnSizing: ColumnSizingState
  columnOrder: ColumnOrderState
  rowSelection: RowSelectionState

  // Setters
  setSorting: (sorting: SortingState) => void
  setColumnVisibility: (visibility: VisibilityState) => void
  setColumnSizing: (sizing: ColumnSizingState) => void
  setColumnOrder: (order: ColumnOrderState) => void
  setRowSelection: (selection: RowSelectionState) => void

  // Derived
  initialColumnVisibility: VisibilityState
  initialPagination: { pageSize: number }
  getRowId: (row: TData, index: number) => string
}

/**
 * Centralized hook for managing all table state
 * Handles sorting, pagination, column visibility, sizing, ordering, and row selection
 */
export function useTableState<TData extends Record<string, unknown>>(
  options: UseTableStateOptions
): UseTableStateResult<TData> {
  const {
    queryConfig,
    allColumns,
    configuredColumns,
    enableRowSelection = false,
    defaultPageSize = 100,
  } = options

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([])

  // Column visibility state
  const initialColumnVisibility = useMemo(
    () =>
      allColumns.reduce(
        (state, col) => ({
          ...state,
          [col]: configuredColumns.includes(col),
        }),
        {} as VisibilityState
      ),
    [allColumns, configuredColumns]
  )

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility
  )

  // Column sizing state
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  // Column ordering state (no initial value - handled by persistence hook)
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])

  // Row selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Generate unique row ID from data
  const getRowId = useCallback((row: TData, index: number) => {
    const record = row as Record<string, unknown>
    // Try common ID fields first
    if (record.query_id) return String(record.query_id)
    if (record.id) return String(record.id)
    // Fallback to index
    return String(index)
  }, [])

  const initialPagination = useMemo(
    () => ({ pageSize: defaultPageSize }),
    [defaultPageSize]
  )

  return {
    // State
    sorting,
    columnVisibility,
    columnSizing,
    columnOrder,
    rowSelection,

    // Setters
    setSorting,
    setColumnVisibility,
    setColumnSizing,
    setColumnOrder,
    setRowSelection,

    // Derived
    initialColumnVisibility,
    initialPagination,
    getRowId,
  }
}