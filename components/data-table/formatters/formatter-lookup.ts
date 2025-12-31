/**
 * Formatter lookup utilities
 *
 * Provides functions to retrieve formatters by type.
 */

import type { Row, RowData, Table } from '@tanstack/react-table'
import { ColumnFormat, type ColumnFormatOptions } from '@/types/column-format'
import { ADVANCED_FORMATTERS } from './advanced-formatters'
import { CONTEXT_FORMATTERS } from './context-formatters'
import { INLINE_FORMATTERS } from './inline-formatters'
import { VALUE_FORMATTERS } from './value-formatters'

/**
 * Get an inline formatter by format type
 */
export function getInlineFormatter(
  format: ColumnFormat
): ((value: unknown) => React.ReactNode) | undefined {
  return INLINE_FORMATTERS[format as keyof typeof INLINE_FORMATTERS]
}

/**
 * Get a value-only formatter by format type
 */
export function getValueFormatter(
  format: ColumnFormat
):
  | ((value: unknown, options?: ColumnFormatOptions) => React.ReactNode)
  | undefined {
  return VALUE_FORMATTERS[format as keyof typeof VALUE_FORMATTERS]
}

/**
 * Get a context formatter by format type
 */
export function getContextFormatter<TData extends RowData, TValue>(
  format: ColumnFormat
):
  | ((props: {
      table: Table<TData>
      data: TData[]
      row: Row<TData>
      value: TValue
      columnName: string
      context: Record<string, string>
      options?: ColumnFormatOptions
    }) => React.ReactNode)
  | undefined {
  return CONTEXT_FORMATTERS[format as keyof typeof CONTEXT_FORMATTERS] as any
}

/**
 * Get an advanced formatter by format type
 */
export function getAdvancedFormatter<TData extends RowData, TValue>(
  format: ColumnFormat
):
  | ((value: unknown, options?: ColumnFormatOptions) => React.ReactNode)
  | ((props: {
      table: Table<TData>
      data: TData[]
      row: Row<TData>
      value: TValue
      columnName: string
      context: Record<string, string>
      options?: ColumnFormatOptions
    }) => React.ReactNode)
  | undefined {
  return ADVANCED_FORMATTERS[format as keyof typeof ADVANCED_FORMATTERS] as any
}
