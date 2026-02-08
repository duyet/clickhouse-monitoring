import type { Row, RowData, Table } from '@tanstack/react-table'

import type { ColumnFormat, ColumnFormatOptions } from '@/types/column-format'

/**
 * Props passed to all formatter components
 *
 * Note: 'data' prop was removed to improve memoization effectiveness.
 * Formatters that need row data should use row.original instead of data[row.index].
 */
export interface FormatterProps<TData extends RowData, TValue> {
  table: Table<TData>
  row: Row<TData>
  value: TValue
  columnName: string
  context: Record<string, string>
  options?: ColumnFormatOptions
}

/**
 * Base formatter function type for simple inline transformations
 * These formatters only need the value and return a React node
 */
export type InlineFormatter<TValue = unknown> = (
  value: TValue
) => React.ReactNode

/**
 * Value-only formatter function type
 * These formatters need value and optionally options
 */
export type ValueOnlyFormatter<TValue = unknown> = (
  value: TValue,
  options?: ColumnFormatOptions
) => React.ReactNode

/**
 * Row-context formatter function type
 * These formatters need full access to row, table, and context
 */
export type RowContextFormatter<
  TData extends RowData = RowData,
  TValue = unknown,
> = (props: FormatterProps<TData, TValue>) => React.ReactNode

/**
 * Union type for all formatters
 */
export type Formatter<TData extends RowData, TValue> =
  | InlineFormatter<TValue>
  | ValueOnlyFormatter<TValue>
  | RowContextFormatter<TData, TValue>

/**
 * Registry entry for a formatter
 */
export interface FormatterEntry<TData extends RowData, TValue> {
  type: 'inline' | 'value' | 'context'
  format: ColumnFormat
  formatter: Formatter<TData, TValue>
}

/**
 * Result of formatter lookup
 */
export interface FormatterLookupResult<TData extends RowData, TValue> {
  formatter: Formatter<TData, TValue>
  type: 'inline' | 'value' | 'context'
}
