'use client'

import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleX,
  Clock,
  Cpu,
  Database,
  ExternalLink,
  Globe,
  HardDrive,
  Loader2,
  MemoryStick,
  ScanSearch,
  Search,
  User as UserIcon,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { memo, useCallback, useMemo, useState } from 'react'
import { CodeDialogFormat } from '@/components/data-table/cells/code-dialog-format'
import { AppLink as Link } from '@/components/ui/app-link'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { buildExplorerQueryUrl } from '@/lib/explorer-url'
import { formatReadableSize } from '@/lib/format-readable'
import { useActions } from '@/lib/swr'
import { useHostId } from '@/lib/swr/use-host'
import { cn } from '@/lib/utils'

/**
 * Shape of a single `system.processes` row as returned by the
 * `running-queries` table API. Only the fields the table reads are typed;
 * the index signature keeps it tolerant of extra columns.
 */
export interface RunningQueryRow {
  query_id: string
  query: string
  query_kind?: string
  user?: string
  current_database?: string
  interface?: string
  address?: string
  port?: number
  initial_address?: string
  client_name?: string
  client_hostname?: string
  os_user?: string
  initial_query_id?: string
  is_initial_query?: number | boolean
  distributed_depth?: number
  elapsed?: number
  readable_elapsed?: string
  read_rows?: number
  read_bytes?: number
  readable_read_rows?: string
  written_rows?: number
  written_bytes?: number
  readable_written_rows?: string
  total_rows_approx?: number
  readable_total_rows_approx?: string
  memory_usage?: number
  peak_memory_usage?: number
  readable_memory_usage?: string
  readable_peak_memory_usage?: string
  peak_threads_usage?: number
  thread_count?: number
  thread_ids?: unknown[]
  pct_progress?: number
  ProfileEvents?: Record<string, number>
  [key: string]: unknown
}

// ───────────────────────── helpers ─────────────────────────

type Severity = 'critical' | 'warning' | 'normal'

/** Classify a query by how long it has been running (seconds). */
function getSeverity(elapsed: number): Severity {
  if (elapsed > 30) return 'critical'
  if (elapsed > 5) return 'warning'
  return 'normal'
}

/** Toned chip class per query kind, so SELECT/INSERT/DDL scan at a glance. */
const KIND_BADGE: Record<string, string> = {
  Select: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Insert:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Create:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Optimize:
    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  Alter:
    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  Drop: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  Delete: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
}

function kindBadgeClass(kind: string): string {
  return KIND_BADGE[kind] ?? 'bg-muted text-muted-foreground'
}

/**
 * `system.processes.interface` is a UInt8 enum (ClientInfo::Interface).
 * Map it back to a readable protocol name; fall back to the raw value.
 */
const INTERFACE_NAMES: Record<string, string> = {
  '1': 'TCP',
  '2': 'HTTP',
  '3': 'gRPC',
  '4': 'MySQL',
  '5': 'PostgreSQL',
  '6': 'Local',
  '7': 'TCP Interserver',
  '8': 'Prometheus',
}

function interfaceName(value: unknown): string | null {
  if (value == null || value === '' || value === 0) return null
  return INTERFACE_NAMES[String(value)] ?? String(value)
}

