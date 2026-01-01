/**
 * Column sorting configuration
 */

import type { BuiltInSortingFn, ColumnDef } from '@tanstack/react-table'

import type { CustomSortingFnNames, getCustomSortingFns } from '../sorting-fns'

/**
 * Built-in sorting function names from TanStack Table
 */
const BUILTIN_SORTING_FNS = [
  'alphanumeric',
  'alphanumericCaseSensitive',
  'text',
  'textCaseSensitive',
  'datetime',
  'basic',
] as const

/**
 * Assigns sorting function to column definition
 *
 * Checks both custom sorting functions and TanStack built-in functions
 */
export function assignSortingFn<TData>(
  columnDef: ColumnDef<TData, unknown>,
  sortingFnName: string | undefined,
  customSortingFns: ReturnType<typeof getCustomSortingFns<TData>>
): void {
  if (!sortingFnName) return

  // Check if it's one of our custom sorting functions
  if (sortingFnName in customSortingFns) {
    columnDef.sortingFn =
      customSortingFns[sortingFnName as CustomSortingFnNames]
    return
  }

  // Check if it's a built-in sorting function name
  if (BUILTIN_SORTING_FNS.includes(sortingFnName as BuiltInSortingFn)) {
    columnDef.sortingFn = sortingFnName as BuiltInSortingFn
  }
}
