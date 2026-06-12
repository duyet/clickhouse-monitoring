import type { ColumnDef, RowData } from '@tanstack/react-table'

import type { QueryConfig } from '@/types/query-config'

import {
  type ColumnFilterContext,
  getColumnDefs,
  type SchemaColumnFilterContext,
} from '../column-defs'
import { useMemo } from 'react'

interface UseTableColumnsOptions<TData extends RowData, _TValue> {
  queryConfig: QueryConfig
  context: Record<string, string>
  filteredData: TData[]
  filterContext?: ColumnFilterContext
  schemaFilterContext?: SchemaColumnFilterContext
}

interface UseTableColumnsReturn<TData extends RowData, TValue> {
  contextWithPrefix: Record<string, string>
  columnDefs: ColumnDef<TData, TValue>[]
}

export function useTableColumns<
  TData extends RowData,
  TValue extends React.ReactNode,
>({
  queryConfig,
  context,
  filteredData,
  filterContext,
  schemaFilterContext,
}: UseTableColumnsOptions<TData, TValue>): UseTableColumnsReturn<
  TData,
  TValue
> {
  // Add `ctx.` prefix to all keys (memoized to prevent recalculation)
  // Use JSON.stringify for stable comparison - context is a small object
  // and referential equality fails when callers create inline objects.
  const _contextKey = useMemo(() => JSON.stringify(context), [context])
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the stringified context so the memo is value-stable even when callers recreate the object each render
  const contextWithPrefix = useMemo(
    () =>
      Object.entries(context).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [`ctx.${key}`]: value,
        }),
        {} as Record<string, string>
      ),
    [_contextKey]
  )

  // Column definitions for the table (memoized to prevent recalculation)
  const columnDefs = useMemo(
    () =>
      getColumnDefs<TData, TValue>(
        queryConfig,
        filteredData,
        contextWithPrefix,
        filterContext,
        schemaFilterContext
      ) as ColumnDef<TData, TValue>[],
    [
      queryConfig,
      filteredData,
      contextWithPrefix,
      filterContext,
      schemaFilterContext,
    ]
  )

  return {
    contextWithPrefix,
    columnDefs,
  }
}