/** Safely read a numeric counter out of the ProfileEvents map. */
function profileEvent(events: unknown, key: string): number {
  if (events && typeof events === 'object' && !Array.isArray(events)) {
    const value = (events as Record<string, unknown>)[key]
    const n = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

/** Compact integer formatter for the rows-read denominator. */
function fmtCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return String(Math.round(n))
}

// ───────────────────────── derived row ─────────────────────────

/**
 * A `RunningQueryRow` with every metric the table sorts, filters, or renders
 * pre-computed once. `pct` is the *effective* progress: the server-reported
 * percentage when known, a rows-read ratio as a fallback, or `null` when the
 * query gives no signal (rendered as an indeterminate bar).
 */
interface DerivedQuery {
  row: RunningQueryRow
  id: string
  kind: string
  query: string
  user: string
  db: string
  iface: string | null
  elapsed: number
  readableElapsed: string
  pct: number | null
  readRows: number
  readableReadRows: string
  totalRows: number
  readableTotalRows: string
  memory: number
  readableMemory: string
  peakMemory: number
  readBytes: number
  writtenRows: number
  writtenBytes: number
  cores: number
  cpuPct: number
  threads: number
  severity: Severity
}

function derive(row: RunningQueryRow): DerivedQuery {
  const elapsed = Number(row.elapsed ?? 0)
  const readRows = Number(row.read_rows ?? 0)
  const totalRows = Number(row.total_rows_approx ?? 0)

  // Effective progress — prefer the server %, fall back to a rows ratio.
  const reportedPct = Number(row.pct_progress ?? 0)
  let pct: number | null = null
  if (reportedPct > 0) {
    pct = Math.min(100, reportedPct)
  } else if (totalRows > 0 && readRows > 0) {
    pct = Math.min(100, Math.round((readRows / totalRows) * 100))
  }

  const threads =
    Number(row.peak_threads_usage ?? 0) ||
    Number(row.thread_count ?? 0) ||
    (Array.isArray(row.thread_ids) ? row.thread_ids.length : 0)

  // CPU is only exposed through ProfileEvents. `cores` is the average number
  // of cores burned; `cpuPct` is how saturated the query's own threads are.
  const events = row.ProfileEvents
  const cpuMicros =
    profileEvent(events, 'OSCPUVirtualTimeMicroseconds') ||
    profileEvent(events, 'UserTimeMicroseconds') +
      profileEvent(events, 'SystemTimeMicroseconds')
  const cores = elapsed > 0 ? cpuMicros / 1e6 / elapsed : 0
  const cpuPct = threads > 0 ? Math.min(100, (cores / threads) * 100) : 0

  const memory = Number(row.memory_usage ?? 0)

  return {
    row,
    id: String(row.query_id ?? ''),
    kind: row.query_kind || 'Query',
    query: String(row.query ?? ''),
    user: String(row.user ?? ''),
    db: String(row.current_database ?? ''),
    iface: interfaceName(row.interface),
    elapsed,
    readableElapsed: row.readable_elapsed || `${elapsed.toFixed(1)}s`,
    pct,
    readRows,
    readableReadRows: row.readable_read_rows || fmtCount(readRows),
    totalRows,
    readableTotalRows: row.readable_total_rows_approx || fmtCount(totalRows),
    memory,
    readableMemory: row.readable_memory_usage || formatReadableSize(memory),
    peakMemory: Number(row.peak_memory_usage ?? 0),
    readBytes: Number(row.read_bytes ?? 0),
    writtenRows: Number(row.written_rows ?? 0),
    writtenBytes: Number(row.written_bytes ?? 0),
    cores,
    cpuPct,
    threads,
    severity: getSeverity(elapsed),
  }
}

// ───────────────────────── sorting ─────────────────────────

type SortKey =
  | 'progress'
  | 'memory'
  | 'dataRead'
  | 'cpu'
  | 'threads'
  | 'duration'
type SortDir = 'asc' | 'desc'

const SORT_ACCESSOR: Record<SortKey, (d: DerivedQuery) => number> = {
  progress: (d) => d.pct ?? -1,
  memory: (d) => d.memory,
  dataRead: (d) => d.readBytes,
  cpu: (d) => d.cores,
  threads: (d) => d.threads,
  duration: (d) => d.elapsed,
}

// ───────────────────────── cells ─────────────────────────

/** A toned, monospace query-kind chip. */
function KindBadge({ kind }: { kind: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-wide',
        kindBadgeClass(kind)
      )}
    >
      {kind}
    </span>
  )
}

/**
 * Progress cell — a determinate bar with `read / total` rows when the query
 * reports progress, or an indeterminate shimmer when only the row count is
 * known. Bar color shifts blue → green as the scan completes.
 */
