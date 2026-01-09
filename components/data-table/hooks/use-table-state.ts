import { useCallback, useMemo, useState } from 'react'
import type {
  ColumnOrderState,
  ColumnSizingState,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table'

interface TableState {
  sorting: SortingState
  columnVisibility: Record<string, boolean>
  columnSizing: ColumnSizingState
  rowSelection: RowSelectionState
  columnOrder: ColumnOrderState
}

interface TableStateActions {
  setSorting: (updater: SortingState | ((old: SortingState) => SortingState)) => void
  setColumnVisibility: (updater: Record<string, boolean> | ((old: Record<string, boolean>) => Record<string, boolean>)) => void
  setColumnSizing: (updater: ColumnSizingState | ((old: ColumnSizingState) => ColumnSizingState)) => void
  setRowSelection: (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => void
  setColumnOrder: (updater: ColumnOrderState | ((old: ColumnOrderState) => ColumnOrderState)) => void
  reset: () => void
}

interface UseTableStateOptions {
  initialSorting?: SortingState
  initialColumnVisibility?: Record<string, boolean>
  initialColumnSizing?: ColumnSizingState
  initialRowSelection?: RowSelectionState
  initialColumnOrder?: ColumnOrderState
}

/**
 * Custom hook for managing table state (sorting, pagination, column visibility)
 *
 * This hook centralizes all table state management, making it easier to:
 * - Share state between components
 * - Implement persistence strategies
 * - Handle state resets
 * - Type-safe state management
 */
export function useTableState(options: UseTableStateOptions = {}): {
  state: TableState
  actions: TableStateActions
} {
  const {
    initialSorting = [],
    initialColumnVisibility = {},
    initialColumnSizing = {},
    initialRowSelection = {},
    initialColumnOrder = [],
  } = options

  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(initialColumnVisibility)
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(initialColumnSizing)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(initialRowSelection)
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(initialColumnOrder)

  const actions = useMemo(
    () => ({
      setSorting,
      setColumnVisibility,
      setColumnSizing,
      setRowSelection,
      setColumnOrder,
      reset: useCallback(() => {
        setSorting(initialSorting)
        setColumnVisibility(initialColumnVisibility)
        setColumnSizing(initialColumnSizing)
        setRowSelection(initialRowSelection)
        setColumnOrder(initialColumnOrder)
      }, [
        initialSorting,
        initialColumnVisibility,
        initialColumnSizing,
        initialRowSelection,
        initialColumnOrder,
      ]),
    }),
    [
      initialSorting,
      initialColumnVisibility,
      initialColumnSizing,
      initialRowSelection,
      initialColumnOrder,
    ]
  )

  const state = useMemo(
    () => ({
      sorting,
      columnVisibility,
      columnSizing,
      rowSelection,
      columnOrder,
    }),
    [sorting, columnVisibility, columnSizing, rowSelection, columnOrder]
  )

  return { state, actions }
}

/**
 * Helper hook for creating table state that can be shared between components
 * Useful for implementing features like column persistence or global table controls
 */
export function useSharedTableState(
  sharedState: TableState,
  sharedActions: TableStateActions
) {
  return useMemo(() => ({ state: sharedState, actions: sharedActions }), [sharedState, sharedActions])
}