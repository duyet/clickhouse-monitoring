'use client'

import { useCallback, useMemo } from 'react'
import { memo } from 'react'
import {
  type ColumnDef,
  type Table,
  type RowData,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  DataTableContent,
  DataTableFooter,
  DataTableHeader,
} from './data-table-content'
import { ColumnManager } from './column-manager'
import { SelectionManager } from './selection-manager'
import { getCustomSortingFns } from '@/components/data-table/sorting-fns'
import { arrayMove } from '@dnd-kit/sortable'
import { useAutoFitColumns } from '@/components/data-table/hooks/use-auto-fit-columns'

interface DataTableCoreProps<TData extends RowData, TValue> {
  /** TanStack Table instance */
  table: Table<TData>
  /** Column definitions (includes selection column if enabled) */
  columnDefs: ColumnDef<TData, TValue>[]
  /** Table title displayed in header */
  title?: string
  /** Table description or subtitle */
  description?: string | React.ReactNode
  /** Additional toolbar elements (left side) */
  toolbarExtras?: React.ReactNode
  /** Additional toolbar elements (right side) */
  topRightToolbarExtras?: React.ReactNode
  /** Query configuration for display purposes */
  queryConfig?: any
  /** Parameters for query execution (search, sort, pagination) */
  queryParams?: any
  /** Show SQL button visibility (default: true) */
  showSQL?: boolean
  /** Show loading indicator in header when refreshing data */
  isRefreshing?: boolean
  /** The actual SQL that was executed (after version selection) */
  executedSql?: string
  /** Query execution metadata */
  metadata?: any
  /** Enable column reordering with drag-and-drop (default: true) */
  enableColumnReordering?: boolean
  /** Enable row selection with checkboxes (default: false) */
  enableRowSelection?: boolean
  /** Bulk actions for row selection */
  selectionActions?: Array<{
    id: string
    label: string
    icon?: React.ReactNode
    onClick: (selectedRows: TData[]) => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    disabled?: (selectedRows: TData[]) => boolean
  }>
  /** Callback when row selection changes */
  onRowSelectionChange?: (selectedRows: any) => void
  /** Custom footnote content */
  footnote?: string | React.ReactNode
  /** Additional CSS classes for container */
  className?: string
  /** Container ref for virtual scrolling */
  tableContainerRef?: React.RefObject<HTMLDivElement>
  /** Virtualizer instance */
  virtualizer?: any
  /** Whether virtualization is enabled */
  isVirtualized?: boolean
  /** Active filter count for display */
  activeFilterCount?: number
  /** Callback for auto-fit column */
  onAutoFit?: (columnId: string) => void
}

/**
 * DataTableCore - Basic table rendering and TanStack Table setup
 *
 * This is the core table component that handles:
 * - TanStack Table initialization and configuration
 * - Basic table structure (header, content, footer)
 * - Column management through ColumnManager
 * - Row selection through SelectionManager
 * - Virtual scrolling support
 * - Auto-fit column functionality
 *
 * It delegates specific concerns to specialized components:
 * - Column operations → ColumnManager
 * - Row selection → SelectionManager
 * - Table rendering → DataTableContent, DataTableHeader, DataTableFooter
 *
 * Features:
 * - Virtual scrolling for large datasets
 * - Custom sorting functions
 * - Row selection with bulk actions
 * - Column visibility and reordering
 * - Responsive design with shadcn/ui components
 */
