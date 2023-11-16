import { ColumnDef } from '@tanstack/react-table'
import {
  CaretSortIcon,
  CaretUpIcon,
  CaretDownIcon,
} from '@radix-ui/react-icons'

import type { QueryConfig } from '@/lib/clickhouse-queries'
import { formatCell } from '@/components/data-table/cell'
import { Button } from '@/components/ui/button'

export enum ColumnFormat {
  Code = 'code',
  Duration = 'duration',
  Boolean = 'boolean',
  Action = 'action',
  None = 'none',
}

export type ColumnType = { [key: string]: string }

const formatHeader = (name: any, format: ColumnFormat) => {
  switch (format) {
    case ColumnFormat.Action:
      return <div className='text-muted-foreground'>action</div>
    default:
      return <div className='text-muted-foreground'>{name}</div>
  }
}

export const getColumns = (config: QueryConfig): ColumnDef<ColumnType>[] => {
  return config.columns.map((column) => {
    // Remove the `readable_` prefix
    const name = column.replace('readable_', '')
    // Format the cell
    const format = config.columnFormats?.[column] || ColumnFormat.None

    return {
      accessorKey: column,
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {formatHeader(name, format)}

          {column.getIsSorted() === false ? (
            <CaretSortIcon className='ml-2 h-4 w-4' />
          ) : null}
          {column.getIsSorted() === 'asc' ? (
            <CaretUpIcon className='ml-2 h-4 w-4' />
          ) : null}
          {column.getIsSorted() === 'desc' ? (
            <CaretDownIcon className='ml-2 h-4 w-4' />
          ) : null}
        </Button>
      ),

      cell: ({ row }) => {
        const val = row.getValue(column)
        const formatted = formatCell(val, format)

        return formatted
      },
    }
  })
}
