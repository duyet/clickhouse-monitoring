import type { ColumnDef, RowData, VisibilityState } from '@tanstack/react-table'

import type { QueryConfig } from '@/types/query-config'

import {
  type ColumnFilterContext,
  getColumnDefs,
  normalizeColumnName,
} from '../column-defs'
import { useMemo } from 'react'

interface UseTableColumnsOptions<TData extends RowData, _TValue> {
  queryConfig: QueryConfig
  context: Record<string, string>
  filteredData: TData[]
  filterContext?: ColumnFilterContext
}

interface UseTableColumnsReturn<TData extends RowData, TValue> {
  configuredColumns: string[]
  contextWithPrefix: Record<string, string>
  columnDefs: ColumnDef<TData, TValue>[]
  initialColumnVisibility: VisibilityState
}

export function useTableColumns<
  TData extends RowData,
  TValue extends React.ReactNode,
>({
  queryConfig,
  context,
  filteredData,
  filterContext,
}: UseTableColumnsOptions<TData, TValue>): UseTableColumnsReturn<
  TData,
  TValue
> {
  // Configured columns available, normalized
  const configuredColumns = useMemo(
    () => queryConfig.columns.map(normalizeColumnName),
    [queryConfig.columns]
  )

  // Add `ctx.` prefix to all keys (memoized to prevent recalculation)
  const contextWithPrefix = useMemo(
    () =>
      Object.entries(context).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [`ctx.${key}`]: value,
        }),
        {} as Record<string, string>
      ),
    [context]
  )

  // Column definitions for the table (memoized to prevent recalculation)
  const columnDefs = useMemo(
    () =>
      getColumnDefs<TData, TValue>(
        queryConfig,
        filteredData,
        contextWithPrefix,
        filterContext
      ) as ColumnDef<TData, TValue>[],
    [queryConfig, filteredData, contextWithPrefix, filterContext]
  )

  // Initial column visibility state
  const initialColumnVisibility: VisibilityState = useMemo(
    () =>
      configuredColumns.reduce(
        (state, col) => ({
          ...state,
          [col]: true,
        }),
        {} as VisibilityState
      ),
    [configuredColumns]
  )

  return {
    configuredColumns,
    contextWithPrefix,
    columnDefs,
    initialColumnVisibility,
  }
}
