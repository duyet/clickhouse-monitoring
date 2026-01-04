import { normalizeColumnName } from '../column-defs'
import { useMemo } from 'react'

interface UseFilteredDataOptions<TData> {
  data: TData[]
  enableColumnFilters: boolean
  columnFilters: Record<string, string>
}

export function useFilteredData<TData>({
  data,
  enableColumnFilters,
  columnFilters,
}: UseFilteredDataOptions<TData>) {
  const filteredData = useMemo(() => {
    if (!enableColumnFilters || Object.keys(columnFilters).length === 0) {
      return data
    }

    const activeFilters = Object.entries(columnFilters).filter(
      ([_, value]) => value.length > 0
    )

    if (activeFilters.length === 0) return data

    return data.filter((row) => {
      return activeFilters.every(([column, filterValue]) => {
        const rowObj = row as Record<string, unknown>
        const originalValue = rowObj[column]
        const normalizedName = normalizeColumnName(column)
        const normalizedValue = rowObj[normalizedName]

        const valueToCheck =
          originalValue !== undefined
            ? String(originalValue)
            : normalizedValue !== undefined
              ? String(normalizedValue)
              : ''

        return valueToCheck.toLowerCase().includes(filterValue.toLowerCase())
      })
    })
  }, [data, columnFilters, enableColumnFilters])

  return filteredData
}
