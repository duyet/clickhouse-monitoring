/**
 * Formatters Module
 *
 * Provides a centralized registry for all cell formatters used in data tables.
 * Formatters are organized by complexity:
 * - Inline: Simple value transformations (no context needed)
 * - Value: Component formatters that only need value + options
 * - Context: Formatters requiring row/table context
 * - Advanced: Complex formatters with special behaviors
 *
 * @module formatters
 */

import type { Row, RowData, Table } from '@tanstack/react-table'
import { ColumnFormat, type ColumnFormatOptions } from '@/types/column-format'

import { ADVANCED_FORMATTERS } from './advanced-formatters'
import { CONTEXT_FORMATTERS } from './context-formatters'
import { INLINE_FORMATTERS } from './inline-formatters'
import { VALUE_FORMATTERS } from './value-formatters'

export type {
  Formatter,
  FormatterEntry,
  FormatterLookupResult,
  FormatterProps,
  InlineFormatter,
  RowContextFormatter,
  ValueOnlyFormatter,
} from './types'

/**
 * Master formatter registry combining all formatter types
 */
export const FORMATTER_REGISTRY = {
  inline: INLINE_FORMATTERS,
  value: VALUE_FORMATTERS,
  context: CONTEXT_FORMATTERS,
  advanced: ADVANCED_FORMATTERS,
} as const

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
): ((value: unknown, options?: ColumnFormatOptions) => React.ReactNode) | undefined {
  return VALUE_FORMATTERS[format as keyof typeof VALUE_FORMATTERS]
}

/**
 * Get a context formatter by format type
 */
export function getContextFormatter<
  TData extends RowData,
  TValue,
>(
  format: ColumnFormat
): ((
  props: {
    table: Table<TData>
    data: TData[]
    row: Row<TData>
    value: TValue
    columnName: string
    context: Record<string, string>
    options?: ColumnFormatOptions
  }
) => React.ReactNode) | undefined {
  return CONTEXT_FORMATTERS[format as keyof typeof CONTEXT_FORMATTERS] as any
}

/**
 * Get an advanced formatter by format type
 */
export function getAdvancedFormatter<
  TData extends RowData,
  TValue,
>(
  format: ColumnFormat
): ((value: unknown, options?: ColumnFormatOptions) => React.ReactNode) | ((props: {
  table: Table<TData>
  data: TData[]
  row: Row<TData>
  value: TValue
  columnName: string
  context: Record<string, string>
  options?: ColumnFormatOptions
}) => React.ReactNode) | undefined {
  return ADVANCED_FORMATTERS[format as keyof typeof ADVANCED_FORMATTERS] as any
}

/**
 * Check if a format type has an inline formatter
 */
export function hasInlineFormatter(format: ColumnFormat): boolean {
  return format in INLINE_FORMATTERS
}

/**
 * Check if a format type has a value-only formatter
 */
export function hasValueFormatter(format: ColumnFormat): boolean {
  return format in VALUE_FORMATTERS
}

/**
 * Check if a format type has a context formatter
 */
export function hasContextFormatter(format: ColumnFormat): boolean {
  return format in CONTEXT_FORMATTERS
}

/**
 * Check if a format type has an advanced formatter
 */
export function hasAdvancedFormatter(format: ColumnFormat): boolean {
  return format in ADVANCED_FORMATTERS
}

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
  return (
    <span className="truncate text-wrap">
      {value as string}
    </span>
  )
}

// Re-export all formatters for direct access if needed
export * from './advanced-formatters'
export * from './context-formatters'
export * from './inline-formatters'
export * from './value-formatters'
