'use client'

import type { ColumnDef, RowData, RowSelectionState } from '@tanstack/react-table'

import type { ApiResponseMetadata } from '@/lib/api/types'
import type { ChartQueryParams } from '@/types/chart-data'
import type { QueryConfig } from '@/types/query-config'

import { useMemo } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
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
import { getCustomSortingFns } from '@/components/data-table/sorting-fns'

import { ColumnManager } from './column-manager'
import { SelectionManager } from './selection-manager'

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
 * @param enableRowSelection - Enable row selection with checkboxes (default: false)
 * @param onRowSelectionChange - Callback when row selection changes
 * @param metadata - Query execution metadata
 * @param enableColumnReordering - Enable column reordering with drag-and-drop (default: true)
 * @param columnOrderStorageKey - Storage key for persisting column order to localStorage
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
 * High-level orchestrator that delegates to specialized hooks and sub-components:
 * - useTableState: Centralized state management (sorting, pagination, visibility)
 * - useTablePersistence: localStorage and URL state persistence
 * - ColumnManager: Column operations (visibility, sizing, reordering)
 * - SelectionManager: Row selection with checkboxes
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
 * - Column resizing with drag-and-drop
 * - Row selection with checkboxes
 * - localStorage persistence for column order
 * - Responsive design with shadcn/ui components
 *
 * Performance optimizations:
 * - Memoized sub-components prevent unnecessary re-renders
 * - Virtualization reduces DOM nodes from thousands to ~100
 * - Efficient column calculations with useMemo
 * - Separate concerns reduce cyclomatic complexity
 *
 * Architecture benefits:
 * - Single responsibility principle: each hook/component handles one concern
 * - Better testability: individual features can be tested in isolation
 * - Improved maintainability: easier to understand and modify
 * - Enhanced reusability: hooks and components can be used independently
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
  const tableState = useTableState<TData>({
    queryConfig,
    allColumns,
    configuredColumns,
    enableRowSelection,
    defaultPageSize,
  })

  // Table persistence (localStorage + URL)
  const persistence = useTablePersistence({
    columnOrderStorageKey,
    queryConfigName: queryConfig.name,
    enableUrlSync: enableFilterUrlSync,
    urlPrefix: filterUrlPrefix,
  })

  // Load persisted column order on mount
  const initialColumnOrder = useMemo(() => {
    if (enableColumnReordering) {
      return persistence.loadColumnOrder()
    }
    return []
  }, [enableColumnReordering, persistence])

  // If we have initial column order from persistence, set it
  if (enableColumnReordering && tableState.columnOrder.length === 0 && initialColumnOrder.length > 0) {
    tableState.setColumnOrder(initialColumnOrder)
  }

  // URL state management for filters
  if (enableUrlSync) {
    const urlState = persistence.loadUrlState()
    if (urlState.sorting.length > 0 && tableState.sorting.length === 0) {
      tableState.setSorting(urlState.sorting)
    }
    if (Object.keys(urlState.columnVisibility).length > 0 && Object.keys(tableState.columnVisibility).length === 0) {
      tableState.setColumnVisibility({
        ...initialColumnVisibility,
        ...urlState.columnVisibility,
      })
    }
    if (Object.keys(urlState.rowSelection).length > 0 && Object.keys(tableState.rowSelection).length === 0) {
      tableState.setRowSelection(urlState.rowSelection)
    }
  }

  // Handle column order change with persistence
  const handleColumnOrderChange = (order: string[]) => {
    tableState.setColumnOrder(order)
    if (enableColumnReordering) {
      persistence.saveColumnOrder(order)
    }
  }

  // Handle drag end for column reordering
  const handleDragEnd = (activeId: string, overId: string) => {
    if (!enableColumnReordering) return

    const currentOrder = tableState.columnOrder
    const allColumnIds = columnDefs.map((col) => col.id!).filter(Boolean)

    const effectiveOrder = currentOrder.length > 0 ? currentOrder : allColumnIds
    const oldIndex = effectiveOrder.indexOf(activeId)
    const newIndex = effectiveOrder.indexOf(overId)

    if (oldIndex !== -1 && newIndex !== -1) {
      const arrayMove = (arr: string[], from: number, to: number) => {
        const result = [...arr]
        const [removed] = result.splice(from, 1)
        result.splice(to, 0, removed)
        return result
      }
      const newOrder = arrayMove(effectiveOrder, oldIndex, newIndex)
      handleColumnOrderChange(newOrder)
    }
  }

  // Handle reset column order
  const handleResetColumnOrder = () => {
    handleColumnOrderChange([])
    if (enableColumnReordering) {
      persistence.clearColumnOrder()
    }
  }

  // Use ColumnManager for column operations
  const columnManager = ColumnManager<TData>({
    enabled: enableColumnReordering,
    columnOrder: tableState.columnOrder,
    onColumnOrderChange: handleColumnOrderChange,
    columnVisibility: tableState.columnVisibility,
    onColumnVisibilityChange: tableState.setColumnVisibility,
    columnSizing: tableState.columnSizing,
    onColumnSizingChange: tableState.setColumnSizing,
    columnDefs,
    data: filteredData,
    queryConfig,
    getRowId: tableState.getRowId,
    onDragEnd: handleDragEnd,
    onResetColumnOrder: handleResetColumnOrder,
  })

  // Use SelectionManager for row selection
  const selectionManager = SelectionManager<TData>({
    enabled: enableRowSelection,
    rowSelection: tableState.rowSelection,
    onRowSelectionChange: (selection) => {
      tableState.setRowSelection(selection)
      _onRowSelectionChange?.(selection)
      // Update URL if sync enabled
      if (enableFilterUrlSync) {
        persistence.updateUrlState({ rowSelection: selection })
      }
    },
    columnDefs: columnManager.finalColumnDefs || columnDefs,
    data: filteredData,
    getRowId: tableState.getRowId,
  })

  // Get the table from selection manager (it's the source of truth with selection enabled)
  const table = enableRowSelection ? selectionManager.table : columnManager.table

  // Virtual rows for large datasets (auto-enables at 1000+ rows)
  const rows = table.getRowModel().rows
  const { virtualizer, tableContainerRef, isVirtualized } = useVirtualRows(
    rows.length
  )

  // Auto-fit columns functionality
  const { autoFitColumn } = useAutoFitColumns<TData>(tableContainerRef)

  // Handle auto-fit request for a specific column
  const handleAutoFit = (columnId: string) => {
    const column = table.getColumn(columnId)
    if (!column) return

    const headerText = column.columnDef.header as string
    autoFitColumn(column, rows, headerText)
  }

  // Export sorted state to URL when sorting changes
  if (enableFilterUrlSync && tableState.sorting.length > 0) {
    persistence.updateUrlState({ sorting: tableState.sorting })
  }

  // Export column visibility to URL when it changes
  if (enableFilterUrlSync) {
    const visibleState = tableState.columnVisibility
    if (Object.keys(visibleState).length > 0) {
      persistence.updateUrlState({ columnVisibility: visibleState })
    }
  }

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
        onResetColumnOrder={handleResetColumnOrder}
      />

      <DataTableContent
        title={title}
        description={description}
        queryConfig={queryConfig}
        table={table}
        columnDefs={columnManager.finalColumnDefs || columnDefs}
        tableContainerRef={tableContainerRef}
        isVirtualized={isVirtualized}
        virtualizer={virtualizer}
        activeFilterCount={activeFilterCount}
        onAutoFit={handleAutoFit}
        enableColumnReordering={enableColumnReordering}
        onColumnOrderChange={handleDragEnd}
        onResetColumnOrder={handleResetColumnOrder}
      />

      <DataTableFooter table={table} footnote={footnote} />
    </div>
  )
}