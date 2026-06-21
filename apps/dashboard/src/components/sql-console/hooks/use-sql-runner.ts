import { useQuery, useQueryClient } from '@tanstack/react-query'

import type { ApiError, ApiResponse } from '@/lib/api/types'

import { splitSqlStatements } from '@chm/sql-builder'
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

/** Outcome of a single statement within a (possibly multi-statement) run. */
export interface StatementOutcome {
  /** The individual statement that was executed. */
  sql: string
  result: SqlRunResult | null
  error: SqlRunError | null
}

/** Upper bound on statements per run, so a giant script can't hammer the server. */
const MAX_STATEMENTS = 20

async function runSql(
  hostId: number,
  sql: string,
  signal: AbortSignal,
  database?: string
): Promise<SqlRunResult> {
  const res = await apiFetch('/api/v1/explorer/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sql,
      hostId,
      format: 'JSONEachRow',
      ...(database ? { database } : {}),
    }),
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
 * Run. On run, the committed text is split into individual statements (a
 * trailing `;` is stripped, and `;`-separated statements each run) and executed
 * sequentially — each statement's result/error is captured independently so one
 * failure doesn't blank the others. The secondary tabs (EXPLAIN, Query Log,
 * Analysis) follow the currently-selected statement via `activeStatement`.
 *
 * A monotonically increasing `runToken` lets "Run" re-execute the same SQL
 * (cache-busting) without changing the query key shape. `database`, when set,
 * is the default database for unqualified table names and participates in the
 * key so switching it re-runs against the new context.
 */
export function useSqlRunner(
  hostId: number,
  initialSql = '',
  database?: string
) {
  const queryClient = useQueryClient()
  const [editorValue, setEditorValue] = useState(initialSql)
  const [committedSql, setCommittedSql] = useState<string | null>(null)
  const [runToken, setRunToken] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const queryKey = [
    'sql-console:run',
    hostId,
    committedSql,
    runToken,
    database ?? '',
  ] as const

  const query = useQuery<StatementOutcome[], SqlRunError>({
    queryKey,
    enabled: Boolean(committedSql),
    gcTime: 5 * 60_000,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    queryFn: async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl

      const all = splitSqlStatements(committedSql as string)
      const statements = all.slice(0, MAX_STATEMENTS)
      const outcomes: StatementOutcome[] = []

      for (const stmt of statements) {
        if (ctrl.signal.aborted) break
        try {
          const result = await runSql(hostId, stmt, ctrl.signal, database)
          outcomes.push({ sql: stmt, result, error: null })
        } catch (err) {
          // An abort isn't a per-statement failure — let React Query mark the
          // whole run as cancelled.
          if (ctrl.signal.aborted) throw err
          if (err instanceof SqlRunError) {
            outcomes.push({ sql: stmt, result: null, error: err })
          } else {
            throw err
          }
        }
      }

      // Never silently drop statements past the cap — surface it as a result.
      if (all.length > MAX_STATEMENTS) {
        outcomes.push({
          sql: `/* ${all.length - MAX_STATEMENTS} more statement(s) not run */`,
          result: null,
          error: new SqlRunError({
            type: 'validation_error' as ApiError['type'],
            message: `Only the first ${MAX_STATEMENTS} statements were executed (${all.length} submitted). Run the rest separately.`,
          }),
        })
      }

      return outcomes
    },
  })

  const run = useCallback(
    (sqlArg?: string) => {
      const sql = (sqlArg ?? editorValue).trim()
      if (!sql) return
      if (sqlArg !== undefined) setEditorValue(sqlArg)
      setActiveIndex(0)
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

  const statements = query.data ?? []
  // Keep the selected tab in range if the result set shrinks between runs.
  const safeActiveIndex = activeIndex < statements.length ? activeIndex : 0
  const activeStatement = statements[safeActiveIndex] ?? null

  return {
    editorValue,
    setEditorValue,
    /** Full committed text (drives history + URL sync). */
    committedSql,
    /** Per-statement outcomes for the last run. */
    statements,
    activeIndex: safeActiveIndex,
    setActiveIndex,
    /** The statement whose result/EXPLAIN/log/analysis is currently shown. */
    activeStatement,
    run,
    cancel,
    isRunning: query.isFetching,
    hasRun: Boolean(committedSql),
    /** Convenience accessors for the active statement. */
    result: activeStatement?.result ?? null,
    error: activeStatement?.error ?? query.error ?? null,
  }
}
