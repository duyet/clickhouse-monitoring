/**
 * Hook for computing filter state from URL params
 */

'use client'

import type { QueryConfig } from '@/types/query-config'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

interface UseFilterStateOptions {
  filterParamPresets?: QueryConfig['filterParamPresets']
  defaultParams?: QueryConfig['defaultParams']
}

interface FilterState {
  selected: URLSearchParams
  filters: NonNullable<QueryConfig['filterParamPresets']>
  selectedCount: number
}

/**
 * Compute filter state from URL search parameters
 *
 * Combines preset filters with custom filters from URL params.
 */
export function useFilterState({
  filterParamPresets = [],
  defaultParams = {},
}: UseFilterStateOptions): FilterState {
  const searchParams = useSearchParams()

  const selected = useMemo(() => {
    const params = new URLSearchParams(searchParams)

    // Add default params have not null value
    Object.entries(defaultParams).forEach(([key, value]) => {
      if (value !== '' && !params.has(key)) {
        params.set(key, value as string)
      }
    })

    return params
  }, [searchParams, defaultParams])

  const filters = useMemo<
    NonNullable<QueryConfig['filterParamPresets']>
  >(() => {
    const filterNotFromPreset = Object.keys(defaultParams)
      // Key in URL Params
      .filter((key) => selected.has(key))
      // And custom that value is not in presets
      .filter(
        (key) =>
          !selected.has(
            key,
            filterParamPresets.find((preset) => preset.key === key)?.value
          )
      )
      .map((key) => ({
        key,
        name: selected.get(key)
          ? filterParamPresets.find((preset) => preset.key === key)?.name
          : `${key} = N/A`,
        value: selected.get(key),
      })) as NonNullable<QueryConfig['filterParamPresets']>

    return [...filterParamPresets, ...filterNotFromPreset]
  }, [filterParamPresets, defaultParams, selected])

  const selectedCount = useMemo(
    () =>
      filters.filter(
        (filter) =>
          selected.has(filter.key) && selected.get(filter.key) === filter.value
      ).length,
    [filters, selected]
  )

  return {
    selected,
    filters,
    selectedCount,
  }
}
