import { normalizeColumnName } from '../column-defs'
import { useMemo } from 'react'

export interface TableFilterCondition {
  id: string
  columnId: string
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'notContains'
  value: string
}

interface UseFilteredDataOptions<TData> {
  data: TData[]
  enableColumnFilters: boolean
  columnFilters: Record<string, string>
  globalSearch?: string
  advancedFilters?: TableFilterCondition[]
}

/**
 * Apply per-column substring filters to a dataset.
 *
 * Each active column filter must match for a row to be included (AND logic).
 * Matching is case-insensitive and falls back from the original column name to
 * its normalised form (strips `readable_` prefix) so display columns map
 * correctly to their underlying data fields.
 *
 * Exported for unit testing. The hook calls this internally.
 */
export function applyColumnFilters<TData>(
  data: TData[],
  columnFilters: Record<string, string>,
  enableColumnFilters: boolean
): TData[] {
  if (!enableColumnFilters || Object.keys(columnFilters).length === 0) {
    return data
  }

  const activeFilters = Object.entries(columnFilters).filter(
    ([, value]) => value.length > 0
  )

  if (activeFilters.length === 0) return data

  return data.filter((row) => {
    return activeFilters.every(([column, filterValue]) => {
      const rowObj = row as Record<string, unknown>
      const originalValue = rowObj[column]
      const normalizedName = normalizeColumnName(column)
      const normalizedValue = rowObj[normalizedName]

      const valueToCheck =
        originalValue !== undefined && originalValue !== null
          ? String(originalValue)
          : normalizedValue !== undefined && normalizedValue !== null
            ? String(normalizedValue)
            : ''

      return valueToCheck.toLowerCase().includes(filterValue.toLowerCase())
    })
  })
}

/**
 * Apply a global search term across all primitive column values of each row.
 *
 * Object and function values are skipped (they cannot be meaningfully
 * stringified for search). Null / undefined values are treated as empty.
 *
 * Exported for unit testing. The hook calls this internally.
 */
export function applyGlobalSearch<TData>(
  data: TData[],
  globalSearch: string
): TData[] {
  if (!globalSearch.trim()) return data

  const searchLower = globalSearch.toLowerCase().trim()
  return data.filter((row) => {
    const rowObj = row as Record<string, unknown>
    return Object.values(rowObj).some((val) => {
      if (val === null || val === undefined) return false
      if (typeof val === 'object' || typeof val === 'function') return false
      return String(val).toLowerCase().includes(searchLower)
    })
  })
}

/**
 * Apply a list of typed advanced filter conditions to a dataset (AND logic).
 *
 * Exported for unit testing. The hook calls this internally.
 */
export function applyAdvancedFilters<TData>(
  data: TData[],
  advancedFilters: TableFilterCondition[]
): TData[] {
  if (advancedFilters.length === 0) return data

  return data.filter((row) => {
    const rowObj = row as Record<string, unknown>
    return advancedFilters.every(({ columnId, operator, value }) => {
      const originalValue = rowObj[columnId]
      const normalizedName = normalizeColumnName(columnId)
      const normalizedValue = rowObj[normalizedName]

      const valStr =
        originalValue !== undefined && originalValue !== null
          ? String(originalValue)
          : normalizedValue !== undefined && normalizedValue !== null
            ? String(normalizedValue)
            : ''

      const cellLower = valStr.toLowerCase()
      const filterLower = value.toLowerCase()

      switch (operator) {
        case 'contains':
          return cellLower.includes(filterLower)
        case 'equals':
          return cellLower === filterLower
        case 'startsWith':
          return cellLower.startsWith(filterLower)
        case 'endsWith':
          return cellLower.endsWith(filterLower)
        case 'notContains':
          return !cellLower.includes(filterLower)
        default:
          return true
      }
    })
  })
}

export function useFilteredData<TData>({
  data,
  enableColumnFilters,
  columnFilters,
  globalSearch = '',
  advancedFilters = [],
}: UseFilteredDataOptions<TData>) {
  const filteredData = useMemo(() => {
    let result = applyColumnFilters(data, columnFilters, enableColumnFilters)
    result = applyGlobalSearch(result, globalSearch)
    result = applyAdvancedFilters(result, advancedFilters)
    return result
  }, [data, columnFilters, enableColumnFilters, globalSearch, advancedFilters])

  return filteredData
}
