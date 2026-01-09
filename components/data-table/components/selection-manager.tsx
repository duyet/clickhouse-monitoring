import type { RowData, RowSelectionState, Table } from '@tanstack/react-table'

import { useCallback, useMemo } from 'react'

interface SelectionManagerConfig {
  enableRowSelection?: boolean
  onRowSelectionChange?: (selectedRows: RowSelectionState) => void
}

interface SelectionManager {
  // Selection state
  rowSelection: RowSelectionState
  setRowSelection: (
    selection:
      | RowSelectionState
      | ((old: RowSelectionState) => RowSelectionState)
  ) => void

  // Selection status
  isAllRowsSelected: boolean
  isSomeRowsSelected: boolean
  selectedRowCount: number
  totalRowCount: number

  // Selection actions
  toggleRowSelection: (rowId: string, value?: boolean) => void
  toggleAllRowsSelection: (value?: boolean) => void
  clearSelection: () => void

  // Selection helpers
  getSelectedRows: () => any[]
  isRowSelected: (rowId: string) => boolean
  canSelectRow: (rowId: string) => boolean

  // Selection column
  selectionColumn: any // ColumnDef for selection checkbox
}

/**
 * Handles row selection logic with checkboxes and bulk selection
 */
export function useSelectionManager<TData extends RowData>(
  table: Table<TData>,
  config: SelectionManagerConfig = {}
): SelectionManager {
  const { enableRowSelection = false, onRowSelectionChange } = config

  // Get row selection state from table
  const rowSelection = table.getState().rowSelection

  // Update row selection (with optional callback)
  const setRowSelection = useCallback(
    (
      selection:
        | RowSelectionState
        | ((old: RowSelectionState) => RowSelectionState)
    ) => {
      const newSelection =
        typeof selection === 'function' ? selection(rowSelection) : selection

      table.setRowSelection(newSelection)

      // Call external callback if provided
      if (onRowSelectionChange) {
        onRowSelectionChange(newSelection)
      }
    },
    [table, rowSelection, onRowSelectionChange]
  )

  // Selection status
  const isAllRowsSelected = table.getIsAllPageRowsSelected()
  const isSomeRowsSelected = table.getIsSomePageRowsSelected()
  const selectedRowCount = Object.keys(rowSelection).length
  const totalRowCount = table.getFilteredRowModel().rows.length

  // Toggle individual row selection
  const toggleRowSelection = useCallback(
    (rowId: string, value?: boolean) => {
      const row = table.getRow(rowId)
      if (row) {
        row.getToggleSelectedHandler()({
          target: { checked: value ?? !row.getIsSelected() },
        } as any)
      }
    },
    [table]
  )

  // Toggle all rows selection
  const toggleAllRowsSelection = useCallback(
    (value?: boolean) => {
      table.toggleAllPageRowsSelected(value ?? !isAllRowsSelected)
    },
    [table, isAllRowsSelected]
  )

  // Clear all selections
  const clearSelection = useCallback(() => {
    table.setRowSelection({})
  }, [table])

  // Get selected rows data
  const getSelectedRows = useCallback(() => {
    return table.getSelectedRowModel().rows.map((row) => row.original)
  }, [table])

  // Check if a specific row is selected
  const isRowSelected = useCallback(
    (rowId: string) => {
      const row = table.getRow(rowId)
      return row ? row.getIsSelected() : false
    },
    [table]
  )

  // Check if a row can be selected
  const canSelectRow = useCallback(
    (rowId: string) => {
      const row = table.getRow(rowId)
      return row ? row.getCanSelect() : false
    },
    [table]
  )

  // Selection column definition
  const selectionColumn = useMemo(
    () => ({
      id: 'select',
      header: ({ table }: { table: Table<TData> }) => (
        <div
          role="presentation"
          className="flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="size-4 cursor-pointer accent-primary"
            checked={table.getIsAllPageRowsSelected()}
            ref={(el) => {
              if (el)
                el.indeterminate =
                  table.getIsSomePageRowsSelected() &&
                  !table.getIsAllPageRowsSelected()
            }}
            onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Select all rows"
          />
        </div>
      ),
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
    }),
    []
  )

  return {
    // Selection state
    rowSelection,
    setRowSelection,

    // Selection status
    isAllRowsSelected,
    isSomeRowsSelected,
    selectedRowCount,
    totalRowCount,

    // Selection actions
    toggleRowSelection,
    toggleAllRowsSelection,
    clearSelection,

    // Selection helpers
    getSelectedRows,
    isRowSelected,
    canSelectRow,

    // Selection column
    selectionColumn,
  }
}
