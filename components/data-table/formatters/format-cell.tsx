/**
 * Main cell formatting function
 *
 * Orchestrates formatter selection and application.
 */

import type { Row, RowData, Table } from '@tanstack/react-table'

import {
  getAdvancedFormatter,
  getContextFormatter,
  getInlineFormatter,
  getValueFormatter,
} from './formatter-lookup'
import {
  hasAdvancedFormatter,
  hasContextFormatter,
  hasInlineFormatter,
  hasValueFormatter,
} from './formatter-selector'
import { ColumnFormat, type ColumnFormatOptions } from '@/types/column-format'

/**
 * Format a cell value using the appropriate formatter
 *
 * This is the main entry point for cell formatting.
 * It checks formatters in order: inline → value → advanced → context
 *
 * @param table - TanStack Table instance
 * @param data - Full table data array
 * @param row - Current row being formatted
 * @param value - Cell value to format
 * @param columnName - Name of the column
 * @param context - Template variable context
 * @param format - Format type to apply
 * @param columnFormatOptions - Optional formatter-specific options
 */
export function formatCell<
  TData extends RowData,
  TValue extends React.ReactNode,
>(
  table: Table<TData>,
  data: TData[],
  row: Row<TData>,
  value: TValue,
  columnName: string,
  context: Record<string, string>,
  format: ColumnFormat,
  columnFormatOptions?: ColumnFormatOptions
): React.ReactNode {
  // 1. Check inline formatters first (fastest - pure functions)
  if (hasInlineFormatter(format)) {
    const formatter = getInlineFormatter(format)
    if (formatter) {
      return formatter(value)
    }
  }

  // 2. Check value-only formatters (need value + options)
  if (hasValueFormatter(format)) {
    const formatter = getValueFormatter(format)
    if (formatter) {
      return formatter(value, columnFormatOptions)
    }
  }

  // 3. Check advanced formatters (value-only or context)
  if (hasAdvancedFormatter(format)) {
    const formatter = getAdvancedFormatter<TData, TValue>(format)
    if (formatter) {
      // Advanced formatters can be either value-only or context-based
      // Check if it's CodeToggle (needs row context)
      if (format === ColumnFormat.CodeToggle) {
        return (formatter as any)({
          table,
          data,
          row,
          value,
          columnName,
          context,
          options: columnFormatOptions,
        })
      }
      // Other advanced formatters are value-only
      return (formatter as any)(value, columnFormatOptions)
    }
  }

  // 4. Check context formatters (need full context)
  if (hasContextFormatter(format)) {
    const formatter = getContextFormatter<TData, TValue>(format)
    if (formatter) {
      return formatter({
        table,
        data,
        row,
        value,
        columnName,
        context,
        options: columnFormatOptions,
      })
    }
  }

  // 5. Default fallback - simple text display
  return <span className="truncate text-wrap">{value as string}</span>
}
