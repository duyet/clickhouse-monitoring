'use client'

import { Loader2Icon } from 'lucide-react'
import type { RowData } from '@tanstack/react-table'

import type { ApiResponseMetadata } from '@/lib/api/types'
import type { ChartQueryParams } from '@/types/chart-data'
import type { QueryConfig } from '@/types/query-config'

import { memo } from 'react'
import { CardToolbar } from '@/components/cards/card-toolbar'
import { ColumnVisibilityButton } from '@/components/data-table/buttons/column-visibility'
import { ResetColumnOrderButton } from '@/components/data-table/buttons/reset-column-order'
import { BulkActions } from '@/components/data-table/components/bulk-actions'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { getSqlForDisplay } from '@/types/query-config'

/**
 * Props for the DataTableHeader component
 *
 * @template TData - The row data type (extends RowData from TanStack Table)
 *
 * @param title - Table title displayed in header
 * @param description - Table description or subtitle
 * @param queryConfig - Query configuration defining columns, formats, sorting
 * @param toolbarExtras - Additional toolbar elements (left side)
 * @param topRightToolbarExtras - Additional toolbar elements (right side)
 * @param showSQL - Show SQL button visibility
 * @param table - TanStack Table instance
 * @param queryParams - Parameters for query execution (search, sort, pagination)
 * @param isRefreshing - Show loading indicator when refreshing data
 * @param enableColumnFilters - Enable client-side column text filtering
 * @param activeFilterCount - Number of active column filters
 * @param clearAllColumnFilters - Callback to clear all column filters
 */
export interface DataTableHeaderProps<TData extends RowData> {
  /** Table title displayed in header */
  title: string
  /** Table description or subtitle */
  description: string | React.ReactNode
  /** Query configuration defining columns, formats, sorting */
  queryConfig: QueryConfig
  /** Additional toolbar elements (left side) */
  toolbarExtras?: React.ReactNode
  /** Additional toolbar elements (right side) */
  topRightToolbarExtras?: React.ReactNode
  /** Show SQL button visibility */
  showSQL: boolean
  /** TanStack Table instance */
  table: import('@tanstack/react-table').Table<TData>
  /** Parameters for query execution (search, sort, pagination) */
  queryParams?: ChartQueryParams
  /** Show loading indicator when refreshing data */
  isRefreshing: boolean
  /** Enable client-side column text filtering */
  enableColumnFilters: boolean
  /** Number of active column filters */
  activeFilterCount: number
  /** Callback to clear all column filters */
  clearAllColumnFilters: () => void
  /** The actual SQL that was executed (after version selection) */
  executedSql?: string
  /** Query execution metadata */
  metadata?: Partial<ApiResponseMetadata>
  /** Enable column reordering with drag-and-drop */
  enableColumnReordering?: boolean
  /** Callback to reset column order to default */
  onResetColumnOrder?: () => void
}

export const DataTableHeader = memo(function DataTableHeader<
  TData extends RowData,
>({
  title,
  description,
  queryConfig,
  toolbarExtras,
  topRightToolbarExtras,
  showSQL,
  table,
  queryParams: _queryParams,
  isRefreshing,
  enableColumnFilters,
  activeFilterCount,
  clearAllColumnFilters,
  executedSql,
  metadata,
  enableColumnReordering = false,
  onResetColumnOrder,
}: DataTableHeaderProps<TData>) {
  // Use executed SQL if provided, otherwise fallback to config SQL
  const displaySql = executedSql || getSqlForDisplay(queryConfig.sql)
  return (
    <div className="flex min-w-0 shrink-0 flex-row items-start justify-between gap-4 pb-2">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-muted-foreground flex-none text-xl">{title}</h1>
            {isRefreshing && (
              <Loader2Icon
                className="text-muted-foreground size-4 animate-spin"
                aria-label="Loading data"
              />
            )}
          </div>
          <DataTableToolbar queryConfig={queryConfig}>
            {toolbarExtras}
          </DataTableToolbar>
          {queryConfig.bulkActions && queryConfig.bulkActions.length > 0 && (
            <BulkActions
              table={table}
              bulkActions={queryConfig.bulkActions}
              bulkActionKey={queryConfig.bulkActionKey || 'query_id'}
            />
          )}
          {enableColumnFilters && activeFilterCount > 0 && (
            <button
              onClick={clearAllColumnFilters}
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              aria-label={`Clear ${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}`}
            >
              Clear {activeFilterCount} filter
              {activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
        </div>
        <p className="text-muted-foreground truncate text-sm">
          {description || queryConfig.description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {topRightToolbarExtras}
        {enableColumnReordering && onResetColumnOrder && (
          <ResetColumnOrderButton onReset={onResetColumnOrder} />
        )}
        <ColumnVisibilityButton table={table} />
        {showSQL && (
          <CardToolbar sql={displaySql} metadata={metadata} alwaysVisible />
        )}
      </div>
    </div>
  )
}) as <TData extends RowData>(
  props: DataTableHeaderProps<TData>
) => React.JSX.Element
