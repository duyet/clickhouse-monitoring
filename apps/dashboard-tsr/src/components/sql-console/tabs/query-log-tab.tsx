import { AlertCircle, Loader2 } from 'lucide-react'

import { useQueryLog } from '../hooks/use-query-log'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { formatBytes } from '@/lib/utils'

function fmtDuration(ms?: number): string {
  if (ms === undefined || !Number.isFinite(ms)) return '—'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

function fmtNum(n?: number): string {
  if (n === undefined || !Number.isFinite(n)) return '—'
  return n.toLocaleString()
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </div>
      <div className="mt-1 font-mono text-lg">{value}</div>
    </div>
  )
}

export function QueryLogTab({
  hostId,
  queryId,
  active,
}: {
  hostId: number
  queryId: string | null
  active: boolean
}) {
  const { data: row, error, isFetching } = useQueryLog(hostId, queryId, active)

  if (!queryId) {
    return (
      <div className="text-muted-foreground p-8 text-center text-sm">
        Run a query to inspect its system.query_log entry.
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Failed to load query log</AlertTitle>
        <AlertDescription className="mt-1 font-mono text-xs whitespace-pre-wrap">
          {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  if (!row) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 p-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Waiting for query_log to flush (query_id{' '}
        <code className="text-xs">{queryId.slice(0, 8)}…</code>)
      </div>
    )
  }

  const exception = typeof row.exception === 'string' ? row.exception : ''
  const tables = Array.isArray(row.tables) ? (row.tables as string[]) : []

  return (
    <div className="space-y-4">
      {isFetching && (
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Loader2 className="size-3 animate-spin" /> refreshing…
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat label="Duration" value={fmtDuration(row.query_duration_ms)} />
        <Stat label="Rows read" value={fmtNum(row.read_rows)} />
        <Stat label="Bytes read" value={formatBytes(Number(row.read_bytes))} />
        <Stat label="Result rows" value={fmtNum(row.result_rows)} />
        <Stat label="Memory" value={formatBytes(Number(row.memory_usage))} />
        <Stat label="Type" value={String(row.type ?? '—')} />
      </div>

      {tables.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-muted-foreground text-xs font-semibold uppercase">
            Tables
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tables.map((t) => (
              <Badge key={t} variant="secondary" className="font-mono text-xs">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {exception && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Exception (code {String(row.exception_code)})</AlertTitle>
          <AlertDescription className="mt-1 font-mono text-xs whitespace-pre-wrap">
            {exception}
          </AlertDescription>
        </Alert>
      )}

      <details className="rounded-md border">
        <summary className="text-muted-foreground cursor-pointer px-3 py-2 text-xs font-semibold uppercase">
          Raw query_log row
        </summary>
        <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
          {JSON.stringify(row, null, 2)}
        </pre>
      </details>
    </div>
  )
}
