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
import { useMemo, useState } from 'react'

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
  footnote?: FootnoteProps<TData>['footnote']
  className?: string
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

  // Column definitions for the table (memoized to prevent recalculation)
  const columnDefs = useMemo(
    () =>
      getColumnDefs<TData, TValue>(
        queryConfig,
        data,
        contextWithPrefix
      ) as ColumnDef<TData, TValue>[],
    [queryConfig, data, contextWithPrefix]
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

  const table = useReactTable({
    data,
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

      <div className="mb-5 rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  className="h-24 text-center"
                >
                  No results.
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
