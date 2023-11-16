import { ColumnDef } from '@tanstack/react-table'
import type { QueryConfig } from '@/lib/clickhouse-queries'
import { ColumnFormat } from '@/lib/clickhouse-queries'
import dayjs from '@/lib/dayjs'

export type ColumnType = { [key: string]: string }

const formatValue = (value: any, format: ColumnFormat) => {
  switch (format) {
    case ColumnFormat.Code:
      return <code>{value}</code>
    case ColumnFormat.Duration:
      return dayjs.duration({ seconds: parseFloat(value) }).humanize()

    default:
      return value
  }
}

export const getColumns = (config: QueryConfig): ColumnDef<ColumnType>[] => {
  return config.columns.map((column) => {
    // Remove the `readable_` prefix
    const name = column.replace('readable_', '')
    // Format the cell
    const columnFormat = config.columnFormats?.[column] || ColumnFormat.None

    return {
      accessorKey: column,
      header: () => <div className='text-muted-foreground'>{name}</div>,
      cell: ({ row }) => {
        const val = row.getValue(column)
        const formatted = formatValue(val, columnFormat)

        return formatted
      },
    }
  })
}
