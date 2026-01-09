import { useMemo, useState, useCallback } from 'react'
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table'

interface SelectionManagerProps<TData> {
  enableRowSelection?: boolean
  onRowSelectionChange?: (selectedRows: RowSelectionState) => void
  data: TData[]
}

interface SelectionManagerResult<TData> {
  selectionColumn: ColumnDef<TData, unknown> | null
  finalColumnDefs: ColumnDef<TData, unknown>[]
  handleRowSelectionChange: (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => void
  getRowId: (row: TData, index: number) => string
  selectedCount: number
  isAllSelected: boolean
  isSomeSelected: boolean
  toggleAllRows: (checked: boolean) => void
}

/**
 * SelectionManager - Handles row selection logic for data tables
 *
 * This component provides a complete solution for managing row selection:
 * - Checkbox selection with header checkbox for "select all"
 * - Support for indeterminate state (some but not all rows selected)
 * - Custom row ID generation for stable selection
 * - Callback notifications for selection changes
 * - Integration with TanStack Table's selection features
 *
 * Features:
 * - Type-safe row selection management
 * - Efficient row ID generation (tries query_id, id, then index)
 * - Proper accessibility attributes
 * - Integration with table's selection state
 */
export function useSelectionManager<TData extends Record<string, any> = any>({
  enableRowSelection = false,
  onRowSelectionChange,
  data,
}: SelectionManagerProps<TData>): SelectionManagerResult<TData> {
  // Row selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Selection column definition using TanStack Table's row selection
  const selectionColumn: ColumnDef<TData, unknown> | null = useMemo(
    () =>
      enableRowSelection
        ? ({
            id: 'select',
            header: ({ table }) => {
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
            cell: ({ row }) => (
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
          })
        : null,
    [enableRowSelection]
  )

  // Handle row selection changes
  const handleRowSelectionChange = useCallback(
    (updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
      setRowSelection(updater)
      onRowSelectionChange?.(
        typeof updater === 'function' ? updater(rowSelection) : updater
      )
    },
    [onRowSelectionChange, rowSelection]
  )

  // Combine selection column with other columns when enabled
  const finalColumnDefs = useCallback(
    (baseColumnDefs: ColumnDef<TData, unknown>[]) =>
      enableRowSelection && selectionColumn
        ? [selectionColumn, ...baseColumnDefs]
        : baseColumnDefs,
    [enableRowSelection, selectionColumn]
  )

  // Generate unique row ID from data (use query_id if available, otherwise index)
  const getRowId = useCallback(
    (row: TData, index: number) => {
      // Try common ID fields first
      if ((row as any).query_id) return String((row as any).query_id)
      if ((row as any).id) return String((row as any).id)
      // Fallback to index
      return String(index)
    },
    []
  )

  // Selection status helpers
  const selectedCount = Object.keys(rowSelection).length
  const isAllSelected = selectedCount > 0 && selectedCount === data.length
  const isSomeSelected = selectedCount > 0 && selectedCount < data.length

  // Toggle all rows selection
  const toggleAllRows = useCallback(
    (checked: boolean) => {
      const newSelection = checked
        ? data.reduce((acc, row, index) => {
            const id = getRowId(row, index)
            return { ...acc, [id]: true }
          }, {} as RowSelectionState)
        : {}
      handleRowSelectionChange(newSelection)
    },
    [data, getRowId, handleRowSelectionChange]
  )

  return {
    selectionColumn,
    finalColumnDefs,
    handleRowSelectionChange,
    getRowId,
    selectedCount,
    isAllSelected,
    isSomeSelected,
    toggleAllRows,
  }
}