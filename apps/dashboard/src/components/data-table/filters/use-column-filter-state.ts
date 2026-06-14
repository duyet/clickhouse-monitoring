import type { FilterDraft } from '@/components/filters/filter-editor'
import type {
  ActiveFilter,
  FilterField,
  FilterSchema,
} from '@/lib/filters/types'

import {
  parseFiltersFromParams,
  serializeFilter,
} from '@/lib/filters/url-state'
import { usePathname, useRouter, useSearchParams } from '@/lib/next-compat'

/**
 * Reads/writes a single field's active filter via URL params. The filter bar
 * and per-column header popovers both consume this — keeping URL params the
 * single source of truth so SWR re-fetches automatically.
 */
export function useColumnFilterState(schema: FilterSchema | undefined) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const getActiveFilter = (field: FilterField): ActiveFilter | null => {
    if (!schema) return null
    const active = parseFiltersFromParams(schema, searchParams)
    return active.find((f) => f.key === field.key) ?? null
  }

  const setFilter = (key: string, draft: FilterDraft) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, serializeFilter({ key, ...draft }))
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const clearFilter = (key: string) => {
    const field = schema?.fields.find((f) => f.key === key)
    const params = new URLSearchParams(searchParams.toString())
    if (field?.defaultValue) params.set(key, '')
    else params.delete(key)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return { getActiveFilter, setFilter, clearFilter }
}
