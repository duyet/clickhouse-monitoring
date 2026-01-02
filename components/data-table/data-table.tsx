'use client'

import {
  type ColumnDef,
  type ColumnSizingState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'

import type { ChartQueryParams } from '@/types/chart-data'
import type { QueryConfig } from '@/types/query-config'

import { useCallback, useMemo, useState } from 'react'
import {
  DataTableContent,
  DataTableFooter,
  DataTableHeader,
} from '@/components/data-table/components'
import {
  useAutoFitColumns,
  useColumnVisibility,
  useFilteredData,
  useTableColumns,
  useTableFilters,
  useVirtualRows,
} from '@/components/data-table/hooks'
import { getCustomSortingFns } from '@/components/data-table/sorting-fns'

/**
 * Props for the DataTable component
 *
 * @template TData - The row data type (extends RowData from TanStack Table)
 *
 * @param title - Table title displayed in header
 * @param description - Table description or subtitle
 * @param toolbarExtras - Additional toolbar elements (left side)
 * @param topRightToolbarExtras - Additional toolbar elements (right side)
 * @param queryConfig - Query configuration defining columns, formats, sorting
 * @param apiParams - Parameters passed to API for query execution (deprecated: use queryParams)
 * @param queryParams - Parameters for query execution (search, sort, pagination)
 * @param data - Array of row data to display
 * @param context - Template replacement context for links (e.g., { database: 'system' })
 * @param defaultPageSize - Initial page size (default: 100)
 * @param showSQL - Show SQL button visibility (default: true)
 * @param footnote - Custom footnote content
 * @param className - Additional CSS classes for container
 * @param enableColumnFilters - Enable client-side column text filtering (default: false)
 * @param enableFilterUrlSync - Sync filters to URL parameters for shareable links (default: false)
 * @param filterUrlPrefix - URL parameter prefix for filters (default: 'filter')
 * @param filterableColumns - Columns to enable filtering for (default: all text columns)
 * @param isRefreshing - Show loading indicator in header when refreshing data
 */
interface DataTableProps<TData extends RowData> {
  /** Table title displayed in header */
  title?: string
  /** Table description or subtitle */
  description?: string | React.ReactNode
  /** Additional toolbar elements (left side) */
  toolbarExtras?: React.ReactNode
  /** Additional toolbar elements (right side) */
  topRightToolbarExtras?: React.ReactNode
  /** Query configuration defining columns, formats, sorting */
  queryConfig: QueryConfig
  /** @deprecated Use queryParams instead */
  queryParams?: ChartQueryParams
  /** Parameters for query execution (search, sort, pagination) */
  apiParams?: ChartQueryParams
  /** Array of row data to display */
  data: TData[]
  /** Template replacement context for links (e.g., { database: 'system', table: 'users' }) */
  context: Record<string, string>
  /** Initial page size (default: 100) */
  defaultPageSize?: number
  /** Show SQL button visibility (default: true) */
  showSQL?: boolean
  /** Custom footnote content */
  footnote?: string | React.ReactNode
  /** Additional CSS classes for container */
  className?: string
  /** Enable client-side column text filtering (default: false) */
  enableColumnFilters?: boolean
  /** Sync filters to URL parameters for shareable links (default: false) */
  enableFilterUrlSync?: boolean
  /** URL parameter prefix for filters (default: 'filter') */
  filterUrlPrefix?: string
  /** Columns to enable filtering for (default: all text columns) */
  filterableColumns?: string[]
  /** Show loading indicator in header when refreshing data */
  isRefreshing?: boolean
  /** The actual SQL that was executed (after version selection) */
  executedSql?: string
  /** Enable row selection with checkboxes (default: false) */
  enableRowSelection?: boolean
  /** Callback when row selection changes */
  onRowSelectionChange?: (selectedRows: RowSelectionState) => void
}

/**
 * DataTable - Main data table component with sorting, filtering, virtualization
 *
 * High-level orchestrator that delegates rendering to specialized sub-components:
 * - DataTableHeader: Title, toolbar, column visibility controls
 * - DataTableContent: Table with virtualization support
 * - DataTableFooter: Pagination and footnote
 *
 * Features:
 * - Virtual scrolling for large datasets (auto-enables at 1000+ rows)
 * - Client-side column filtering
 * - URL filter synchronization for shareable links
 * - Custom sorting functions
 * - Column visibility controls
 * - Responsive design with shadcn/ui components
 *
 * Performance optimizations:
 * - Memoized sub-components prevent unnecessary re-renders
 * - Virtualization reduces DOM nodes from thousands to ~100
 * - Efficient column calculations with useMemo
 */
export function DataTable<
  TData extends RowData,
  TValue extends React.ReactNode,
>({
  title = '',
  description = '',
  toolbarExtras,
  topRightToolbarExtras,
  queryConfig,
  queryParams: deprecatedQueryParams,
  apiParams,
  data,
  context,
  defaultPageSize = 100,
  showSQL = true,
  footnote,
  className,
  enableColumnFilters = false,
  enableFilterUrlSync = false,
  filterUrlPrefix = 'filter',
  filterableColumns,
  isRefreshing = false,
  executedSql,
  enableRowSelection = false,
  onRowSelectionChange,
}: DataTableProps<TData>) {
  // Support both old and new prop names for backward compatibility
  const queryParams = apiParams ?? deprecatedQueryParams

  // Determine which columns should be filterable (memoized)
  const configuredColumns = useMemo(
    () =>
      queryConfig.columns.map((col) =>
        col.toLowerCase().replace('readable_', '').trim()
      ),
    [queryConfig.columns]
  )

  // Client-side column filtering state with optional URL sync
  const {
    columnFilters,
    setColumnFilter,
    clearColumnFilter,
    clearAllColumnFilters,
    activeFilterCount,
  } = useTableFilters({
    enableUrlSync: enableFilterUrlSync,
    urlPrefix: filterUrlPrefix,
  })

  // Apply client-side filters when enabled
  const filteredData = useFilteredData({
    data,
    enableColumnFilters,
    columnFilters,
  })

  // Memoize filterableColumns to prevent filterContext recreation
  const resolvedFilterableColumns = useMemo(
    () => filterableColumns || configuredColumns,
    [filterableColumns, configuredColumns]
  )

  // Memoize filter context to prevent columnDefs recreation on every render
  // This is critical to avoid infinite loops when filters change
  const filterContext = useMemo(
    () =>
      enableColumnFilters
        ? {
            enableColumnFilters,
            filterableColumns: resolvedFilterableColumns,
            columnFilters,
            setColumnFilter,
            clearColumnFilter,
          }
        : undefined,
    [
      enableColumnFilters,
      resolvedFilterableColumns,
      columnFilters,
      setColumnFilter,
      clearColumnFilter,
    ]
  )

  // Column calculations and definitions
  const { allColumns, columnDefs, initialColumnVisibility } = useTableColumns<
    TData,
    TValue
  >({
    queryConfig,
    data,
    context,
    filteredData,
    filterContext,
  })

  // Column visibility
  const { columnVisibility, setColumnVisibility } = useColumnVisibility({
    allColumns,
    configuredColumns,
  })

  // Sorting
  const [sorting, setSorting] = useState<SortingState>([])

  // Column sizing for resize support
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  // Row selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Selection column definition using TanStack Table's row selection
  const selectionColumn: ColumnDef<TData, unknown> = useMemo(
    () => ({
      id: 'select',
      header: ({ table }) => {
        const isAllSelected = table.getIsAllPageRowsSelected()
        const isSomeSelected = table.getIsSomePageRowsSelected()
        return (
          <div
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
              onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              aria-label="Select all rows"
            />
          </div>
        )
      },
      cell: ({ row }) => (
        <div
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
    () => (enableRowSelection ? [selectionColumn, ...columnDefs] : columnDefs),
    [enableRowSelection, selectionColumn, columnDefs]
  )

  // Generate unique row ID from data (use query_id if available, otherwise index)
  const getRowId = useMemo(
    () => (row: TData, index: number) => {
      const record = row as Record<string, unknown>
      // Try common ID fields first
      if (record.query_id) return String(record.query_id)
      if (record.id) return String(record.id)
      // Fallback to index
      return String(index)
    },
    []
  )

  const table = useReactTable({
    data: filteredData,
    columns: finalColumnDefs,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    // Add custom sorting functions
    // Ref: https://tanstack.com/table/v8/docs/guide/sorting#custom-sorting-functions
    sortingFns: getCustomSortingFns<TData>(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    // Column resizing
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    onColumnSizingChange: setColumnSizing,
    // Row selection - pass true to enable for all rows
    enableRowSelection: enableRowSelection ? true : false,
    getRowId,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnVisibility,
      columnSizing,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
      columnVisibility: initialColumnVisibility,
    },
  })


  // Virtual rows for large datasets (auto-enables at 1000+ rows)
  const rows = table.getRowModel().rows
  const { virtualizer, tableContainerRef, isVirtualized } = useVirtualRows(
    rows.length
  )

  // Auto-fit columns functionality
  const { autoFitColumn } = useAutoFitColumns<TData>(tableContainerRef)

  // Handle auto-fit request for a specific column
  const handleAutoFit = useCallback(
    (columnId: string) => {
      const column = table.getColumn(columnId)
      if (!column) return

      const headerText = column.columnDef.header as string
      autoFitColumn(column, rows, headerText)
    },
    [autoFitColumn, table, rows]
  )

  return (
    <div className={`flex min-w-0 flex-col overflow-hidden ${className || ''}`}>
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
        enableColumnFilters={enableColumnFilters}
        activeFilterCount={activeFilterCount}
        clearAllColumnFilters={clearAllColumnFilters}
        executedSql={executedSql}
      />

      <DataTableContent
        title={title}
        description={description}
        queryConfig={queryConfig}
        table={table}
        columnDefs={finalColumnDefs}
        tableContainerRef={tableContainerRef}
        isVirtualized={isVirtualized}
        virtualizer={virtualizer}
        activeFilterCount={activeFilterCount}
        onAutoFit={handleAutoFit}
      />

      <DataTableFooter table={table} footnote={footnote} />
    </div>
  )
}
