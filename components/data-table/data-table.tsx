'use client'

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowData,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { DataTablePagination } from '@/components/data-table/pagination'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { withQueryParams } from '@/lib/clickhouse-query'
import { cn } from '@/lib/utils'
import type { QueryConfig } from '@/types/query-config'
import type { ChartQueryParams } from '@/types/chart-data'
import { ColumnVisibilityButton } from './buttons/column-visibility'
import { ShowSQLButton } from './buttons/show-sql'
import { DataTableToolbar } from './data-table-toolbar'
import { Footnote, type FootnoteProps } from './footnote'
import { getCustomSortingFns } from './sorting-fns'
import {
  useColumnVisibility,
  useFilteredData,
  useTableColumns,
  useTableFilters,
} from './hooks'

interface DataTableProps<TData extends RowData> {
  title?: string
  description?: string | React.ReactNode
  toolbarExtras?: React.ReactNode
  topRightToolbarExtras?: React.ReactNode
  queryConfig: QueryConfig
  queryParams?: ChartQueryParams
  data: TData[]
  context: Record<string, string>
  defaultPageSize?: number
  showSQL?: boolean
  footnote?: FootnoteProps['footnote']
  className?: string
  /** Enable client-side column text filtering */
  enableColumnFilters?: boolean
  /** Columns to enable filtering for (default: all text columns) */
  filterableColumns?: string[]
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
  queryParams,
  data,
  context,
  defaultPageSize = 100,
  showSQL = true,
  footnote,
  className,
  enableColumnFilters = false,
  filterableColumns,
}: DataTableProps<TData>) {
  // Determine which columns should be filterable (memoized)
  const configuredColumns = useMemo(
    () =>
      queryConfig.columns.map((col) =>
        col.toLowerCase().replace('readable_', '').trim()
      ),
    [queryConfig.columns]
  )

  // Client-side column filtering state
  const {
    columnFilters,
    setColumnFilter,
    clearColumnFilter,
    clearAllColumnFilters,
    activeFilterCount,
  } = useTableFilters()

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

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex shrink-0 flex-row items-start justify-between pb-4">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h1 className="text-muted-foreground flex-none text-xl">{title}</h1>
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

      <div
        className="mb-5 min-h-0 flex-1 overflow-auto rounded-lg border border-border/50 bg-card/30"
        role="region"
        aria-label={`${title || 'Data'} table`}
      >
        <Table aria-describedby="table-description">
          <caption id="table-description" className="sr-only">
            {description || queryConfig.description || `${title} data table`}
          </caption>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      scope="col"
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'border-b border-border/50 transition-colors hover:bg-muted/50',
                    index % 2 === 1 && 'odd:bg-muted/30'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnDefs.length} className="h-64 p-4">
                  <EmptyState
                    variant="no-data"
                    title="No results"
                    description={
                      activeFilterCount > 0
                        ? `No ${title?.toLowerCase() || 'data'} match your filters. Try clearing filters or adjusting your search.`
                        : `No ${title?.toLowerCase() || 'data'} found. Try adjusting your query or check back later.`
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex shrink-0 items-center justify-between px-2">
        <Footnote table={table} footnote={footnote} />
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}
