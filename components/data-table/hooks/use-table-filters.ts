import { useCallback, useMemo, useState } from 'react'

export function useTableFilters() {
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

  const setColumnFilter = useCallback((column: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [column]: value }))
  }, [])

  const clearColumnFilter = useCallback((column: string) => {
    setColumnFilters((prev) => {
      const { [column]: _, ...rest } = prev
      return rest
    })
  }, [])

  const clearAllColumnFilters = useCallback(() => {
    setColumnFilters({})
  }, [])

  const activeFilterCount = useMemo(
    () => Object.values(columnFilters).filter((v) => v.length > 0).length,
    [columnFilters]
  )

  return {
    columnFilters,
    setColumnFilter,
    clearColumnFilter,
    clearAllColumnFilters,
    activeFilterCount,
  }
}
