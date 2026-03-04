'use client'

import {
  AlertCircle,
  Clock,
  Loader2,
  Play,
  RowsIcon,
  ShieldAlert,
} from 'lucide-react'
import useSWR from 'swr'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type {
  ApiError,
  ApiResponse,
  ApiResponseMetadata,
} from '@/lib/api/types'

import { useExplorerState } from '../hooks/use-explorer-state'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useHostId } from '@/lib/swr/use-host'
import { cn } from '@/lib/utils'

const MAX_CELL_LENGTH = 100

/**
 * Expandable cell component for long text content
 */
const ExpandableCell = memo(function ExpandableCell({
  value,
}: {
  value: unknown
}) {
  const [expanded, setExpanded] = useState(false)
  const stringValue = String(value ?? '')
  const isLong = stringValue.length > MAX_CELL_LENGTH

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggleExpand()
      }
    },
    [toggleExpand]
  )

  if (!isLong) {
    return <span className="block truncate">{stringValue}</span>
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={toggleExpand}
      onKeyDown={handleKeyDown}
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
})

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

const fetcher = async (
  url: string
): Promise<ApiResponse<Record<string, unknown>[]>> => {
  let res: Response

  // For long queries, switch to POST to avoid URL length limits
  if (url.length > MAX_GET_QUERY_LENGTH) {
    const parsed = new URL(url, window.location.origin)
    const sql = parsed.searchParams.get('sql') || ''
    const hostId = parsed.searchParams.get('hostId') || '0'
    const format = parsed.searchParams.get('format') || 'JSONEachRow'

    res = await fetch('/api/v1/explorer/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql,
        hostId: Number(hostId),
        format,
      }),
    })
  } else {
    res = await fetch(url)
  }

  const json = (await res.json()) as ApiResponse<Record<string, unknown>[]>

  if (!json.success && json.error) {
    throw new QueryTabError(json.error)
  }

  return json
}

type RowData = Record<string, unknown>
const columnHelper = createColumnHelper<RowData>()

/**
 * Validate that a query is SELECT-only on the client side
 */
function validateSelectOnly(sql: string): string | null {
  const trimmed = sql.trim()
  if (!trimmed) return 'SQL query cannot be empty'

  const upper = trimmed.toUpperCase()
  if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) {
    return 'Only SELECT queries are allowed'
  }

  const dangerous = /\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE)\b/i
  if (dangerous.test(trimmed)) {
    return 'Potentially dangerous SQL detected. Only SELECT queries are allowed.'
  }

  return null
}

export function QueryTab() {
  const hostId = useHostId()
  const {
    database,
    table: tableName,
    customQuery,
    setCustomQuery,
  } = useExplorerState()

  // Local editor state (not synced to URL until Run)
  const [editorValue, setEditorValue] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  // The query to execute (set on Run, drives the SWR key)
  const [executedQuery, setExecutedQuery] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initialized = useRef(false)

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

  // Build the SWR URL only when we have an executed query
  const swrKey = useMemo(() => {
    if (!executedQuery) return null
    const params = new URLSearchParams()
    params.set('hostId', String(hostId))
    params.set('sql', executedQuery)
    params.set('format', 'JSONEachRow')
    return `/api/v1/explorer/query?${params.toString()}`
  }, [executedQuery, hostId])

  const {
    data: response,
    error,
    isLoading,
    isValidating,
  } = useSWR<ApiResponse<RowData[]>>(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  const rows = response?.data || []
  const metadata = response?.metadata

  // Generate columns dynamically from data
  const columns = useMemo(() => {
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
  }, [rows])

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    defaultColumn: {
      size: 200,
      minSize: 80,
      maxSize: 500,
    },
  })

  const handleRun = useCallback(() => {
    const sql = editorValue.trim()
    const error = validateSelectOnly(sql)
    if (error) {
      setValidationError(error)
      return
    }
    setValidationError(null)
    setExecutedQuery(sql)
    setCustomQuery(sql)
  }, [editorValue, setCustomQuery])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleRun()
      }
    },
    [handleRun]
  )

  const handleEditorChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditorValue(e.target.value)
      if (validationError) {
        setValidationError(null)
      }
    },
    [validationError]
  )

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
        <Textarea
          ref={textareaRef}
          value={editorValue}
          onChange={handleEditorChange}
          onKeyDown={handleKeyDown}
          placeholder="SELECT * FROM system.tables LIMIT 100"
          className="min-h-[120px] font-mono text-sm"
          spellCheck={false}
        />
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
        <MetadataBar metadata={metadata} isValidating={isValidating} />
      )}

      {/* Results Table */}
      {rows.length > 0 && (
        <div
          className={cn(
            'overflow-x-auto rounded-md border transition-opacity',
            isValidating && 'opacity-60'
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
}: {
  metadata: ApiResponseMetadata
  isValidating: boolean
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
      {isValidating && (
        <Loader2 className="size-3 animate-spin text-muted-foreground" />
      )}
    </div>
  )
}
