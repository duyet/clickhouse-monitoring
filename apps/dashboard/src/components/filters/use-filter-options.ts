import { useQuery } from '@tanstack/react-query'

import type { FilterFieldOption } from '@/lib/filters/types'

import { apiFetch } from '@/lib/swr/api-fetch'
import { visibilityAwareInterval } from '@/lib/swr/config'

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

  const { data, error, isPending } = useQuery<FilterOptionsResponse, Error>({
    queryKey: ['filter-options', configName, fieldKey, hostId],
    queryFn: async () => {
      const response = await apiFetch(url)
      if (!response.ok) {
        throw new Error('Failed to load filter options')
      }
      return response.json() as Promise<FilterOptionsResponse>
    },
    enabled,
    staleTime: 60_000,
    refetchInterval: visibilityAwareInterval(300_000),
    refetchOnWindowFocus: false,
    retry: 2,
  })

  const options: FilterFieldOption[] = (data?.options ?? []).map((option) => ({
    label: option.value,
    value: option.value,
  }))

  return { options, isLoading: isPending, error: error ?? undefined }
}
