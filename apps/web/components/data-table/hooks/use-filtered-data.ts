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

export function useFilteredData<TData>({
  data,
  enableColumnFilters,
  columnFilters,
  globalSearch = '',
  advancedFilters = [],
}: UseFilteredDataOptions<TData>) {
  const filteredData = useMemo(() => {
    let result = data

    // 1. Apply old/existing columnFilters if enabled
    if (enableColumnFilters && Object.keys(columnFilters).length > 0) {
      const activeFilters = Object.entries(columnFilters).filter(
        ([_, value]) => value.length > 0
      )

      if (activeFilters.length > 0) {
        result = result.filter((row) => {
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

            return valueToCheck
              .toLowerCase()
              .includes(filterValue.toLowerCase())
          })
        })
      }
    }

    // 2. Apply Global Search
    if (globalSearch.trim().length > 0) {
      const searchLower = globalSearch.toLowerCase().trim()
      result = result.filter((row) => {
        const rowObj = row as Record<string, unknown>
        return Object.values(rowObj).some((val) => {
          if (val === null || val === undefined) return false
          if (typeof val === 'object' || typeof val === 'function') return false
          return String(val).toLowerCase().includes(searchLower)
        })
      })
    }

    // 3. Apply Advanced Filters
    if (advancedFilters.length > 0) {
      result = result.filter((row) => {
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

    return result
  }, [data, columnFilters, enableColumnFilters, globalSearch, advancedFilters])

  return filteredData
}
