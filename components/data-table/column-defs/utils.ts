/**
 * Column definition utilities
 */

import { ColumnFormat } from '@/types/column-format'

/**
 * Normalizes column name for consistent lookup
 * Converts to lowercase and removes 'readable_' prefix
 */
export function normalizeColumnName(column: string): string {
  return column.toLocaleLowerCase().replace('readable_', '').trim()
}

/**
 * Parses column format from config
 * Handles both simple format strings and format-with-options tuples
 */
export function parseColumnFormat(
  column: string,
  config: Record<string, unknown>
): { format: ColumnFormat; options?: Record<string, unknown> } {
  const format = config[column] || config[normalizeColumnName(column)] || ColumnFormat.None

  if (Array.isArray(format) && format.length === 2) {
    return {
      format: format[0] as ColumnFormat,
      options: format[1] as Record<string, unknown>,
    }
  }

  return { format: format as ColumnFormat }
}

/**
 * Checks if a column should be filterable based on context
 */
export function isColumnFilterable(
  columnName: string,
  enableColumnFilters: boolean,
  filterableColumns: string[]
): boolean {
  return (
    enableColumnFilters &&
    (filterableColumns.length === 0 || filterableColumns.includes(columnName))
  )
}
