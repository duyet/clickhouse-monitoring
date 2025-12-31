'use client'

import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowData,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { Loader2Icon } from 'lucide-react'
import { memo, useMemo, useState } from 'react'

import { DataTablePagination } from '@/components/data-table/pagination'
import {
  Table,
  TableBody,
  TableHeader,
} from '@/components/ui/table'
import { withQueryParams } from '@/lib/clickhouse-query'
import { cn } from '@/lib/utils'
import type { ChartQueryParams } from '@/types/chart-data'
import type { QueryConfig } from '@/types/query-config'
import { ColumnVisibilityButton } from './buttons/column-visibility'
import { ShowSQLButton } from './buttons/show-sql'
import { DataTableToolbar } from './data-table-toolbar'
import { Footnote, type FootnoteProps } from './footnote'
import {
  useColumnVisibility,
  useFilteredData,
  useTableColumns,
  useTableFilters,
  useVirtualRows,
} from './hooks'
import { getCustomSortingFns } from './sorting-fns'
import {
  TableBody as TableBodyRenderer,
  TableHeader as TableHeaderRenderer,
} from './renderers'

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
 * @param templateContext - Template replacement context for links (e.g., { database: 'system' })
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
  footnote?: FootnoteProps['footnote']
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
}

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

  // Column calculations and definitions
  const { allColumns, columnDefs, initialColumnVisibility } = useTableColumns<
    TData,
    TValue
  >({
    queryConfig,
    data,
    context,
    filteredData,
    filterContext: enableColumnFilters
      ? {
          enableColumnFilters,
          filterableColumns: filterableColumns || configuredColumns,
          columnFilters,
          setColumnFilter,
          clearColumnFilter,
        }
      : undefined,
  })

  // Column visibility
  const { columnVisibility, setColumnVisibility } = useColumnVisibility({
    allColumns,
    configuredColumns,
  })

  // Sorting
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: filteredData,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    // Add custom sorting functions
    // Ref: https://tanstack.com/table/v8/docs/guide/sorting#custom-sorting-functions
    sortingFns: getCustomSortingFns<TData>(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
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

  return (
    <div className={cn('flex flex-col', className)}>
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
      />

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
      />

      <DataTableFooter
        table={table}
        footnote={footnote}
      />
    </div>
  )
}

// ============================================================================
// Table Header Component
// ============================================================================

interface DataTableHeaderProps<TData extends RowData> {
  title: string
  description: string | React.ReactNode
  queryConfig: QueryConfig
  toolbarExtras?: React.ReactNode
  topRightToolbarExtras?: React.ReactNode
  showSQL: boolean
  table: import('@tanstack/react-table').Table<TData>
  queryParams?: ChartQueryParams
  isRefreshing: boolean
  enableColumnFilters: boolean
  activeFilterCount: number
  clearAllColumnFilters: () => void
}

const DataTableHeader = memo(function DataTableHeader<TData extends RowData>({
  title,
  description,
  queryConfig,
  toolbarExtras,
  topRightToolbarExtras,
  showSQL,
  table,
  queryParams,
  isRefreshing,
  enableColumnFilters,
  activeFilterCount,
  clearAllColumnFilters,
}: DataTableHeaderProps<TData>) {
  return (
    <div className="flex shrink-0 flex-row items-start justify-between pb-2">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-muted-foreground flex-none text-xl">
              {title}
            </h1>
            {isRefreshing && (
              <Loader2Icon
                className="text-muted-foreground size-4 animate-spin"
                aria-label="Loading data"
              />
            )}
          </div>
          <DataTableToolbar queryConfig={queryConfig}>
            {toolbarExtras}
          </DataTableToolbar>
          {enableColumnFilters && activeFilterCount > 0 && (
            <button
              onClick={clearAllColumnFilters}
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              aria-label={`Clear ${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}`}
            >
              Clear {activeFilterCount} filter
              {activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {description || queryConfig.description}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {topRightToolbarExtras}
        {showSQL && (
          <ShowSQLButton
            sql={withQueryParams(queryConfig.sql, queryParams?.params)}
          />
        )}
        <ColumnVisibilityButton table={table} />
      </div>
    </div>
  )
}) as <TData extends RowData>(props: DataTableHeaderProps<TData>) => JSX.Element

// ============================================================================
// Table Content Component
// ============================================================================

interface DataTableContentProps<TData extends RowData, TValue extends React.ReactNode> {
  title: string
  description: string | React.ReactNode
  queryConfig: QueryConfig
  table: any
  columnDefs: any[]
  tableContainerRef: React.RefObject<HTMLDivElement>
  isVirtualized: boolean
  virtualizer: ReturnType<typeof useVirtualRows>['virtualizer']
  activeFilterCount: number
}

const DataTableContent = memo(function DataTableContent<
  TData extends RowData,
  TValue extends React.ReactNode
>({
  title,
  description,
  queryConfig,
  table,
  columnDefs,
  tableContainerRef,
  isVirtualized,
  virtualizer,
  activeFilterCount,
}: DataTableContentProps<TData, TValue>) {
  return (
    <div
      ref={tableContainerRef}
      className="mb-5 min-h-0 flex-1 overflow-auto rounded-lg border border-border/50 bg-card/30"
      role="region"
      aria-label={`${title || 'Data'} table`}
      style={isVirtualized ? { height: '600px' } : undefined}
    >
      <Table aria-describedby="table-description">
        <caption id="table-description" className="sr-only">
          {description || queryConfig.description || `${title} data table`}
        </caption>
        <TableHeader className="bg-muted/50">
          <TableHeaderRenderer headerGroups={table.getHeaderGroups()} />
        </TableHeader>
        <TableBody>
          <TableBodyRenderer
            table={table}
            columnDefs={columnDefs}
            isVirtualized={isVirtualized}
            virtualizer={virtualizer}
            title={title}
            activeFilterCount={activeFilterCount}
          />
        </TableBody>
      </Table>
    </div>
  )
}) as <TData extends RowData, TValue extends React.ReactNode>(
  props: DataTableContentProps<TData, TValue>
) => JSX.Element

// ============================================================================
// Table Footer Component
// ============================================================================

interface DataTableFooterProps<TData extends RowData> {
  table: import('@tanstack/react-table').Table<TData>
  footnote?: FootnoteProps['footnote']
}

const DataTableFooter = memo(function DataTableFooter<TData extends RowData>({ table, footnote }: DataTableFooterProps<TData>) {
  return (
    <div className="flex shrink-0 items-center justify-between px-2">
      <Footnote table={table} footnote={footnote} />
      <DataTablePagination table={table} />
    </div>
  )
}) as <TData extends RowData>(props: DataTableFooterProps<TData>) => JSX.Element
