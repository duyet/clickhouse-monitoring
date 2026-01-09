'use client'

import {
  type ColumnDef,
  type ColumnOrderState,
  type ColumnSizingState,
  type VisibilityState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import type { RowData } from '@tanstack/react-table'
import type { QueryConfig } from '@/types/query-config'

interface ColumnManagerProps<TData extends RowData> {
  /** Whether column operations are enabled */
  enabled: boolean
  /** Column order state */
  columnOrder: ColumnOrderState
  /** Set column order */
  onColumnOrderChange: (order: ColumnOrderState) => void
  /** Column visibility state */
  columnVisibility: VisibilityState
  /** Set column visibility */
  onColumnVisibilityChange: (visibility: VisibilityState) => void
  /** Column sizing state */
  columnSizing: ColumnSizingState
  /** Set column sizing */
  onColumnSizingChange: (sizing: ColumnSizingState) => void
  /** Column definitions */
  columnDefs: ColumnDef<TData>[]
  /** Table data */
  data: TData[]
  /** Query config */
  queryConfig: QueryConfig
  /** Get row ID function */
  getRowId: (row: TData, index: number) => string
  /** Drag end handler for column reordering */
  onDragEnd: (activeId: string, overId: string) => void
  /** Reset column order handler */
  onResetColumnOrder: () => void
}

/**
 * Manages column operations including visibility, sizing, ordering, and reordering
 * Handles localStorage persistence for column order
 */
export function ColumnManager<TData extends RowData>({
  enabled,
  columnOrder,
  onColumnOrderChange,
  columnVisibility,
  onColumnVisibilityChange,
  columnSizing,
  onColumnSizingChange,
  columnDefs,
  data,
  queryConfig,
  getRowId,
  onDragEnd,
  onResetColumnOrder,
}: ColumnManagerProps<TData>) {
  // Handle column order change with persistence
  const handleColumnOrderChange = useCallback(
    (updaterOrValue: ColumnOrderState | ((old: ColumnOrderState) => ColumnOrderState)) => {
      const newOrder =
        typeof updaterOrValue === 'function'
          ? (updaterOrValue as (old: ColumnOrderState) => ColumnOrderState)(columnOrder)
          : updaterOrValue
      onColumnOrderChange(newOrder)
    },
    [columnOrder, onColumnOrderChange]
  )

  // Create table instance with column operations
  const table = useReactTable({
    data,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange,
    onColumnSizingChange,
    onColumnOrderChange: handleColumnOrderChange,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    enableSorting: true,
    getRowId,
    state: {
      columnOrder,
      columnVisibility,
      columnSizing,
    },
  })

  // Get all column IDs
  const allColumnIds = useMemo(
    () => table.getAllLeafColumns().map((col) => col.id),
    [table]
  )

  // Handle drag end for column reordering
  const handleDragEnd = useCallback(
    (activeId: string, overId: string) => {
      if (!enabled) return

      const currentOrder = table.getState().columnOrder || []
      const effectiveOrder = currentOrder.length > 0 ? currentOrder : allColumnIds

      const oldIndex = effectiveOrder.indexOf(activeId)
      const newIndex = effectiveOrder.indexOf(overId)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(effectiveOrder, oldIndex, newIndex)
        onColumnOrderChange(newOrder)
      }
    },
    [enabled, table, allColumnIds, onColumnOrderChange]
  )

  // Reset column order
  const resetColumnOrder = useCallback(() => {
    onColumnOrderChange([])
    onResetColumnOrder()
  }, [onColumnOrderChange, onResetColumnOrder])

  return {
    table,
    allColumnIds,
    handleColumnOrderChange,
    handleDragEnd,
    resetColumnOrder,
    visibleColumns: table.getAllLeafColumns().filter((col) => col.getIsVisible()),
    hiddenColumns: table.getAllLeafColumns().filter((col) => !col.getIsVisible()),
    hasColumnOrder: columnOrder.length > 0,
  }
}