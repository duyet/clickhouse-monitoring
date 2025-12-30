import {
  CaretDownIcon,
  CaretSortIcon,
  CaretUpIcon,
} from '@radix-ui/react-icons'
import type {
  BuiltInSortingFn,
  ColumnDef,
  Row,
  RowData,
  Table,
} from '@tanstack/react-table'

import { formatCell } from '@/components/data-table/format-cell'
import { Button } from '@/components/ui/button'
import { ColumnFilter } from '@/components/data-table/column-filter'
import { ColumnFormat, type ColumnFormatOptions } from '@/types/column-format'
import type { Icon } from '@/types/icon'
import type { QueryConfig } from '@/types/query-config'
import { type CustomSortingFnNames, getCustomSortingFns } from './sorting-fns'

export type ColumnType = { [key: string]: string }

export interface ColumnFilterContext {
  enableColumnFilters?: boolean
  filterableColumns?: string[]
  columnFilters: Record<string, string>
  setColumnFilter: (column: string, value: string) => void
  clearColumnFilter: (column: string) => void
}

const formatHeader = (name: string, format: ColumnFormat, icon?: Icon) => {
  const CustomIcon = icon

  switch (format) {
    case ColumnFormat.Action:
      return <div className="text-muted-foreground">action</div>
    default:
      return (
        <div className="text-muted-foreground">
          {CustomIcon ? <CustomIcon /> : null}
          {name}
        </div>
      )
  }
}

export const normalizeColumnName = (column: string) => {
  return column.toLocaleLowerCase().replace('readable_', '').trim()
}

/**
 * Generates an array of column definitions based on the provided configuration.
 *
 * @param {QueryConfig} config - The configuration object for the query.
 * @param {ColumnFilterContext} filterContext - Optional filter context for column filtering
 *
 * @returns {ColumnDef<ColumnType>[]} - An array of column definitions.
 */
export const getColumnDefs = <
  TData extends RowData,
  TValue extends React.ReactNode,
>(
  config: QueryConfig,
  data: TData[],
  context: Record<string, string>,
  filterContext?: ColumnFilterContext
): ColumnDef<TData, TValue>[] => {
  const configColumns = config.columns || []
  const customSortingFns = getCustomSortingFns<TData>()
  const {
    enableColumnFilters = false,
    filterableColumns = [],
    columnFilters = {},
    setColumnFilter,
    clearColumnFilter,
  } = filterContext || {}

  return configColumns.map((column) => {
    const name = normalizeColumnName(column)
    const format =
      config.columnFormats?.[column] ||
      config.columnFormats?.[name] ||
      ColumnFormat.None

    let columnFormat: ColumnFormat
    let columnFormatOptions: ColumnFormatOptions
    if (Array.isArray(format) && format.length === 2) {
      columnFormat = format[0] as ColumnFormat
      columnFormatOptions = format[1] as ColumnFormatOptions
    } else {
      columnFormat = format as ColumnFormat
    }

    // Check if this column should have a filter
    const isFilterable =
      enableColumnFilters &&
      (filterableColumns.length === 0 || filterableColumns.includes(name))

    // Create the column definition
    const columnDef: ColumnDef<TData, TValue> = {
      id: name,
      accessorKey: column,
      header: ({ column }) => (
        <div className="flex flex-col gap-1.5 py-1">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 truncate justify-start font-medium"
          >
            {formatHeader(name, columnFormat, config.columnIcons?.[name])}

            {column.getIsSorted() === false ? (
              <CaretSortIcon className="ml-2 size-4" />
            ) : null}
            {column.getIsSorted() === 'asc' ? (
              <CaretUpIcon className="ml-2 size-4" />
            ) : null}
            {column.getIsSorted() === 'desc' ? (
              <CaretDownIcon className="ml-2 size-4" />
            ) : null}
          </Button>
          {isFilterable && setColumnFilter && (
            <ColumnFilter
              column={name}
              value={columnFilters[name] || ''}
              onChange={(value) => setColumnFilter(name, value)}
              placeholder={`Filter ${name}...`}
              showClear
            />
          )}
        </div>
      ),

      cell: ({
        table,
        row,
        getValue,
      }: {
        table: Table<TData>
        row: Row<TData>
        getValue: () => TValue
      }) => {
        const value = getValue()
        const formatted = formatCell<TData, TValue>(
          table,
          data,
          row,
          value,
          column,
          context,
          columnFormat,
          columnFormatOptions
        )

        return formatted
      },
    }

    // Add the sorting function if specified
    const sortingFnName = config.sortingFns?.[name]
    if (sortingFnName) {
      // Check if it's one of our custom sorting functions
      if (sortingFnName in customSortingFns) {
        columnDef.sortingFn =
          customSortingFns[sortingFnName as CustomSortingFnNames]
      }
      // Check if it's a built-in sorting function name
      else if (
        [
          'alphanumeric',
          'alphanumericCaseSensitive',
          'text',
          'textCaseSensitive',
          'datetime',
          'basic',
        ].includes(sortingFnName)
      ) {
        columnDef.sortingFn = sortingFnName as BuiltInSortingFn
      }
    }

    return columnDef
  })
}
