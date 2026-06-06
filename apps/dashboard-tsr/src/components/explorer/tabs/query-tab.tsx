import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Play,
  RowsIcon,
  ShieldAlert,
  X,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type {
  ApiError,
  ApiResponse,
  ApiResponseMetadata,
} from '@/lib/api/types'

import { useExplorerState } from '../hooks/use-explorer-state'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'sql-formatter'
import { ClientOnly } from '@/components/client-only'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { activateOnEnterOrSpace } from '@/lib/a11y'
import { apiFetch } from '@/lib/swr/api-fetch'
import { useHostId } from '@/lib/swr/use-host'
import { cn } from '@/lib/utils'

const SqlEditor = lazy(() =>
  import('../sql-editor').then((mod) => ({ default: mod.SqlEditor }))
)

const MAX_CELL_LENGTH = 100
const DEFAULT_LIMIT = 100
const PAGE_SIZE = 50

/**
 * Check if a SQL query already contains a LIMIT clause.
 * Handles LIMIT inside subqueries by only checking the outermost level.
 */
function hasLimitClause(sql: string): boolean {
  // Simple heuristic: check if LIMIT appears after the last closing paren
  // or if there are no parens, just check the whole string
  const upper = sql.toUpperCase()
  const lastParen = sql.lastIndexOf(')')
  const searchPortion = lastParen >= 0 ? upper.slice(lastParen) : upper
  return /\bLIMIT\b/i.test(searchPortion)
}

/**
 * Append a default LIMIT clause to a query if it doesn't have one.
 */
function ensureLimit(sql: string, limit: number = DEFAULT_LIMIT): string {
  if (hasLimitClause(sql)) return sql
  return `${sql.trimEnd()}\nLIMIT ${limit}`
}

/**
 * Expandable cell component for long text content
 */
const ExpandableCell = function ExpandableCell({ value }: { value: unknown }) {
  const [expanded, setExpanded] = useState(false)
  const stringValue = String(value ?? '')
  const isLong = stringValue.length > MAX_CELL_LENGTH

  const toggleExpand = () => {
    setExpanded((prev) => !prev)
  }

  if (!isLong) {
    return <span className="block truncate">{stringValue}</span>
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={toggleExpand}
      onKeyDown={activateOnEnterOrSpace(toggleExpand)}
      className={cn(
        'block cursor-pointer transition-colors',
        expanded ? 'whitespace-pre-wrap break-words' : 'truncate',
        !expanded && 'hover:text-primary'
      )}
      title={expanded ? 'Click to collapse' : 'Click to expand'}
      aria-expanded={expanded}
    >
      {expanded ? stringValue : `${stringValue.slice(0, MAX_CELL_LENGTH)}…`}
    </span>
  )
}

/** Custom error class to carry API error details */
class QueryTabError extends Error {
  type: string
  details?: Record<string, unknown>

  constructor(apiError: ApiError) {
    super(apiError.message)
    this.name = 'QueryTabError'
    this.type = apiError.type
    this.details = apiError.details as Record<string, unknown> | undefined
  }
}

/** Max query length for GET requests — longer queries use POST */
const MAX_GET_QUERY_LENGTH = 8_000

/** Request timeout in milliseconds */
const QUERY_TIMEOUT = 120_000 // 2 minutes

const fetcher = async (
  url: string,
  signal?: AbortSignal
): Promise<ApiResponse<Record<string, unknown>[]>> => {
  // Create timeout abort controller
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), QUERY_TIMEOUT)

  // Chain abort signals - abort if either timeout or external abort
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal

  try {
    let res: Response

    // For long queries, switch to POST to avoid URL length limits
    if (url.length > MAX_GET_QUERY_LENGTH) {
      const parsed = new URL(url, window.location.origin)
      const sql = parsed.searchParams.get('sql') || ''
      const hostId = parsed.searchParams.get('hostId') || '0'
      const format = parsed.searchParams.get('format') || 'JSONEachRow'

      res = await apiFetch('/api/v1/explorer/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql,
          hostId: Number(hostId),
          format,
        }),
        signal: combinedSignal,
      })
    } else {
      res = await apiFetch(url, { signal: combinedSignal })
    }

    const json = (await res.json()) as ApiResponse<Record<string, unknown>[]>

    if (!json.success && json.error) {
      throw new QueryTabError(json.error)
    }

    return json
  } finally {
    clearTimeout(timeoutId)
  }
}

type RowData = Record<string, unknown>
const columnHelper = createColumnHelper<RowData>()

/**
 * Validate that a query is SELECT-only on the client side
 */
function validateSelectOnly(sql: string): string | null {
  const trimmed = sql.trim()
  if (!trimmed) return 'SQL query cannot be empty'

  const stripped = trimmed
    .replace(/^(\/\*[\s\S]*?\*\/\s*|--[^\n]*\n\s*)*/g, '')
    .trimStart()
  const upper = stripped.toUpperCase()
  if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) {
    return 'Only SELECT queries are allowed'
  }

  const dangerous = /\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE)\b/i
  if (dangerous.test(trimmed)) {
    return 'Potentially dangerous SQL detected. Only SELECT queries are allowed.'
  }

  return null
}