export const DataTableCore = memo(function DataTableCore<TData extends RowData, TValue>({
  table,
  columnDefs,
  title = '',
  description = '',
  toolbarExtras,
  topRightToolbarExtras,
  queryConfig,
  queryParams,
  showSQL = true,
  isRefreshing = false,
  executedSql,
  metadata,
  enableColumnReordering = true,
  enableRowSelection = false,
  selectionActions = [],
  onRowSelectionChange,
  footnote,
  className,
  tableContainerRef,
  virtualizer,
  isVirtualized,
  activeFilterCount = 0,
  onAutoFit,
}: DataTableCoreProps<TData, TValue>) {
  // Get table configuration
  const rows = table.getRowModel().rows

  // Auto-fit columns functionality
  const { autoFitColumn } = useAutoFitColumns(tableContainerRef)

  // Handle drag end for column reordering
  const handleDragEndColumnReorder = useCallback(
    (activeId: string, overId: string) => {
      const currentOrder = table.getState().columnOrder
      const allColumnIds = table.getAllLeafColumns().map((col) => col.id)
      const effectiveOrder = currentOrder.length > 0 ? currentOrder : allColumnIds

      const oldIndex = effectiveOrder.indexOf(activeId)
      const newIndex = effectiveOrder.indexOf(overId)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(effectiveOrder, oldIndex, newIndex)
        table.setColumnOrder(newOrder)
      }
    },
    [table]
  )

  // Reset column order
  const handleResetColumnOrder = useCallback(() => {
    table.setColumnOrder([])
  }, [table])

  // Handle auto-fit request
  const handleAutoFit = useCallback(
    (columnId: string) => {
      if (!onAutoFit) {
        const column = table.getColumn(columnId)
        if (!column) return

        const headerText = column.columnDef.header as string
        const rows = table.getRowModel().rows
        autoFitColumn(column, rows, headerText)
      } else {
        onAutoFit(columnId)
      }
    },
    [table, autoFitColumn, onAutoFit]
  )

  // Get selection column if enabled
  const hasSelectionColumn = enableRowSelection && columnDefs.some((col) => col.id === 'select')

  return (
    <div className={`flex min-w-0 flex-col overflow-hidden ${className || ''}`}>
      {/* Header with title and controls */}
      <DataTableHeader
        title={title}
        description={description}
        queryConfig={queryConfig}
        toolbarExtras={toolbarExtras}
        topRightToolbarExtras={topRightToolbarExtras}
        showSQL={showSQL}
        table={table}
        queryParams={queryParams}
        isRefreshing={isRefreshing}
        executedSql={executedSql}
        metadata={metadata}
        enableColumnReordering={enableColumnReordering}
        activeFilterCount={activeFilterCount}
        clearAllColumnFilters={() => table.setColumnFilters({})}
        onResetColumnOrder={handleResetColumnOrder}
      />

      {/* Column Manager - handles visibility and ordering */}
      <div className="flex items-center gap-2 px-2 py-1">
        {enableColumnReordering && (
          <ColumnManager
            table={table}
            enableColumnReordering={enableColumnReordering}
            onResetColumnOrder={handleResetColumnOrder}
            onAutoFit={handleAutoFit}
            tableContainerRef={tableContainerRef}
            showAutoFit={true}
          />
        )}

        {/* Row selection manager */}
        {enableRowSelection && (
          <SelectionManager
            table={table}
            enableRowSelection={enableRowSelection}
            onRowSelectionChange={onRowSelectionChange}
            actions={selectionActions}
            showSelectionCount={true}
          />
        )}

        {/* Additional toolbar items */}
        {toolbarExtras}
      </div>

      {/* Table content with virtualization support */}
      <DataTableContent
        title={title}
        description={description}
        queryConfig={queryConfig}
        table={table}
        columnDefs={columnDefs}
        tableContainerRef={tableContainerRef}
        isVirtualized={isVirtualized}
        virtualizer={virtualizer}
        activeFilterCount={activeFilterCount}
        onAutoFit={handleAutoFit}
        enableColumnReordering={enableColumnReordering}
        onColumnOrderChange={handleDragEndColumnReorder}
        onResetColumnOrder={handleResetColumnOrder}
      />

      {/* Footer with pagination and footnote */}
      <DataTableFooter table={table} footnote={footnote} />
    </div>
  )
}) as <TData extends RowData, TValue>(
  props: DataTableCoreProps<TData, TValue>
) => JSX.Element

/**
 * Utility function to create a table instance with common configuration
 */
export function createTable<TData extends RowData, TValue>(
  data: TData[],
  columnDefs: ColumnDef<TData, TValue>[],
  options: {
    state?: any
    initialState?: any
    onSortingChange?: (updater: any) => void
    onColumnVisibilityChange?: (updater: any) => void
    onRowSelectionChange?: (updater: any) => void
    onColumnOrderChange?: (updater: any) => void
    onColumnSizingChange?: (updater: any) => void
    enableRowSelection?: boolean
    getRowId?: (row: TData, index: number) => string
    enableSorting?: boolean
    enableColumnResizing?: boolean
    columnResizeMode?: 'onChange' | 'onEnd'
    defaultPageSize?: number
  } = {}
) {
  const table = useReactTable({
    data,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: options.onSortingChange,
    sortingFns: getCustomSortingFns<TData>(),
    onColumnVisibilityChange: options.onColumnVisibilityChange,
    enableColumnResizing: options.enableColumnResizing ?? true,
    columnResizeMode: options.columnResizeMode ?? 'onChange',
    onColumnSizingChange: options.onColumnSizingChange,
    onColumnOrderChange: options.onColumnOrderChange,
    enableRowSelection: options.enableRowSelection ?? false,
    getRowId: options.getRowId,
    onRowSelectionChange: options.onRowSelectionChange,
    enableSorting: options.enableSorting ?? true,
    state: options.state,
    initialState: options.initialState,
  })

  return table
}