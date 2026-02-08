/**
 * Column cell component with formatted content
 */

'use client'

import type { Row, RowData, Table } from '@tanstack/react-table'

import type { ColumnFormat, ColumnFormatOptions } from '@/types/column-format'

import { memo } from 'react'
import { formatCell } from '@/components/data-table/formatters'

interface ColumnCellProps<
  TData extends RowData,
  TValue extends React.ReactNode,
> {
  table: Table<TData>
  row: Row<TData>
  getValue: () => TValue
  columnKey: string
  context: Record<string, string>
  format: ColumnFormat
  formatOptions?: ColumnFormatOptions
}

/**
 * Wrapper component for formatted cell content
 *
 * PERFORMANCE: Memoized to prevent unnecessary re-renders.
 * Only re-renders when the actual cell value or format options change.
 * For a table with 100 rows × 10 columns, this prevents 1000+ formatCell calls
 * on parent re-renders.
 *
 * Note: 'data' prop was removed to improve memoization effectiveness.
 * Formatters that need row data now use row.original instead of data[row.index].
 */
export const ColumnCell = memo(function ColumnCell<
  TData extends RowData,
  TValue extends React.ReactNode,
>({
  table,
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
    row,
    value,
    columnKey,
    context,
    format,
    formatOptions
  )
}) as <TData extends RowData, TValue extends React.ReactNode>(
  props: ColumnCellProps<TData, TValue>
) => React.JSX.Element