/**
 * Fetch database.table list for SQL autocomplete schema.
 * Returns a map like { "db.table": [] } for CodeMirror's sql() extension.
 */
function useAutoCompleteSchema(hostId: number) {
  // Fetch all databases
  const { data: dbResponse } = useQuery<ApiResponse<{ name: string }[]>>({
    queryKey: [`/api/v1/explorer/databases?hostId=${hostId}`],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/explorer/databases?hostId=${hostId}`)
      return res.json() as Promise<ApiResponse<{ name: string }[]>>
    },
    refetchOnWindowFocus: false,
  })

  // Memoize to avoid returning a new object reference every render, which
  // would trigger the SqlEditor's schema useEffect on every render and
  // potentially cause expensive CodeMirror reconfigurations.
  return useMemo(() => {
    const schema: Record<string, string[]> = {}
    const databases = dbResponse?.data || []

    for (const db of databases) {
      // Add database names as completions
      schema[db.name] = []
    }

    return schema
  }, [dbResponse?.data])
}

export function QueryTab() {
  const hostId = useHostId()
  const queryClient = useQueryClient()
  const {
    database,
    table: tableName,
    customQuery,
    setCustomQuery,
  } = useExplorerState()

  // Local editor state (not synced to URL until Run)
  const [editorValue, setEditorValue] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  // Track if LIMIT was auto-added so we can show an indicator
  const [limitAdded, setLimitAdded] = useState(false)
  // The query to execute (set on Run, drives the query key)
  const [executedQuery, setExecutedQuery] = useState<string | null>(null)
  const initialized = useRef(false)
  // AbortController for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null)

  // Autocomplete schema from database metadata
  const schema = useAutoCompleteSchema(hostId)

  // Initialize editor from URL state or auto-populate from selected table
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (customQuery) {
      setEditorValue(customQuery)
      setExecutedQuery(customQuery)
    } else if (database && tableName) {
      setEditorValue(
        `SELECT *\nFROM \`${database}\`.\`${tableName}\`\nLIMIT 100`
      )
    }
  }, [customQuery, database, tableName])

  // Re-seed the editor when the selected table changes.
  // setDatabaseAndTable clears customQuery (sets q=null in URL), so when
  // customQuery is null and database+table change, the user picked a new table.
  const prevTableKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!initialized.current) return
    const tableKey = database && tableName ? `${database}.${tableName}` : null
    if (tableKey === prevTableKeyRef.current) return
    prevTableKeyRef.current = tableKey

    if (!customQuery && database && tableName) {
      const defaultQuery = `SELECT *\nFROM \`${database}\`.\`${tableName}\`\nLIMIT 100`
      setEditorValue(defaultQuery)
      setExecutedQuery(null)
      setLimitAdded(false)
    }
  }, [database, tableName, customQuery])

  // Build the query URL only when we have an executed query
  const swrKey = (() => {
    if (!executedQuery) return null
    const params = new URLSearchParams()
    params.set('hostId', String(hostId))
    params.set('sql', executedQuery)
    params.set('format', 'JSONEachRow')
    return `/api/v1/explorer/query?${params.toString()}`
  })()

  // Fetcher with AbortController support
  const swrFetcher = async (url: string) => {
    // Cancel previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()
    return fetcher(url, abortControllerRef.current.signal)
  }

  const {
    data: response,
    error,
    isLoading,
    isFetching,
  } = useQuery<ApiResponse<RowData[]>>({
    queryKey: [swrKey],
    queryFn: () => swrFetcher(swrKey as string),
    enabled: Boolean(swrKey),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const mutate = (_data?: unknown, _revalidate?: boolean) => {
    queryClient.removeQueries({ queryKey: [swrKey] })
  }

  const rows = response?.data || []
  const metadata = response?.metadata

  // Generate columns dynamically from data
  const columns = (() => {
    if (rows.length === 0) return []
    return Object.keys(rows[0]).map((key) =>
      columnHelper.accessor(key, {
        header: key,
        cell: (info) => <ExpandableCell value={info.getValue()} />,
        size: 200,
        minSize: 80,
        maxSize: 500,
      })
    )
  })()

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: 'onChange',
    initialState: {
      pagination: {
        pageSize: PAGE_SIZE,
      },
    },
    defaultColumn: {
      size: 200,
      minSize: 80,
      maxSize: 500,
    },
  })

  const handleRun = () => {
    const sql = editorValue.trim()
    const error = validateSelectOnly(sql)
    if (error) {
      setValidationError(error)
      return
    }
    setValidationError(null)

    // Auto-add LIMIT if missing to prevent oversized results
    const finalSql = ensureLimit(sql)
    const wasLimitAdded = finalSql !== sql
    setLimitAdded(wasLimitAdded)

    setExecutedQuery(finalSql)
    // Defer URL update to next frame so setExecutedQuery commits first,
    // preventing router.push re-render from racing with the query key
    requestAnimationFrame(() => setCustomQuery(finalSql))
  }

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    // Clear the query cache to stop loading state
    mutate(undefined, false)
  }

  const handleEditorChange = (newValue: string) => {
    setEditorValue(newValue)
    if (validationError) {
      setValidationError(null)
    }
  }

  const handleFormat = () => {
    try {
      setEditorValue(
        format(editorValue, { language: 'sql', keywordCase: 'upper' })
      )
    } catch {
      // If formatting fails (e.g., invalid SQL), keep the current value
    }
  }

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex

  return (
    <div className="flex flex-col gap-4">
      {/* Query Editor */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">SQL Query</span>
          <span className="text-xs text-muted-foreground">
            Ctrl+Enter to run
          </span>
        </div>
        <ClientOnly
          fallback={<Skeleton className="min-h-[120px] rounded-md" />}
        >
          <Suspense
            fallback={<Skeleton className="min-h-[120px] rounded-md" />}
          >
            <SqlEditor
              value={editorValue}
              onChange={handleEditorChange}
              onRun={handleRun}
              placeholder={
                database && tableName
                  ? `SELECT * FROM \`${database}\`.\`${tableName}\` LIMIT 100`
                  : 'SELECT * FROM system.tables LIMIT 100'
              }
              schema={schema}
            />
          </Suspense>
        </ClientOnly>
        {validationError && (
          <p className="text-sm text-destructive">{validationError}</p>
        )}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRun}
            disabled={isLoading || !editorValue.trim()}
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Play className="mr-1.5 size-3.5" />
            )}
            Run Query
          </Button>
          {isLoading && (
            <Button onClick={handleCancel} size="sm" variant="destructive">
              <X className="mr-1.5 size-3.5" />
              Cancel
            </Button>
          )}
          <Button
            onClick={handleFormat}
            disabled={!editorValue.trim()}
            size="sm"
            variant="outline"
          >
            Format
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert
          variant="destructive"
          className={cn(
            error instanceof QueryTabError &&
              error.type === 'permission_error' &&
              'border-amber-500/50 bg-amber-500/10'
          )}
        >
          {error instanceof QueryTabError &&
          error.type === 'permission_error' ? (
            <ShieldAlert className="size-4" />
          ) : (
            <AlertCircle className="size-4" />
          )}
          <AlertTitle>
            {error instanceof QueryTabError && error.type === 'permission_error'
              ? 'Permission Denied'
              : 'Query Error'}
          </AlertTitle>
          <AlertDescription>
            <p className="text-sm">{error.message}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Metadata Bar */}
      {metadata && !error && (
        <MetadataBar
          metadata={metadata}
          isValidating={isFetching}
          limitAdded={limitAdded}
        />
      )}

      {/* Results Table */}
      {rows.length > 0 && (
        <div
          className={cn(
            'overflow-x-auto rounded-md border transition-opacity',
            isFetching && 'opacity-60'
          )}
        >
          <Table
            style={{
              minWidth: table.getCenterTotalSize(),
              width: '100%',
            }}
          >
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="relative select-none"
                      style={{
                        minWidth: header.getSize(),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {/* Column resize handle */}
                      <div
                        role="presentation"
                        onDoubleClick={() => header.column.resetSize()}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
                          'bg-transparent hover:bg-primary/50',
                          header.column.getIsResizing() && 'bg-primary'
                        )}
                      />
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        minWidth: cell.column.getSize(),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {rows.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {currentPage + 1} of {pageCount}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty result */}
      {executedQuery && !isLoading && !error && rows.length === 0 && (
        <div className="p-4 text-sm text-muted-foreground">
          Query returned no results.
        </div>
      )}
    </div>
  )
}

function MetadataBar({
  metadata,
  isValidating,
  limitAdded,
}: {
  metadata: ApiResponseMetadata
  isValidating: boolean
  limitAdded: boolean
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="secondary" className="gap-1 font-mono text-xs">
        <RowsIcon className="size-3" />
        {metadata.rows} row{metadata.rows !== 1 ? 's' : ''}
      </Badge>
      <Badge variant="secondary" className="gap-1 font-mono text-xs">
        <Clock className="size-3" />
        {Math.round(metadata.duration * 1000)}ms
      </Badge>
      {limitAdded && (
        <Badge
          variant="outline"
          className="gap-1 text-xs text-amber-600 dark:text-amber-400"
        >
          LIMIT {DEFAULT_LIMIT} auto-added
        </Badge>
      )}
      {isValidating && (
        <Loader2 className="size-3 animate-spin text-muted-foreground" />
      )}
    </div>
  )
}
