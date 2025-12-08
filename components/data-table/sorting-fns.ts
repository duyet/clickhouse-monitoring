import type { ValueOf } from '@/types/generic'
import type { Row, RowData, SortingFn } from '@tanstack/react-table'

/**
 * Get sorting functions for the table.
 * Reference: https://tanstack.com/table/v8/docs/guide/sorting#custom-sorting-functions
 *
 * @param <TData> - The type of the data in the table.
 * @returns - The sorting functions for the table.
 */
export const getCustomSortingFns = <TData extends RowData>() => {
  return {
    sort_column_using_actual_value: (
      rowA: Row<TData>,
      rowB: Row<TData>,
      columnId: string
    ): number => {
      const colName = columnId.replace('readable_', '').replace('pct_', '')
      const valueA = rowA.original[colName as keyof TData]
      const valueB = rowB.original[colName as keyof TData]

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return valueA - valueB
      }

      return 0
    },
  } as Record<string, SortingFn<TData>>
}

export type CustomSortingFnNames = keyof ReturnType<typeof getCustomSortingFns>
export type CustomSortingFn = ValueOf<ReturnType<typeof getCustomSortingFns>>
