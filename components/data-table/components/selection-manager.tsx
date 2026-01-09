'use client'

import { type Table, type RowData, type RowSelectionState } from '@tanstack/react-table'
import { type ColumnDef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, CheckSquare } from 'lucide-react'

interface SelectionManagerProps<TData extends RowData> {
  /** TanStack Table instance */
  table: Table<TData>
  /** Enable row selection functionality */
  enableRowSelection?: boolean
  /** Callback when row selection changes */
  onRowSelectionChange?: (selectedRows: RowSelectionState) => void
  /** Selection actions (bulk operations) */
  actions?: Array<{
    id: string
    label: string
    icon?: React.ReactNode
    onClick: (selectedRows: TData[]) => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    disabled?: (selectedRows: TData[]) => boolean
  }>
  /** Custom selection column to insert at beginning */
  customSelectionColumn?: ColumnDef<TData, unknown>
  /** Show selection count badge */
  showSelectionCount?: boolean
}

/**
 * SelectionManager - Handles row selection logic with checkboxes
 *
 * Features:
 * - Single row selection with checkboxes
 * - Select/deselect all rows on current page
 * - Selection count display
 * - Bulk action callbacks
 * - Custom selection column definition
 * - Integration with TanStack Table's row selection
 *
 * This component manages all aspects of row selection, including
 * the selection column definition and bulk operations.
 */
export function SelectionManager<TData extends RowData>({
  table,
  enableRowSelection = true,
  onRowSelectionChange,
  actions = [],
  customSelectionColumn,
  showSelectionCount = true,
}: SelectionManagerProps<TData>) {
  // Get selected rows data
  const selectedRows = useMemo(() => {
    const rows = table.getSelectedRowModel().rows
    return rows.map((row) => row.original)
  }, [table])

  const selectedCount = selectedRows.length

  // Selection column definition (can be customized or use default)
  const selectionColumn: ColumnDef<TData, unknown> = useMemo(() => {
    if (customSelectionColumn) {
      return customSelectionColumn
    }

    return {
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
              aria-label="Select all rows on this page"
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
    }
  }, [customSelectionColumn])

  // Combine selection column with existing columns
  const finalColumnDefs = useMemo(
    () => (enableRowSelection ? [selectionColumn, ...table.getAllLeafColumns().map(col => col.columnDef)] : table.getAllLeafColumns().map(col => col.columnDef)),
    [enableRowSelection, selectionColumn, table]
  )

  // Handle selection change
  const handleSelectionChange = (newSelection: RowSelectionState) => {
    if (onRowSelectionChange) {
      onRowSelectionChange(newSelection)
    }
  }

  // Clear all selections
  const clearSelection = () => {
    table.resetRowSelection()
  }

  // Select all visible rows
  const selectAllVisible = () => {
    table.toggleAllPageRowsSelected(true)
  }

  // Check if all actions should be disabled
  const areActionsDisabled = useMemo(() => {
    if (selectedCount === 0) return true
    return actions.some((action) => action.disabled && action.disabled(selectedRows))
  }, [actions, selectedCount, selectedRows])

  if (!enableRowSelection) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {/* Selection Info */}
      {showSelectionCount && selectedCount > 0 && (
        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {selectedCount} selected
          </span>
        </div>
      )}

      {/* Selection Controls */}
      {selectedCount > 0 && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={clearSelection}
            title="Clear selection"
          >
            Clear
          </Button>

          {selectedCount < table.getRowModel().rows.length && (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={selectAllVisible}
              title="Select all rows on this page"
            >
              Select All
            </Button>
          )}
        </>
      )}

      {/* Bulk Actions */}
      {selectedCount > 0 && actions.length > 0 && (
        <>
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size="sm"
              className="h-8"
              onClick={() => action.onClick(selectedRows)}
              disabled={action.disabled ? action.disabled(selectedRows) : false}
              title={action.label}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </>
      )}
    </div>
  )
}

/**
 * Utility function to create selection column with custom styling
 */
export function createCustomSelectionColumn<TData extends RowData>(
  options: {
    size?: number
    headerLabel?: string
    cellClassName?: string
    headerClassName?: string
  } = {}
): ColumnDef<TData, unknown> {
  const { size = 48, headerLabel = 'Select', cellClassName = '', headerClassName = '' } = options

  return {
    id: 'select',
    header: ({ table }) => {
      const isAllSelected = table.getIsAllPageRowsSelected()
      const isSomeSelected = table.getIsSomePageRowsSelected()
      return (
        <div
          role="presentation"
          className={`flex items-center justify-center ${headerClassName}`}
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
            aria-label={headerLabel}
          />
        </div>
      )
    },
    cell: ({ row }) => (
      <div
        role="presentation"
        className={`flex items-center justify-center ${cellClassName}`}
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
    size: size,
    minSize: size,
    maxSize: size,
  }
}