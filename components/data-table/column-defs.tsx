import {
  CaretDownIcon,
  CaretSortIcon,
  CaretUpIcon,
} from '@radix-ui/react-icons'
import type { ColumnDef, Row, RowData, Table } from '@tanstack/react-table'

import { formatCell } from '@/components/data-table/format-cell'
import { Button } from '@/components/ui/button'
import { ColumnFormat, ColumnFormatOptions } from '@/lib/types/column-format'
import { type QueryConfig } from '@/lib/types/query-config'

export type ColumnType = { [key: string]: string }

const formatHeader = (name: string, format: ColumnFormat) => {
  switch (format) {
    case ColumnFormat.Action:
      return <div className="text-muted-foreground">action</div>
    default:
      return <div className="text-muted-foreground">{name}</div>
  }
}

export const normalizeColumnName = (column: string) => {
  return column.toLocaleLowerCase().replace('readable_', '').trim()
}

/**
 * Generates an array of column definitions based on the provided configuration.
 *
 * @param {QueryConfig} config - The configuration object for the query.
 *
 * @returns {ColumnDef<ColumnType>[]} - An array of column definitions.
 */
export const getColumnDefs = <TData extends RowData, TValue>(
  config: QueryConfig
): ColumnDef<TData, TValue>[] => {
  const configColumns = config.columns || []

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

    return {
      id: name,
      accessorKey: column,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {formatHeader(name, columnFormat)}

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
      ),

      cell: ({
        table,
        row,
        getValue,
      }: {
        table: Table<TData>
        row: Row<TData>
        getValue: () => any
      }) => {
        const value = getValue()
        const formatted = formatCell<TData, TValue>(
          table,
          row,
          value,
          column,
          columnFormat,
          columnFormatOptions
        )

        return formatted
      },
    }
  })
}
