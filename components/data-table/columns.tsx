import {
  CaretDownIcon,
  CaretSortIcon,
  CaretUpIcon,
} from '@radix-ui/react-icons'
import { ColumnDef } from '@tanstack/react-table'

import type { QueryConfig } from '@/lib/types/query-config'
import { Button } from '@/components/ui/button'
import { formatCell } from '@/components/data-table/cell'

export enum ColumnFormat {
  Code = 'code',
  CodeToggle = 'code-toggle',
  Duration = 'duration',
  Boolean = 'boolean',
  Action = 'action',
  Badge = 'badge',
  None = 'none',
}

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
export const getColumnDefs = (config: QueryConfig): ColumnDef<ColumnType>[] => {
  const configColumns = config.columns || []

  return configColumns.map((column) => {
    const name = normalizeColumnName(column)
    const columnFormat =
      config.columnFormats?.[column] ||
      config.columnFormats?.[name] ||
      ColumnFormat.None

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
            <CaretSortIcon className="ml-2 h-4 w-4" />
          ) : null}
          {column.getIsSorted() === 'asc' ? (
            <CaretUpIcon className="ml-2 h-4 w-4" />
          ) : null}
          {column.getIsSorted() === 'desc' ? (
            <CaretDownIcon className="ml-2 h-4 w-4" />
          ) : null}
        </Button>
      ),

      cell: ({ row, getValue }) => {
        const value = getValue()
        const formatted = formatCell(row, value, columnFormat)

        return formatted
      },
    }
  })
}
