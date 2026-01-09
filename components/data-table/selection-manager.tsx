'use client'

import type { RowData, RowSelectionState } from '@tanstack/react-table'
import { useMemo } from 'react'

export interface SelectionManagerProps<TData extends RowData> {
  /** Whether row selection is enabled */
  enabled: boolean
  /** Current row selection state */
  rowSelection: RowSelectionState
  /** Callback when row selection changes */
  onRowSelectionChange: (selectedRows: RowSelectionState) => void
  /** Table instance for integration with TanStack Table */
  table?: any // We'll use any to avoid circular import
}

/**
 * SelectionManager - Handles row selection logic with checkboxes
 *
 * Provides:
 * - Select all/none functionality
 * - Individual row selection
 * - Selection state management
 * - Indeterminate state handling
 *
 * Usage:
 * ```typescript
 * const SelectionManager = () => (
 *   <SelectionManager
 *     enabled={enableRowSelection}
 *     rowSelection={rowSelection}
 *     onRowSelectionChange={setRowSelection}
 *     table={table}
 *   />
 * )
 * ```
 */
export function SelectionManager<TData extends RowData>({
  enabled,
  rowSelection,
  onRowSelectionChange,
  table,
}: SelectionManagerProps<TData>) {
  // Selection column definition
  const selectionColumn = useMemo(() => ({
    id: 'select',
    header: ({ table }: { table: any }) => {
      const isAllSelected = table.getIsAllPageRowsSelected()
      const isSomeSelected = table.getIsSomePageRowsSelected()

      return (
        <div
          role="presentation"
          className="flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="size-4 cursor-pointer accent-primary"
            checked={isAllSelected}
            ref={(el) => {
              if (el) el.indeterminate = isSomeSelected && !isAllSelected
            }}
            onChange={(e) =>
              table.toggleAllPageRowsSelected(e.target.checked)
            }
            onClick={(e) => e.stopPropagation()}
            aria-label="Select all rows"
          />
        </div>
      )
    },
    cell: ({ row }: { row: any }) => (
      <div
        role="presentation"
        className="flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          className="size-4 cursor-pointer accent-primary"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 48,
    minSize: 48,
    maxSize: 48,
  }), [])

  // Handle row selection change
  const handleRowSelectionChange = useMemo(() => {
    return (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
      onRowSelectionChange(updater)
    }
  }, [onRowSelectionChange])

  // Get selected rows count
  const selectedRowCount = useMemo(() => {
    return Object.keys(rowSelection).length
  }, [rowSelection])

  // Check if all rows are selected
  const isAllSelected = useMemo(() => {
    return table ? table.getIsAllPageRowsSelected() : false
  }, [table, rowSelection])

  // Check if some rows are selected
  const isSomeSelected = useMemo(() => {
    return table ? table.getIsSomePageRowsSelected() : false
  }, [table, rowSelection])

  // Toggle all rows selection
  const toggleAllRows = useMemo(() => {
    return (checked: boolean) => {
      if (table) {
        table.toggleAllPageRowsSelected(checked)
      }
    }
  }, [table])

  // Toggle individual row selection
  const toggleRow = useMemo(() => {
    return (rowId: string) => {
      const newRowSelection = {
        ...rowSelection,
        [rowId]: !rowSelection[rowId],
      }
      onRowSelectionChange(newRowSelection)
    }
  }, [rowSelection, onRowSelectionChange])

  // Clear all selections
  const clearSelection = useMemo(() => {
    return () => {
      onRowSelectionChange({})
    }
  }, [onRowSelectionChange])

  return {
    selectionColumn: enabled ? selectionColumn : null,
    selectedRowCount,
    isAllSelected,
    isSomeSelected,
    toggleAllRows,
    toggleRow,
    clearSelection,
  }
}
