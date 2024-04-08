'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  type RowData,
} from '@tanstack/react-table'
import { useState } from 'react'

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
import { Toaster } from '@/components/ui/toaster'
import { type QueryConfig } from '@/lib/types/query-config'
import { uniq } from '@/lib/utils'

import { ColumnVisibilityButton } from './buttons/column-visibility'
import { ShowSQLButton } from './buttons/show-sql'
import { DataTableToolbar } from './data-table-toolbar'

interface DataTableProps<TData extends RowData> {
  title?: string
  description?: string
  toolbarExtras?: React.ReactNode
  topRightToolbarExtras?: React.ReactNode
  config: QueryConfig
  data: TData[]
  defaultPageSize?: number
  showSQL?: boolean
}

export function DataTable<TData extends RowData, TValue>({
  title = '',
  description = '',
  toolbarExtras,
  topRightToolbarExtras,
  config,
  data,
  defaultPageSize = 100,
  showSQL = true,
}: DataTableProps<TData>) {
  // Columns available in the data, normalized
  const allColumns: string[] = uniq(
    (data.filter((row) => typeof row === 'object') as object[])
      .map((row) => Object.keys(row))
      .flat()
      .map(normalizeColumnName)
  )

  // Configured columns available, normalized
  const configuredColumns = config.columns.map(normalizeColumnName)

  // Column definitions for the table
  const columnDefs = getColumnDefs<TData, TValue>(config) as ColumnDef<
    TData,
    TValue
  >[]

  // Only show the columns in QueryConfig['columns'] list by initial
  const initialColumnVisibility = allColumns.reduce(
    (state, col) => ({
      ...state,
      [col]: configuredColumns.includes(col),
    }),
    {}
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
    <div>
      <Toaster />

      <div className="flex flex-row items-center justify-between pb-4">
        <div>
          <h1 className="text-xl text-muted-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {description || config.description}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {topRightToolbarExtras}
          {showSQL ? <ShowSQLButton sql={config.sql} /> : null}
          <ColumnVisibilityButton table={table} />
        </div>
      </div>

      <DataTableToolbar
        config={config}
        extras={toolbarExtras}
        className="mb-2"
      />

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
      <DataTablePagination table={table} />
    </div>
  )
}