function ProgressCell({ d }: { d: DerivedQuery }) {
  const { pct } = d
  const indeterminate = pct == null && d.readRows > 0
  const label = pct != null ? `${pct}%` : indeterminate ? 'Reading…' : '—'
  const denom =
    d.totalRows > 0 ? d.readableTotalRows : indeterminate ? '?' : '—'
  const color =
    pct == null
      ? 'hsl(38 92% 55%)'
      : pct >= 80
        ? 'hsl(158 64% 42%)'
        : 'hsl(217 91% 60%)'

  return (
    <div className="flex min-w-[88px] flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-medium tabular-nums">{label}</span>
        <span className="truncate text-right tabular-nums text-muted-foreground">
          {d.readableReadRows} / {denom}
        </span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        {pct != null ? (
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{ width: `${Math.max(pct, 2)}%`, background: color }}
          />
        ) : indeterminate ? (
          <div
            className="absolute inset-0 animate-pulse rounded-full"
            style={{ background: color, opacity: 0.5 }}
          />
        ) : null}
      </div>
    </div>
  )
}

interface SortableHeaderProps {
  children: React.ReactNode
  align?: 'left' | 'right'
  width?: string
  className?: string
  sortKey?: SortKey
  activeKey?: SortKey
  dir?: SortDir
  onSort?: (key: SortKey) => void
}

/** Table header cell with an optional click-to-sort affordance. */
function SortableHeader({
  children,
  align = 'left',
  width,
  className,
  sortKey,
  activeKey,
  dir,
  onSort,
}: SortableHeaderProps) {
  const active = sortKey != null && sortKey === activeKey
  return (
    <th
      className={cn(
        'select-none whitespace-nowrap px-2 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground sm:px-3',
        align === 'right' ? 'text-right' : 'text-left',
        className
      )}
      style={width ? { width } : undefined}
    >
      {sortKey && onSort ? (
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          className={cn(
            'inline-flex items-center gap-1 transition-colors hover:text-foreground',
            align === 'right' && 'flex-row-reverse'
          )}
        >
          {children}
          {active ? (
            dir === 'desc' ? (
              <ChevronDown className="size-3 text-foreground" />
            ) : (
              <ChevronUp className="size-3 text-foreground" />
            )
          ) : (
            <ChevronDown className="size-3 opacity-30" />
          )}
        </button>
      ) : (
        children
      )}
    </th>
  )
}

// ───────────────────────── expanded row ─────────────────────────

/** A labelled value in the expandable execution-details grid. */
function DetailField({
  label,
  value,
  mono = true,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="min-w-0 border-l border-t border-border px-3 py-1.5">
      <dt className="text-[10px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          'truncate text-[12px] font-medium tabular-nums',
          mono && 'font-mono'
        )}
        title={typeof value === 'string' ? value : undefined}
      >
        {value || '—'}
      </dd>
    </div>
  )
}

interface ExpandedRowProps {
  d: DerivedQuery
  onKill: () => void
  isKilling: boolean
}

/**
 * Expanded row — execution details grid, the full query (via the shared
 * CodeDialogFormat with an Expand/Format dialog + query plan), then actions.
 */
