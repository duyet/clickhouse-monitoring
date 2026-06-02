'use client'

import useSWR from 'swr'

import type { FilterFieldOption } from '@/lib/filters/types'

import { apiFetch } from '@/lib/swr/api-fetch'

interface FilterOptionsResponse {
  options: { value: string; count: number }[]
}

/**
 * Load the distinct values for a `select` filter field that declares
 * `dynamicOptions`. Results are ordered by frequency (most common first) and
 * cached aggressively — option lists rarely change within a session.
 */
export function useFilterOptions(
  configName: string,
  fieldKey: string,
  hostId: number,
  enabled: boolean
): {
  options: FilterFieldOption[]
  isLoading: boolean
  error: Error | undefined
} {
  const url = `/api/v1/tables/${configName}/filter-options?key=${encodeURIComponent(
    fieldKey
  )}&hostId=${hostId}`

  const { data, error, isLoading } = useSWR<FilterOptionsResponse, Error>(
    enabled ? url : null,
    async (requestUrl: string) => {
      const response = await apiFetch(requestUrl)
      if (!response.ok) {
        throw new Error('Failed to load filter options')
      }
      return response.json() as Promise<FilterOptionsResponse>
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
      refreshInterval: 300_000,
      keepPreviousData: true,
    }
  )

  const options: FilterFieldOption[] = (data?.options ?? []).map((option) => ({
    label: option.value,
    value: option.value,
  }))

  return { options, isLoading, error }
}
