/**
 * Column definition types
 */

import type { RowData } from '@tanstack/react-table'

import type { QueryConfig } from '@/types/query-config'

export type ColumnType = { [key: string]: string }

/**
 * Column filter context type
 *
 * Provides filter state and callbacks for column filtering.
 * Uses getFilterValue callback instead of columnFilters object to prevent
 * unnecessary re-renders when filter values change.
 */
export interface ColumnFilterContext {
  enableColumnFilters?: boolean
  filterableColumns?: string[]
  getFilterValue: (column: string) => string
  setColumnFilter: (column: string, value: string) => void
  clearColumnFilter: (column: string) => void
}

export interface GetColumnDefsOptions<TData extends RowData> {
  config: QueryConfig
  data: TData[]
  context: Record<string, string>
  filterContext?: ColumnFilterContext
}

export interface ColumnFormatInfo {
  format: string
  options?: Record<string, unknown>
}
