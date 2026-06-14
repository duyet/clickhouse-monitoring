import { useQuery } from '@tanstack/react-query'

import type { ApiResponse } from '@/lib/api/types'

import { apiFetch } from '@/lib/swr/api-fetch'

/**
 * Run `EXPLAIN indexes = 1 <sql>` for the committed query and return the plan as
 * lines of text. `indexes = 1` surfaces used indexes, filtered parts/granules
 * and projections (MergeTree), which the Analysis tab parses. Lazy: only fetches
 * when `enabled` (i.e. the EXPLAIN/Analysis tab is open).
 */
export function useExplain(
  hostId: number,
  sql: string | null,
  enabled: boolean
) {
  const explainSql = sql
    ? `EXPLAIN indexes = 1 ${stripTrailingSemicolon(sql)}`
    : ''

  const query = useQuery<string[], Error>({
    queryKey: ['sql-console:explain', hostId, sql],
    enabled: enabled && Boolean(sql),
    staleTime: 5 * 60_000,
    gcTime: 5 * 60_000,
    retry: false,
    queryFn: async () => {
      const params = new URLSearchParams({
        hostId: String(hostId),
        sql: explainSql,
        format: 'JSONEachRow',
      })
      const res = await apiFetch(`/api/v1/explorer/query?${params.toString()}`)
      const json = (await res.json()) as ApiResponse<
        Array<{ explain?: string }>
      >
      if (!json.success || json.error) {
        throw new Error(json.error?.message ?? 'EXPLAIN failed')
      }
      return (json.data ?? []).map((r) => r.explain ?? '')
    },
  })

  return query
}

function stripTrailingSemicolon(sql: string): string {
  return sql.trim().replace(/;\s*$/, '')
}
