'use client'

import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowData,
  useReactTable,
} from '@tanstack/react-table'

import type { ApiResponseMetadata } from '@/lib/api/types'
import type { ChartQueryParams } from '@/types/chart-data'
import type { QueryConfig } from '@/types/query-config'

import { useMemo } from 'react'
import {
  DataTableContent,
  DataTableFooter,
  DataTableHeader,
} from '@/components/data-table/components'
import {
  useAutoFitColumns,
  useFilteredData,
  useTableColumns,
  useTableFilters,
  useTablePersistence,
  useTableState,
  useVirtualRows,
} from '@/components/data-table/hooks'
import { ColumnManager } from '@/components/data-table/column-manager'
import { SelectionManager } from '@/components/data-table/selection-manager'
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
  /** Query execution metadata */
  metadata?: Partial<ApiResponseMetadata>
  /** Enable column reordering with drag-and-drop (default: true) */
  enableColumnReordering?: boolean
  /** Storage key for persisting column order to localStorage */
  columnOrderStorageKey?: string
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
  onRowSelectionChange: _onRowSelectionChange,
  metadata,
  enableColumnReordering = true,
  columnOrderStorageKey,
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

  // Centralized table state management
  const {
    sorting,
    setSorting,
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
    columnOrder,
    setColumnOrder,
    rowSelection,
    setRowSelection,
  } = useTableState<TData>({
    defaultPageSize,
    enableRowSelection,
    enableColumnReordering,
  })

  // Column visibility (integrates with useTableState)
  // Note: useColumnVisibility provides initialColumnVisibility calculation
  const { columnVisibility: _, setColumnVisibility: __ } = useColumnVisibility({
    allColumns,
    configuredColumns,
  })

  // Persistence layer (localStorage + URL sync)
  const persistence = useTablePersistence({
    queryConfigName: queryConfig.name,
    enableUrlSync: enableFilterUrlSync,
    urlPrefix: filterUrlPrefix,
    storageKey: columnOrderStorageKey
      ? `data-table-column-order-${columnOrderStorageKey}`
      : undefined,
  })

  // Load and persist column order
  const handleColumnOrderChange = persistence.syncColumnOrder

  // Selection manager
  const selectionManager = SelectionManager<TData>({
    enabled: enableRowSelection,
    rowSelection,
    onRowSelectionChange: setRowSelection,
  })

  // Combine selection column with other columns when enabled
  const finalColumnDefs = useMemo(
    () =>
      enableRowSelection && selectionManager.selectionColumn
        ? [selectionManager.selectionColumn, ...columnDefs]
        : columnDefs,
    [enableRowSelection, selectionManager.selectionColumn, columnDefs]
  )

  // Generate unique row ID from data
  const getRowId = useMemo(
    () => (row: TData, index: number) => {
      const record = row as Record<string, unknown>
      if (record.query_id) return String(record.query_id)
      if (record.id) return String(record.id)
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
    sortingFns: getCustomSortingFns<TData>(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: (updater) => {
      const newOrder =
        typeof updater === 'function'
          ? updater(table.getState().columnOrder)
          : updater
      setColumnOrder(newOrder)
      persistence.syncColumnOrder(newOrder)
    },
    enableRowSelection: !!enableRowSelection,
    getRowId,
    onRowSelectionChange: setRowSelection,
    enableSorting: true,
    state: {
      sorting,
      columnVisibility,
      columnSizing,
      rowSelection,
      columnOrder,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
      columnVisibility: initialColumnVisibility,
    },
  })

  // Virtual rows for large datasets
  const rows = table.getRowModel().rows
  const { virtualizer, tableContainerRef, isVirtualized } = useVirtualRows(
    rows.length
  )

  // Column manager for column operations
  const columnManager = ColumnManager<TData>({
    table,
    columns: finalColumnDefs,
    columnOrder,
    onColumnOrderChange: (newOrder) => {
      setColumnOrder(newOrder)
      persistence.syncColumnOrder(newOrder)
    },
    columnSizing,
    onColumnSizingChange: setColumnSizing,
    columnVisibility,
    onColumnVisibilityChange: setColumnVisibility,
    tableContainerRef,
    enableColumnReordering,
    onResetColumnOrder: () => {
      const newOrder: ColumnOrderState = []
      setColumnOrder(newOrder)
      persistence.syncColumnOrder(newOrder)
      setColumnSizing({})
    },
  })

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
        metadata={metadata}
        enableColumnReordering={enableColumnReordering}
        onResetColumnOrder={columnManager.handleResetOrder}
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
        onAutoFit={columnManager.handleAutoFit}
        enableColumnReordering={enableColumnReordering}
        onColumnOrderChange={columnManager.handleDragEnd}
        onResetColumnOrder={columnManager.handleResetOrder}
      />

      <DataTableFooter table={table} footnote={footnote} />
    </div>
  )
}
