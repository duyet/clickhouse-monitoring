/**
 * Column definition generator for TanStack Table
 *
 * Generates an array of column definitions based on query configuration.
 * Handles formatting, sorting, filtering, and cell rendering.
 */

import type {
  Column,
  ColumnDef,
  Row,
  RowData,
  Table,
} from '@tanstack/react-table'
import { ColumnHeader } from './components/column-header'
import { ColumnCell } from './components/column-cell'
import { assignSortingFn } from './sorting'
import {
  isColumnFilterable,
  normalizeColumnName,
  parseColumnFormat,
} from './utils'
import { getCustomSortingFns } from '../sorting-fns'
import type { ColumnFilterContext, GetColumnDefsOptions } from './types'
import type { ColumnFormat, ColumnFormatOptions } from '@/types/column-format'

export * from './types'
export { normalizeColumnName } from './utils'

/**
 * Generates an array of column definitions based on the provided configuration.
 *
 * @param config - The configuration object for the query.
 * @param data - The data array for cell rendering context.
 * @param context - Additional context for cell formatting.
 * @param filterContext - Optional filter context for column filtering.
 *
 * @returns An array of column definitions.
 *
 * @example
 * ```tsx
 * const columns = getColumnDefs(config, data, {}, {
 *   enableColumnFilters: true,
 *   filterableColumns: ['name', 'status'],
 *   columnFilters: { name: 'foo' },
 *   setColumnFilter: (col, val) => {...},
 *   clearColumnFilter: (col) => {...},
 * })
 * ```
 */
export function getColumnDefs<
  TData extends RowData,
  TValue extends React.ReactNode,
>(
  config: GetColumnDefsOptions<TData>['config'],
  data: TData[],
  context: GetColumnDefsOptions<TData>['context'],
  filterContext?: ColumnFilterContext
): ColumnDef<TData, TValue>[] {
  const configColumns = config.columns || []
  const customSortingFns = getCustomSortingFns<TData>()

  const {
    enableColumnFilters = false,
    filterableColumns = [],
    columnFilters = {},
    setColumnFilter,
  } = filterContext || {}

  return configColumns.map((column) => {
    const name = normalizeColumnName(column)
    const { format: columnFormat, options: columnFormatOptions } =
      parseColumnFormat(column, config.columnFormats || {})
    const sortingFnName = config.sortingFns?.[name]

    // Check if this column should have a filter
    const isFilterable = isColumnFilterable(
      name,
      enableColumnFilters,
      filterableColumns
    )

    // Create the column definition
    const columnDef: ColumnDef<TData, TValue> = {
      id: name,
      accessorKey: column,

      header: ({ column: col }) => (
        <ColumnHeader<TData>
          column={col as Column<TData, unknown>}
          name={name}
          format={columnFormat as ColumnFormat}
          icon={config.columnIcons?.[name]}
          isFilterable={isFilterable}
          filterValue={columnFilters[name] || ''}
          onFilterChange={(value) => setColumnFilter?.(name, value)}
        />
      ),

      cell: ({
        table,
        row,
        getValue,
      }: {
        table: Table<TData>
        row: Row<TData>
        getValue: () => TValue
      }) => (
        <ColumnCell<TData, TValue>
          table={table}
          data={data}
          row={row}
          getValue={getValue}
          columnKey={column}
          context={context}
          format={columnFormat as ColumnFormat}
          formatOptions={columnFormatOptions as ColumnFormatOptions}
        />
      ),
    }

    // Add the sorting function if specified
    assignSortingFn(columnDef, sortingFnName, customSortingFns)

    return columnDef
  })
}