function ExpandedRow({ d, onKill, isKilling }: ExpandedRowProps) {
  const hostId = useHostId()
  const explorerUrl = buildExplorerQueryUrl(d.query, hostId)
  const detailUrl = `/query?query_id=${encodeURIComponent(d.id)}&host=${hostId}`

  const fields: { label: string; value: React.ReactNode; mono?: boolean }[] = [
    { label: 'Query ID', value: d.id },
    { label: 'User', value: d.user, mono: false },
    { label: 'Database', value: d.db },
    { label: 'Interface', value: d.iface ?? '—', mono: false },
    {
      label: 'Address',
      value: d.row.address
        ? `${d.row.address}${d.row.port ? `:${d.row.port}` : ''}`
        : '—',
    },
    {
      label: 'Distributed depth',
      value:
        d.row.distributed_depth != null ? String(d.row.distributed_depth) : '0',
    },
    { label: 'Duration', value: d.readableElapsed },
    { label: 'Memory', value: d.readableMemory },
    {
      label: 'Peak memory',
      value:
        d.row.readable_peak_memory_usage || formatReadableSize(d.peakMemory),
    },
    { label: 'Rows read', value: d.readableReadRows },
    { label: 'Data read', value: formatReadableSize(d.readBytes) },
    {
      label: 'Written',
      value:
        d.writtenRows > 0
          ? d.row.readable_written_rows || fmtCount(d.writtenRows)
          : '—',
    },
  ]

  return (
    <div className="space-y-3 border-t border-border bg-muted/40 px-3 py-3.5 sm:px-5">
      {/* Execution details — a compact key/value grid */}
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Execution details
        </div>
        <dl className="-ml-px -mt-px grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {fields.map((f) => (
            <DetailField
              key={f.label}
              label={f.label}
              value={f.value}
              mono={f.mono}
            />
          ))}
        </dl>
      </div>

      {/* Full query — shared formatter with Expand/Format dialog + query plan */}
      <div>
        <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          Full query
        </div>
        <CodeDialogFormat
          value={d.query}
          options={{
            dialog_title: 'Running Query',
            hide_query_comment: true,
            max_truncate: 220,
            force_dialog: true,
            show_query_plan: true,
            trigger_classname: 'w-full min-w-0',
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="h-7 gap-1.5" asChild>
          <Link href={explorerUrl}>
            <ExternalLink className="size-3.5" />
            Open in Explorer
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="h-7 gap-1.5" asChild>
          <Link href={detailUrl}>
            <ScanSearch className="size-3.5" />
            Query detail
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 gap-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
          onClick={onKill}
          disabled={isKilling || !d.id}
        >
          {isKilling ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CircleX className="size-3.5" />
          )}
          Kill query
        </Button>
      </div>
    </div>
  )
}

// ───────────────────────── query row ─────────────────────────

const SEVERITY_DURATION: Record<Severity, string> = {
  critical: 'text-rose-600 dark:text-rose-400 font-semibold',
  warning: 'text-amber-600 dark:text-amber-400 font-medium',
  normal: '',
}

interface QueryRowProps {
  d: DerivedQuery
  expanded: boolean
  onToggle: () => void
}

