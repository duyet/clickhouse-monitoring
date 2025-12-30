/**
 * Column Filter Component
 *
 * Provides debounced text input for filtering table columns
 * Can be added to table headers for client-side filtering
 *
 * @example
 * ```tsx
 * <ColumnFilter
 *   column="query"
 *   value={filterValue}
 *   onChange={setFilterValue}
 *   placeholder="Filter queries..."
 * />
 * ```
 */

'use client'

import { DebouncedInput } from '@/components/ui/debounced-input'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ColumnFilterProps {
  /** Column identifier */
  column: string
  /** Current filter value */
  value: string
  /** Callback when filter value changes */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Whether to show clear button */
  showClear?: boolean
  /** Additional class names */
  className?: string
}

export function ColumnFilter({
  column,
  value,
  onChange,
  placeholder = 'Filter...',
  showClear = true,
  className,
}: ColumnFilterProps) {
  const hasValue = value.length > 0

  return (
    <div className={cn('flex items-center gap-1.5 w-full max-w-[180px]', className)}>
      <DebouncedInput
        value={value}
        onValueChange={onChange}
        placeholder={placeholder}
        debounceMs={300}
        className={cn(
          'h-7 w-full text-xs',
          'bg-muted/30 border-transparent',
          'focus:bg-background focus:border-primary/50',
          'placeholder:text-muted-foreground/60',
          'transition-colors'
        )}
      />
      {showClear && hasValue && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-muted/60"
          onClick={() => onChange('')}
          aria-label={`Clear ${column} filter`}
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}

/**
 * Column Filter Provider Hook
 *
 * Manages filter state for table columns
 * Returns filtered data and filter controls
 *
 * @example
 * ```tsx
 * const { filteredData, filters, setFilter, clearFilter } = useColumnFilters(data, ['query', 'user'])
 * ```
 */

import { useMemo, useState } from 'react'

export interface ColumnFiltersState {
  filteredData: unknown[]
  filters: Record<string, string>
  setFilter: (column: string, value: string) => void
  clearFilter: (column: string) => void
  clearAllFilters: () => void
  hasFilters: boolean
}

export function useColumnFilters<T extends Record<string, unknown>>(
  data: T[],
  columns: string[] = []
): ColumnFiltersState {
  // Get all column keys from data if not provided
  const filterColumns = useMemo(() => {
    if (columns.length > 0) return columns
    if (data.length === 0) return []
    return Object.keys(data[0] || {})
  }, [columns, data])

  const [filters, setFiltersState] = useState<Record<string, string>>({})

  const setFilter = (column: string, value: string) => {
    setFiltersState((prev) => ({
      ...prev,
      [column]: value,
    }))
  }

  const clearFilter = (column: string) => {
    setFiltersState((prev) => {
      const { [column]: _, ...rest } = prev
      return rest
    })
  }

  const clearAllFilters = () => {
    setFiltersState({})
  }

  // Filter data based on active filters
  const filteredData = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(([_, value]) => value.length > 0)

    if (activeFilters.length === 0) {
      return data
    }

    return data.filter((row) => {
      return activeFilters.every(([column, filterValue]) => {
        const cellValue = String(row[column] ?? '').toLowerCase()
        const searchValue = filterValue.toLowerCase()
        return cellValue.includes(searchValue)
      })
    })
  }, [data, filters])

  const hasFilters = Object.keys(filters).some((key) => filters[key].length > 0)

  return {
    filteredData,
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    hasFilters,
  }
}
