'use client'

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
  type RowData,
} from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'

import {
  getColumnDefs,
  normalizeColumnName,
} from '@/components/data-table/column-defs'
import { DataTablePagination } from '@/components/data-table/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { uniq } from '@/lib/utils'
import type { QueryConfig } from '@/types/query-config'

import { withQueryParams } from '@/lib/clickhouse-query'
import { ColumnVisibilityButton } from './buttons/column-visibility'
import { ShowSQLButton } from './buttons/show-sql'
import { DataTableToolbar } from './data-table-toolbar'
import { Footnote, type FootnoteProps } from './footnote'
import { getCustomSortingFns } from './sorting-fns'

interface DataTableProps<TData extends RowData> {
  title?: string
  description?: string | React.ReactNode
  toolbarExtras?: React.ReactNode
  topRightToolbarExtras?: React.ReactNode
  queryConfig: QueryConfig
  queryParams?: Record<string, any>
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
  // Columns available in the data, normalized (memoized to prevent recalculation)
  const allColumns: string[] = useMemo(
    () =>
      uniq(
        (data.filter((row) => typeof row === 'object') as object[])
          .flatMap((row) => Object.keys(row))
          .map(normalizeColumnName)
      ),
    [data]
  )

  // Configured columns available, normalized
  const configuredColumns = useMemo(
    () => queryConfig.columns.map(normalizeColumnName),
    [queryConfig.columns]
  )

  // Add `ctx.` prefix to all keys (memoized to prevent recalculation)
  const contextWithPrefix = useMemo(
    () =>
      Object.entries(context).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [`ctx.${key}`]: value,
        }),
        {} as Record<string, string>
      ),
    [context]
  )

  // Determine which columns should be filterable
  const columnsToFilter = useMemo(() => {
    if (filterableColumns) return filterableColumns
    // By default, all configured columns are filterable when enabled
    return enableColumnFilters ? configuredColumns : []
  }, [filterableColumns, configuredColumns, enableColumnFilters])

  // Client-side column filtering state
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

  // Column filter handlers (memoized with useCallback to prevent recreation on every render)
  const setColumnFilter = useCallback((column: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: value,
    }))
  }, [])

  const clearColumnFilter = useCallback((column: string) => {
    setColumnFilters((prev) => {
      const { [column]: _, ...rest } = prev
      return rest
    })
  }, [])

  const clearAllColumnFilters = useCallback(() => {
    setColumnFilters({})
  }, [])

  // Apply client-side filters when enabled
  const filteredData = useMemo(() => {
    if (!enableColumnFilters || Object.keys(columnFilters).length === 0) {
      return data
    }

    const activeFilters = Object.entries(columnFilters).filter(
      ([_, value]) => value.length > 0
    )

    if (activeFilters.length === 0) return data

    return data.filter((row) => {
      return activeFilters.every(([column, filterValue]) => {
        // Check both original column name and normalized name
        const rowObj = row as Record<string, unknown>
        const originalValue = rowObj[column]
        const normalizedName = normalizeColumnName(column)
        const normalizedValue = rowObj[normalizedName]

        const valueToCheck =
          originalValue !== undefined
            ? String(originalValue)
            : normalizedValue !== undefined
              ? String(normalizedValue)
              : ''

        return valueToCheck.toLowerCase().includes(filterValue.toLowerCase())
      })
    })
  }, [data, columnFilters, enableColumnFilters])

  // Column definitions for the table (memoized to prevent recalculation)
  const columnDefs = useMemo(
    () =>
      getColumnDefs<TData, TValue>(
        queryConfig,
        filteredData,
        contextWithPrefix,
        enableColumnFilters
          ? {
              enableColumnFilters,
              filterableColumns: columnsToFilter,
              columnFilters,
              setColumnFilter,
              clearColumnFilter,
            }
          : undefined
      ) as ColumnDef<TData, TValue>[],
    [
      queryConfig,
      filteredData,
      contextWithPrefix,
      enableColumnFilters,
      columnsToFilter,
      columnFilters,
      setColumnFilter,
      clearColumnFilter,
    ]
  )

  // Only show the columns in QueryConfig['columns'] list by initial
  const initialColumnVisibility = useMemo(
    () =>
      allColumns.reduce(
        (state, col) => ({
          ...state,
          [col]: configuredColumns.includes(col),
        }),
        {} as VisibilityState
      ),
    [allColumns, configuredColumns]
  )
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility
  )

  // Sorting
  const [sorting, setSorting] = useState<SortingState>([])

  const activeFilterCount = Object.values(columnFilters).filter(
    (v) => v.length > 0
  ).length

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
    <div className={className}>
      <div className="flex flex-row items-start justify-between pb-4">
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
                Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
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
              sql={withQueryParams(queryConfig.sql, queryParams)}
            />
          )}
          <ColumnVisibilityButton table={table} />
        </div>
      </div>

      <div className="mb-5 rounded-md border" role="region" aria-label={`${title || 'Data'} table`}>
        <Table aria-describedby="table-description">
          <caption id="table-description" className="sr-only">
            {description || queryConfig.description || `${title} data table`}
          </caption>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} scope="col">
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                <TableCell
                  colSpan={columnDefs.length}
                  className="h-64 p-4"
                >
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

      <div className="flex items-center justify-between px-2">
        <Footnote table={table} footnote={footnote} />
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}