/** One running query rendered as a table row (collapsed) + detail row. */
const QueryRow = memo(function QueryRow({
  d,
  expanded,
  onToggle,
}: QueryRowProps) {
  const hostId = useHostId()
  const { killQuery } = useActions()
  const [isKilling, setIsKilling] = useState(false)

  const handleKill = useCallback(async () => {
    if (!d.id) return
    setIsKilling(true)
    try {
      const result = await killQuery(d.id)
      if (result.success) toast.success(result.message)
      else toast.error(result.message)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to kill query')
    } finally {
      setIsKilling(false)
    }
  }, [killQuery, d.id])

  return (
    <>
      <tr
        className="group cursor-pointer border-b border-border align-middle hover:bg-muted/60"
        onClick={onToggle}
      >
        {/* Type + expand chevron */}
        <td className="px-2 py-2.5 sm:px-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ChevronRight
              className={cn(
                'size-3 shrink-0 text-muted-foreground transition-transform',
                expanded && 'rotate-90'
              )}
            />
            <KindBadge kind={d.kind} />
          </div>
        </td>

        {/* Query text + meta line (carries hidden-column values on small screens) */}
        <td className="min-w-0 px-2 py-2.5">
          <div className="flex min-w-0 items-start gap-2">
            <span
              className="block min-w-0 flex-1 truncate font-mono text-[11.5px] text-foreground sm:text-[12px]"
              title={d.query}
            >
              {d.query}
            </span>
            <span className="hidden shrink-0 font-mono text-[11px] text-muted-foreground md:inline">
              #{d.id.slice(0, 8)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-mono md:hidden">
              #{d.id.slice(0, 8)}
            </span>
            {d.user && (
              <span className="inline-flex items-center gap-1">
                <UserIcon className="size-3" />
                {d.user}
              </span>
            )}
            {d.db && (
              <span className="inline-flex items-center gap-1">
                <Database className="size-3" />
                {d.db}
              </span>
            )}
            {d.iface && (
              <span className="inline-flex items-center gap-1">
                <Globe className="size-3" />
                {d.iface}
              </span>
            )}
            {/* Metrics that surface inline once their column is hidden */}
            <span className="inline-flex items-center gap-1 md:hidden">
              <MemoryStick className="size-3" />
              {d.readableMemory}
            </span>
            <span className="inline-flex items-center gap-1 lg:hidden">
              <Cpu className="size-3" />
              {d.cores.toFixed(1)} cores
            </span>
            <span className="inline-flex items-center gap-1 xl:hidden">
              <HardDrive className="size-3" />
              {formatReadableSize(d.readBytes)}
            </span>
            <span className="inline-flex items-center gap-1 sm:hidden">
              <Clock className="size-3" />
              {d.readableElapsed}
            </span>
          </div>
        </td>

        {/* Progress — always visible */}
        <td className="px-2 py-2.5 sm:px-3">
          <ProgressCell d={d} />
        </td>

        {/* Memory — md+ */}
        <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums md:table-cell">
          {d.readableMemory}
        </td>

        {/* Data read — xl+ */}
        <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums xl:table-cell">
          {formatReadableSize(d.readBytes)}
        </td>

        {/* CPU — lg+ */}
        <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums lg:table-cell">
          {d.cores > 0 ? (
            <div className="flex items-center justify-end gap-1.5">
              <div className="h-1 w-9 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(d.cpuPct, 4)}%`,
                    background:
                      d.cpuPct > 70 ? 'hsl(0 84% 60%)' : 'hsl(217 91% 60%)',
                  }}
                />
              </div>
              <span>{d.cores.toFixed(1)}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">0</span>
          )}
        </td>

        {/* Threads — 2xl+ */}
        <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums text-muted-foreground 2xl:table-cell">
          {d.threads || 0}
        </td>

        {/* Duration — sm+ (lives in the meta line on xs) */}
        <td className="hidden whitespace-nowrap px-2 py-2.5 text-right text-[12px] tabular-nums sm:table-cell sm:px-3">
          <span className={SEVERITY_DURATION[d.severity]}>
            {d.readableElapsed}
          </span>
        </td>

        {/* Actions */}
        <td className="px-1.5 py-2.5 sm:px-3">
          <div
            className="flex items-center justify-end gap-0.5 opacity-60 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-rose-600"
                  onClick={handleKill}
                  disabled={isKilling || !d.id}
                  aria-label="Kill query"
                >
                  {isKilling ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CircleX className="size-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Kill query</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden size-7 text-muted-foreground hover:text-foreground md:inline-flex"
                  asChild
                >
                  <Link href={buildExplorerQueryUrl(d.query, hostId)}>
                    <ExternalLink className="size-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in Explorer</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden size-7 text-muted-foreground hover:text-foreground md:inline-flex"
                  asChild
                >
                  <Link
                    href={`/query?query_id=${encodeURIComponent(d.id)}&host=${hostId}`}
                  >
                    <ScanSearch className="size-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Query detail</TooltipContent>
            </Tooltip>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={9} className="p-0">
            <ExpandedRow d={d} onKill={handleKill} isKilling={isKilling} />
          </td>
        </tr>
      )}
    </>
  )
})

// ───────────────────────── table ─────────────────────────

interface RunningQueriesTableProps {
  rows: RunningQueryRow[]
}

/**
 * RunningQueriesTable — a dense, sortable, responsive table of in-flight
 * ClickHouse queries.
 *
 * Columns collapse progressively (Threads → CPU → Data → Memory → Duration)
 * as the viewport narrows; hidden values reappear inline under the query
 * text. Rows expand to a full execution-details panel. Search and a
 * kind filter operate over the derived rows; the count badge tracks the
 * filtered total.
 */
