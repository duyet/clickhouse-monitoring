'use client'

import {
  type ColumnDef,
  type RowSelectionState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo } from 'react'
import type { RowData } from '@tanstack/react-table'

interface SelectionManagerProps<TData extends RowData> {
  /** Whether row selection is enabled */
  enabled: boolean
  /** Current row selection state */
  rowSelection: RowSelectionState
  /** Callback when selection changes */
  onRowSelectionChange: (selection: RowSelectionState) => void
  /** Column definitions */
  columnDefs: ColumnDef<TData>[]
  /** Table data */
  data: TData[]
  /** Get row ID function */
  getRowId: (row: TData, index: number) => string
}

/**
 * Manages row selection logic including checkbox columns and selection state
 * Handles both individual row selection and "select all" functionality
 */
export function SelectionManager<TData extends RowData>({
  enabled,
  rowSelection,
  onRowSelectionChange,
  columnDefs,
  data,
  getRowId,
}: SelectionManagerProps<TData>) {
  // Selection column definition
  const selectionColumn: ColumnDef<TData, unknown> = useMemo(
    () => ({
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
    }),
    []
  )

  // Combine selection column with other columns when enabled
  const finalColumnDefs = useMemo(
    () => (enabled ? [selectionColumn, ...columnDefs] : columnDefs),
    [enabled, selectionColumn, columnDefs]
  )

  // Create table instance with selection enabled
  const table = useReactTable({
    data,
    columns: finalColumnDefs,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: enabled,
    getRowId,
    onRowSelectionChange,
    state: {
      rowSelection,
    },
  })

  return {
    table,
    selectionColumn,
    finalColumnDefs,
    selectedRows: Object.keys(rowSelection).length,
    allRowsSelected: table.getIsAllPageRowsSelected(),
    someRowsSelected: table.getIsSomePageRowsSelected(),
  }
}