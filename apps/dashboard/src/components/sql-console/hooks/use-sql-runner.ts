import { useQuery, useQueryClient } from '@tanstack/react-query'

import type { ApiError, ApiResponse } from '@/lib/api/types'

import { useCallback, useRef, useState } from 'react'
import { apiFetch } from '@/lib/swr/api-fetch'

export type RowData = Record<string, unknown>

/** Error carrying the structured API error type (e.g. permission vs query). */
export class SqlRunError extends Error {
  type: string
  details?: Record<string, unknown>
  constructor(apiError: ApiError) {
    super(apiError.message)
    this.name = 'SqlRunError'
    this.type = apiError.type
    this.details = apiError.details as Record<string, unknown> | undefined
  }
}

export interface SqlRunResult {
  rows: RowData[]
  queryId: string
  durationMs: number
  rowCount: number
  host: string
}

async function runSql(
  hostId: number,
  sql: string,
  signal: AbortSignal
): Promise<SqlRunResult> {
  const res = await apiFetch('/api/v1/explorer/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, hostId, format: 'JSONEachRow' }),
    signal,
  })
  const json = (await res.json()) as ApiResponse<RowData[]>
  if (!json.success || json.error) {
    throw new SqlRunError(
      json.error ?? {
        type: 'query_error' as ApiError['type'],
        message: 'Query failed',
      }
    )
  }
  return {
    rows: json.data ?? [],
    queryId: json.metadata?.queryId ?? '',
    durationMs: json.metadata?.duration ?? 0,
    rowCount: json.metadata?.rows ?? json.data?.length ?? 0,
    host: json.metadata?.host ?? '',
  }
}

/**
 * Owns SQL execution state for the console.
 *
 * `editorValue` is the live, uncommitted text. `committedSql` is what was last
 * Run — it drives the Results query and the secondary tabs (EXPLAIN, Query Log,
 * Analysis). A monotonically increasing `runToken` lets "Run" re-execute the
 * same SQL (cache-busting) without changing the query key shape.
 */
export function useSqlRunner(hostId: number, initialSql = '') {
  const queryClient = useQueryClient()
  const [editorValue, setEditorValue] = useState(initialSql)
  const [committedSql, setCommittedSql] = useState<string | null>(null)
  const [runToken, setRunToken] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const queryKey = ['sql-console:run', hostId, committedSql, runToken] as const

  const query = useQuery<SqlRunResult, SqlRunError>({
    queryKey,
    enabled: Boolean(committedSql),
    gcTime: 5 * 60_000,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    queryFn: async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      return runSql(hostId, committedSql as string, ctrl.signal)
    },
  })

  const run = useCallback(
    (sqlArg?: string) => {
      const sql = (sqlArg ?? editorValue).trim()
      if (!sql) return
      if (sqlArg !== undefined) setEditorValue(sqlArg)
      // Same SQL → bump token to force a re-run; new SQL → update committedSql.
      if (sql === committedSql) {
        setRunToken((t) => t + 1)
      } else {
        setCommittedSql(sql)
      }
    },
    [editorValue, committedSql]
  )

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    queryClient.cancelQueries({ queryKey })
  }, [queryClient, queryKey])

  return {
    editorValue,
    setEditorValue,
    committedSql,
    run,
    cancel,
    result: query.data ?? null,
    error: query.error ?? null,
    isRunning: query.isFetching,
    hasRun: Boolean(committedSql),
  }
}