export const RunningQueriesTable = memo(function RunningQueriesTable({
  rows,
}: RunningQueriesTableProps) {
  const [search, setSearch] = useState('')
  const [filterKind, setFilterKind] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('duration')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const derived = useMemo(() => rows.map(derive), [rows])

  // Kind filter options come from the kinds actually present in the data.
  const kindOptions = useMemo(() => {
    const kinds = new Set<string>()
    for (const d of derived) kinds.add(d.kind)
    return ['all', ...Array.from(kinds).sort()]
  }, [derived])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = derived.filter((d) => {
      if (filterKind !== 'all' && d.kind !== filterKind) return false
      if (q) {
        return (
          d.id.toLowerCase().includes(q) ||
          d.query.toLowerCase().includes(q) ||
          d.user.toLowerCase().includes(q)
        )
      }
      return true
    })
    const accessor = SORT_ACCESSOR[sortKey]
    return [...filtered].sort((a, b) => {
      const cmp = accessor(a) - accessor(b)
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [derived, search, filterKind, sortKey, sortDir])

  const toggleRow = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prevKey
      }
      setSortDir('desc')
      return key
    })
  }, [])

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Toolbar — search + kind filter + filtered count */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-2.5 py-2.5 sm:px-3">
        <div className="flex h-8 min-w-[160px] flex-1 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 sm:w-64 sm:flex-none md:w-72">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search query, id, user…"
            className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {kindOptions.length > 2 && (
          <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-md bg-muted p-0.5">
            {kindOptions.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setFilterKind(kind)}
                className={cn(
                  'h-7 whitespace-nowrap rounded px-2.5 text-[11.5px] font-medium transition-colors',
                  filterKind === kind
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {kind === 'all' ? 'All' : kind}
              </button>
            ))}
          </div>
        )}

        <span className="ml-auto whitespace-nowrap text-[11.5px] tabular-nums text-muted-foreground">
          {visible.length} of {rows.length}
        </span>
      </div>

      {/* Table — table-fixed so the Query column truncates instead of pushing
          the metric columns off-screen. `min-w` keeps the columns legible on
          phones: below it the wrapper scrolls horizontally rather than letting
          table-fixed crush the Query column to a few pixels. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed border-collapse">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <SortableHeader width="108px">Type</SortableHeader>
              <SortableHeader>Query</SortableHeader>
              <SortableHeader
                width="140px"
                sortKey="progress"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
              >
                Progress
              </SortableHeader>
              <SortableHeader
                align="right"
                width="92px"
                className="hidden md:table-cell"
                sortKey="memory"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
              >
                Memory
              </SortableHeader>
              <SortableHeader
                align="right"
                width="96px"
                className="hidden xl:table-cell"
                sortKey="dataRead"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
              >
                Data
              </SortableHeader>
              <SortableHeader
                align="right"
                width="104px"
                className="hidden lg:table-cell"
                sortKey="cpu"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
              >
                CPU
              </SortableHeader>
              <SortableHeader
                align="right"
                width="72px"
                className="hidden 2xl:table-cell"
                sortKey="threads"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
              >
                Threads
              </SortableHeader>
              <SortableHeader
                align="right"
                width="86px"
                className="hidden sm:table-cell"
                sortKey="duration"
                activeKey={sortKey}
                dir={sortDir}
                onSort={handleSort}
              >
                Duration
              </SortableHeader>
              <SortableHeader width="84px" align="right">
                <span className="sr-only">Actions</span>
              </SortableHeader>
            </tr>
          </thead>
          <tbody>
            {visible.map((d) => (
              <QueryRow
                key={d.id}
                d={d}
                expanded={expanded.has(d.id)}
                onToggle={() => toggleRow(d.id)}
              />
            ))}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center text-[13px] text-muted-foreground"
                >
                  No queries match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3 py-2 text-[11.5px] text-muted-foreground">
        Showing{' '}
        <span className="font-medium tabular-nums text-foreground">
          {visible.length}
        </span>{' '}
        of <span className="tabular-nums">{rows.length}</span> active{' '}
        {rows.length === 1 ? 'query' : 'queries'}
      </div>
    </div>
  )
})
