import { useQuery } from '@tanstack/react-query'

import type { ApiResponse } from '@/lib/api/types'

import { apiFetch } from '@/lib/swr/api-fetch'

export type QueryLogRow = Record<string, unknown> & {
  query_id?: string
  query_duration_ms?: number
  read_rows?: number
  read_bytes?: number
  result_rows?: number
  memory_usage?: number
  exception?: string
  ProfileEvents?: Record<string, number>
  tables?: string[]
  databases?: string[]
}

/**
 * Fetch the system.query_log row for a finished query by query_id.
 *
 * query_log is flushed asynchronously (~7.5s default), so the row often isn't
 * available immediately. We poll with a bounded `refetchInterval` until the row
 * appears, then stop. A `null` row (200, found:false) means "not flushed yet".
 */
export function useQueryLog(
  hostId: number,
  queryId: string | null,
  enabled: boolean
) {
  return useQuery<QueryLogRow | null, Error>({
    queryKey: ['sql-console:query-log', hostId, queryId],
    enabled: enabled && Boolean(queryId),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
    // Poll until the async-flushed row shows up, then stop.
    refetchInterval: (q) => (q.state.data ? false : 3000),
    queryFn: async () => {
      const params = new URLSearchParams({
        hostId: String(hostId),
        queryId: queryId as string,
      })
      const res = await apiFetch(
        `/api/v1/explorer/query-log?${params.toString()}`
      )
      const json = (await res.json()) as ApiResponse<QueryLogRow | null>
      if (!json.success) {
        throw new Error(json.error?.message ?? 'Failed to load query log')
      }
      return json.data ?? null
    },
  })
}
