/**
 * Column cell component with formatted content
 */

'use client'

import type { Column, Row, RowData, Table } from '@tanstack/react-table'
import { formatCell } from '@/components/data-table/format-cell'
import type { ColumnFormat, ColumnFormatOptions } from '@/types/column-format'

interface ColumnCellProps<TData extends RowData, TValue extends React.ReactNode> {
  table: Table<TData>
  data: TData[]
  row: Row<TData>
  getValue: () => TValue
  columnKey: string
  context: Record<string, string>
  format: ColumnFormat
  formatOptions?: ColumnFormatOptions
}

/**
 * Wrapper component for formatted cell content
 */
export function ColumnCell<TData extends RowData, TValue extends React.ReactNode>({
  table,
  data,
  row,
  getValue,
  columnKey,
  context,
  format,
  formatOptions,
}: ColumnCellProps<TData, TValue>) {
  const value = getValue()

  return formatCell<TData, TValue>(
    table,
    data,
    row,
    value,
    columnKey,
    context,
    format,
    formatOptions
  )
}
