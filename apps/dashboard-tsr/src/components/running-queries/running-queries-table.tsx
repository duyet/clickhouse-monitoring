import {
  ChevronDown,
  ChevronRight,
  CircleX,
  Clock,
  Code2,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Globe,
  HardDrive,
  ListFilter,
  Loader2,
  MemoryStick,
  ScanSearch,
  Search,
  SlidersHorizontal,
  User as UserIcon,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { memo, useCallback, useMemo, useState } from 'react'
import { DetailField } from '@/components/query-tables/detail-field'
import { exportCsv } from '@/components/query-tables/export-csv'
import { formatDuration } from '@/components/query-tables/format-duration'
import { KindBadge } from '@/components/query-tables/kind-badge'
import { SortableHeader } from '@/components/query-tables/sortable-header'
import { ToolbarButton } from '@/components/query-tables/toolbar-button'
import { ViewToggle } from '@/components/query-tables/view-toggle'
import { AppLink as Link } from '@/components/ui/app-link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import { buildExplorerQueryUrl } from '@/lib/explorer-url'
import { formatCompactNumber, formatReadableSize } from '@/lib/format-readable'
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

// KIND_BADGE, kindBadgeClass, and KindBadge are imported from @/components/query-tables/kind-badge

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

// formatDuration is imported from @/components/query-tables/format-duration

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
  key: string
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
  const queryId = String(row.query_id ?? '')
  const queryText = String(row.query ?? '')
  const fallbackKeyParts = [
    row.user || 'anon',
    row.current_database || 'default',
    row.interface || 'unknown',
    row.address || 'unknown',
    row.port?.toString() || '0',
    queryText.slice(0, 64),
  ].map((value) => String(value).trim())

  const key = queryId || fallbackKeyParts.join('|')

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
  // Prefer the virtualized CPU counter; fall back to user + system time only
  // when it is absent (profileEvent returns 0 for missing keys).
  const events = row.ProfileEvents
  const cpuVirtual = profileEvent(events, 'OSCPUVirtualTimeMicroseconds')
  const cpuMicros =
    cpuVirtual > 0
      ? cpuVirtual
      : profileEvent(events, 'UserTimeMicroseconds') +
        profileEvent(events, 'SystemTimeMicroseconds')
  const cores = elapsed > 0 ? cpuMicros / 1e6 / elapsed : 0
  const cpuPct = threads > 0 ? Math.min(100, (cores / threads) * 100) : 0

  const memory = Number(row.memory_usage ?? 0)

  return {
    row,
    id: queryId,
    key,
    kind: row.query_kind || 'Query',
    query: String(row.query ?? ''),
    user: String(row.user ?? ''),
    db: String(row.current_database ?? ''),
    iface: interfaceName(row.interface),
    elapsed,
    readableElapsed: row.readable_elapsed || `${elapsed.toFixed(1)}s`,
    pct,
    readRows,
    readableReadRows: row.readable_read_rows || formatCompactNumber(readRows),
    totalRows,
    readableTotalRows:
      row.readable_total_rows_approx || formatCompactNumber(totalRows),
    memory,
    // Base size only — `readable_memory_usage` can carry a "(peak …)" suffix
    // that overflows the fixed-width Memory column.
    readableMemory: formatReadableSize(memory),
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
  // Indeterminate progress sorts as 0 — it groups with "no measurable
  // progress yet" rather than below it via an arbitrary sentinel.
  progress: (d) => d.pct ?? 0,
  memory: (d) => d.memory,
  dataRead: (d) => d.readBytes,
  cpu: (d) => d.cpuPct,
  threads: (d) => d.threads,
  duration: (d) => d.elapsed,
}

// ───────────────────────── columns ─────────────────────────

/** The metric columns the user can show / hide via the column menu. */
type OptionalColumn = 'memory' | 'dataRead' | 'cpu' | 'threads' | 'duration'

const OPTIONAL_COLUMNS: { key: OptionalColumn; label: string }[] = [
  { key: 'memory', label: 'Memory' },
  { key: 'dataRead', label: 'Data' },
  { key: 'cpu', label: 'CPU' },
  { key: 'threads', label: 'Threads' },
  { key: 'duration', label: 'Duration' },
]

// Always-present columns: Type, Query, Progress, Actions.
const BASE_COLUMN_COUNT = 4

// ───────────────────────── cells ─────────────────────────

// KindBadge is imported from @/components/query-tables/kind-badge

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
          // No known total — a segment slides across to signal live scanning.
          <div
            className="absolute inset-y-0 w-1/3 animate-rq-indeterminate rounded-full"
            style={{ background: color }}
          />
        ) : null}
      </div>
    </div>
  )
}

/** A small CPU-utilisation bar + percentage. */
function CpuMeter({ pct }: { pct: number }) {
  const rounded = Math.round(pct)
  return (
    <div className="flex items-center justify-end gap-1.5">
      <div className="h-1 w-9 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(pct, 3)}%`,
            background: pct > 70 ? 'hsl(0 84% 60%)' : 'hsl(217 91% 60%)',
          }}
        />
      </div>
      <span className="tabular-nums">{rounded}%</span>
    </div>
  )
}

// SortableHeader is imported from @/components/query-tables/sortable-header
// DetailField is imported from @/components/query-tables/detail-field

// ───────────────────────── expanded row ─────────────────────────

interface ExpandedRowProps {
  d: DerivedQuery
  onKill: () => void
  isKilling: boolean
}

/**
 * Expanded row — an execution-details grid, the full query as a scrollable
 * code block, then row actions.
 */
function ExpandedRow({ d, onKill, isKilling }: ExpandedRowProps) {
  const hostId = useHostId()
  const explorerUrl = buildExplorerQueryUrl(d.query, hostId)
  const detailUrl = d.id
    ? `/query?query_id=${encodeURIComponent(d.id)}&host=${hostId}`
    : ''
  const lineCount = (d.query.match(/\n/g)?.length ?? 0) + 1

  // Every field is backed by a real `system.processes` column.
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
      label: 'Depth',
      value:
        d.row.distributed_depth != null ? String(d.row.distributed_depth) : '0',
    },
    { label: 'Duration', value: d.readableElapsed, mono: false },
    { label: 'Memory', value: d.readableMemory },
    { label: 'Rows read', value: d.readableReadRows },
    { label: 'Data read', value: formatReadableSize(d.readBytes) },
  ]

  return (
    <div className="space-y-3 border-t border-border bg-muted/40 px-3 py-3.5 sm:px-5">
      {/* Execution details — a compact key/value grid */}
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Execution details
        </div>
        <dl className="-ml-px -mt-px grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
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

      {/* Full query — a plain, scrollable code block. Not wrapped in a
          button: the SQL is selectable text; "Open in Explorer" below is the
          interactive path. */}
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Full query
          </span>
          <span className="whitespace-nowrap text-[10.5px] tabular-nums text-muted-foreground">
            {d.query.length.toLocaleString()} chars
            <span className="mx-1.5 opacity-50">·</span>
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>
        <pre className="max-h-[180px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-card px-3 py-2 font-mono text-[11.5px] leading-relaxed text-foreground">
          {d.query}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="h-7 gap-1.5" asChild>
          <Link href={explorerUrl}>
            <ExternalLink className="size-3.5" />
            Open in Explorer
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5"
          asChild={Boolean(detailUrl)}
          disabled={!detailUrl}
        >
          {detailUrl ? (
            <Link href={detailUrl}>
              <ScanSearch className="size-3.5" />
              Query detail
            </Link>
          ) : (
            <span className="inline-flex h-7 items-center gap-1.5">
              <ScanSearch className="size-3.5" />
              Query detail
            </span>
          )}
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

/**
 * Kill-query action + in-flight state, shared by the table row and the card.
 * `useActions` binds the active hostId internally — killQuery(queryId).
 */
function useKillQuery(id: string) {
  const { killQuery } = useActions()
  const [isKilling, setIsKilling] = useState(false)

  const handleKill = useCallback(async () => {
    if (!id) return
    setIsKilling(true)
    try {
      const result = await killQuery(id)
      if (result.success) toast.success(result.message)
      else toast.error(result.message)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to kill query')
    } finally {
      setIsKilling(false)
    }
  }, [killQuery, id])

  return { isKilling, handleKill }
}

interface QueryRowProps {
  d: DerivedQuery
  expanded: boolean
  onToggle: () => void
  hiddenColumns: Set<OptionalColumn>
}

/** One running query rendered as a table row (collapsed) + detail row. */
const QueryRow = memo(function QueryRow({
  d,
  expanded,
  onToggle,
  hiddenColumns,
}: QueryRowProps) {
  const hostId = useHostId()
  const { isKilling, handleKill } = useKillQuery(d.id)
  const queryDetailUrl = d.id
    ? `/query?query_id=${encodeURIComponent(d.id)}&host=${hostId}`
    : ''

  const dur = formatDuration(d.elapsed)
  const showMemory = !hiddenColumns.has('memory')
  const showData = !hiddenColumns.has('dataRead')
  const showCpu = !hiddenColumns.has('cpu')
  const showThreads = !hiddenColumns.has('threads')
  const showDuration = !hiddenColumns.has('duration')
  const colSpan =
    BASE_COLUMN_COUNT + (OPTIONAL_COLUMNS.length - hiddenColumns.size)

  return (
    <>
      <tr
        className="group animate-in cursor-pointer border-b border-border align-middle fade-in-0 slide-in-from-top-1 duration-300 hover:bg-muted/60"
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
              #{d.id ? d.id.slice(0, 8) : 'n/a'}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-mono md:hidden">
              #{d.id ? d.id.slice(0, 8) : 'n/a'}
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
            {/* Each metric surfaces inline when its column is unavailable —
                either collapsed by the viewport (responsive `*:hidden`) or
                switched off in the column menu (no responsive class, so it
                stays visible). */}
            <span
              className={cn(
                'inline-flex items-center gap-1',
                showMemory && 'md:hidden'
              )}
            >
              <MemoryStick className="size-3" />
              {d.readableMemory}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1',
                showCpu && 'lg:hidden'
              )}
            >
              <Cpu className="size-3" />
              {Math.round(d.cpuPct)}%
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1',
                showData && 'xl:hidden'
              )}
            >
              <HardDrive className="size-3" />
              {formatReadableSize(d.readBytes)}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1',
                showDuration && 'sm:hidden'
              )}
            >
              <Clock className="size-3" />
              {dur.value} {dur.unit}
            </span>
          </div>
        </td>

        {/* Progress — always visible */}
        <td className="px-2 py-2.5 sm:px-3">
          <ProgressCell d={d} />
        </td>

        {/* Memory — md+ */}
        {showMemory && (
          <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums md:table-cell">
            {d.readableMemory}
          </td>
        )}

        {/* Data read — xl+ */}
        {showData && (
          <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums xl:table-cell">
            {formatReadableSize(d.readBytes)}
          </td>
        )}

        {/* CPU — lg+ */}
        {showCpu && (
          <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums lg:table-cell">
            {d.cpuPct > 0 ? (
              <CpuMeter pct={d.cpuPct} />
            ) : (
              <span className="text-muted-foreground">0%</span>
            )}
          </td>
        )}

        {/* Threads — 2xl+ */}
        {showThreads && (
          <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums text-muted-foreground 2xl:table-cell">
            {d.threads || 0}
          </td>
        )}

        {/* Duration — sm+ (lives in the meta line on xs) */}
        {showDuration && (
          <td className="hidden whitespace-nowrap px-2 py-2.5 text-right text-[12px] tabular-nums sm:table-cell sm:px-3">
            <span className={SEVERITY_DURATION[d.severity]}>
              {dur.value}
              <span className="ml-0.5 text-[10.5px] text-muted-foreground">
                {dur.unit}
              </span>
            </span>
          </td>
        )}

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
                  asChild={Boolean(queryDetailUrl)}
                  disabled={!queryDetailUrl}
                >
                  {queryDetailUrl ? (
                    <Link href={queryDetailUrl}>
                      <ScanSearch className="size-3.5" />
                    </Link>
                  ) : (
                    <span>
                      <ScanSearch className="size-3.5" />
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {queryDetailUrl ? 'Query detail' : 'Query ID unavailable'}
              </TooltipContent>
            </Tooltip>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={colSpan} className="p-0">
            <ExpandedRow d={d} onKill={handleKill} isKilling={isKilling} />
          </td>
        </tr>
      )}
    </>
  )
})

// ───────────────────────── toolbar ─────────────────────────

// ToolbarButton is imported from @/components/query-tables/toolbar-button

/** Segmented query-kind filter ("All / SELECT / INSERT / …"). */
function KindFilter({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (kind: string) => void
}) {
  return (
    <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-md bg-muted p-0.5">
      {options.map((kind) => (
        <button
          key={kind}
          type="button"
          onClick={() => onChange(kind)}
          className={cn(
            'h-7 whitespace-nowrap rounded px-2.5 text-[11.5px] font-medium uppercase tracking-wide transition-colors',
            value === kind
              ? 'bg-card text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {kind === 'all' ? 'All' : kind}
        </button>
      ))}
    </div>
  )
}

// ───────────────────────── csv export ─────────────────────────

const CSV_HEADERS = [
  'Query ID',
  'Type',
  'User',
  'Database',
  'Interface',
  'Progress %',
  'Memory',
  'Data read',
  'CPU %',
  'Threads',
  'Duration (s)',
  'Query',
] as const

/** Download the currently-filtered rows as a CSV file. */
function downloadRunningCsv(rows: DerivedQuery[]) {
  exportCsv(
    CSV_HEADERS,
    rows,
    (d) => [
      d.id,
      d.kind,
      d.user,
      d.db,
      d.iface ?? '',
      d.pct ?? '',
      d.readableMemory,
      formatReadableSize(d.readBytes),
      Math.round(d.cpuPct),
      d.threads,
      d.elapsed.toFixed(1),
      d.query,
    ],
    'running-queries'
  )
}

// ───────────────────────── table ─────────────────────────

// ───────────────────────── card view ─────────────────────────

interface QueryCardProps {
  d: DerivedQuery
  expanded: boolean
  onToggle: () => void
}

/**
 * One running query as a card — the mobile-first counterpart to QueryRow.
 * Leads with the SQL (a highlighted, tappable-to-expand hero block), then the
 * key live metrics; expanding reuses the same ExpandedRow detail panel.
 */
const QueryCard = memo(function QueryCard({
  d,
  expanded,
  onToggle,
}: QueryCardProps) {
  const { isKilling, handleKill } = useKillQuery(d.id)
  const ExpandIcon = expanded ? ChevronDown : ChevronRight
  const dur = formatDuration(d.elapsed)

  return (
    <div
      data-testid="running-query-card"
      data-expanded={expanded || undefined}
      className="overflow-hidden rounded-lg border border-border/60 bg-card/40"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full flex-col gap-2.5 p-3 text-left"
      >
        {/* Header: kind badge + short id + expand affordance */}
        <div className="flex min-w-0 items-center gap-2">
          <KindBadge kind={d.kind} />
          <span className="min-w-0 truncate font-mono text-[11px] text-muted-foreground">
            #{d.id ? d.id.slice(0, 8) : 'n/a'}
          </span>
          <ExpandIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </div>

        {/* SQL hero — the focus of the card */}
        <div className="min-w-0 rounded-md border border-border/50 bg-muted/60 p-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
            <Code2 className="size-3 shrink-0" />
            Query
          </div>
          <pre className="m-0 line-clamp-4 whitespace-pre-wrap break-words font-mono text-[0.8rem] leading-relaxed text-foreground">
            {d.query}
          </pre>
        </div>

        {/* Key live metrics */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {d.user && (
            <span className="inline-flex items-center gap-1">
              <UserIcon className="size-3" />
              {d.user}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {dur.value} {dur.unit}
          </span>
          <span className="inline-flex items-center gap-1">
            <MemoryStick className="size-3" />
            {d.readableMemory}
          </span>
          <span className="inline-flex items-center gap-1">
            <HardDrive className="size-3" />
            {formatReadableSize(d.readBytes)}
          </span>
        </div>

        <ProgressCell d={d} />
      </button>

      {expanded && (
        <ExpandedRow d={d} onKill={handleKill} isKilling={isKilling} />
      )}
    </div>
  )
})

// ViewToggle is imported from @/components/query-tables/view-toggle

interface RunningQueriesTableProps {
  rows: RunningQueryRow[]
}

/**
 * RunningQueriesTable — a dense, sortable, responsive table of in-flight
 * ClickHouse queries.
 *
 * The toolbar carries search, a query-kind segment, a user filter, a
 * "more filters" popover (interface + long-running), a column-visibility menu
 * and CSV export. Columns also collapse progressively as the viewport narrows;
 * hidden values reappear inline under the query text. Rows expand to a full
 * execution-details panel.
 */
export const RunningQueriesTable = memo(function RunningQueriesTable({
  rows,
}: RunningQueriesTableProps) {
  const [search, setSearch] = useState('')
  const [filterKind, setFilterKind] = useState('all')
  const [filterUser, setFilterUser] = useState('all')
  const [filterInterface, setFilterInterface] = useState('all')
  const [longRunningOnly, setLongRunningOnly] = useState(false)
  const [hiddenColumns, setHiddenColumns] = useState<Set<OptionalColumn>>(
    () => new Set()
  )
  const [sortKey, setSortKey] = useState<SortKey>('duration')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  // Card view leads on phones (the wide metric table is unreadable in a scroll
  // box), table on desktop — with a toggle so either is reachable anywhere.
  // `null` follows the breakpoint until the user explicitly picks a view.
  const isMobile = useIsMobile()
  const [userView, setUserView] = useState<'table' | 'cards' | null>(null)
  const view = userView ?? (isMobile ? 'cards' : 'table')
  // Expansion is keyed by a stable row key; `query_id` still drives actions.
  // A row stays open across refreshes and re-sorts as long as that underlying
  // identifier remains stable.
  // sorting / filtering never reassigns the panel to a different query.
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const derived = useMemo(() => rows.map(derive), [rows])

  // Filter options come from the values actually present in the data.
  const kindOptions = useMemo(() => {
    const kinds = new Set<string>()
    for (const d of derived) kinds.add(d.kind)
    return ['all', ...Array.from(kinds).sort()]
  }, [derived])

  const userOptions = useMemo(() => {
    const users = new Set<string>()
    for (const d of derived) if (d.user) users.add(d.user)
    return Array.from(users).sort()
  }, [derived])

  const interfaceOptions = useMemo(() => {
    const ifaces = new Set<string>()
    for (const d of derived) if (d.iface) ifaces.add(d.iface)
    return Array.from(ifaces).sort()
  }, [derived])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = derived.filter((d) => {
      if (filterKind !== 'all' && d.kind !== filterKind) return false
      if (filterUser !== 'all' && d.user !== filterUser) return false
      if (filterInterface !== 'all' && d.iface !== filterInterface) return false
      if (longRunningOnly && d.elapsed <= 30) return false
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
  }, [
    derived,
    search,
    filterKind,
    filterUser,
    filterInterface,
    longRunningOnly,
    sortKey,
    sortDir,
  ])

  const moreFiltersActive = filterInterface !== 'all' || longRunningOnly
  const totalColumns =
    BASE_COLUMN_COUNT + (OPTIONAL_COLUMNS.length - hiddenColumns.size)

  const toggleRow = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSort = useCallback((key: string) => {
    const k = key as SortKey
    setSortKey((prevKey) => {
      if (prevKey === k) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prevKey
      }
      setSortDir('desc')
      return k
    })
  }, [])

  const toggleColumn = useCallback((key: OptionalColumn) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const headerFor = (key: OptionalColumn) => !hiddenColumns.has(key)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-2.5 py-2.5 sm:px-3">
        {/* Search */}
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

        {/* Query-kind segment */}
        <KindFilter
          options={kindOptions}
          value={filterKind}
          onChange={setFilterKind}
        />

        {/* User filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ToolbarButton active={filterUser !== 'all'}>
              <UserIcon className="size-3.5" />
              {filterUser === 'all' ? 'All users' : filterUser}
              <ChevronDown className="size-3 opacity-60" />
            </ToolbarButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Filter by user</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={filterUser}
              onValueChange={setFilterUser}
            >
              <DropdownMenuRadioItem value="all">
                All users
              </DropdownMenuRadioItem>
              {userOptions.map((user) => (
                <DropdownMenuRadioItem key={user} value={user}>
                  {user}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* More filters */}
        <Popover>
          <PopoverTrigger asChild>
            <ToolbarButton active={moreFiltersActive}>
              <ListFilter className="size-3.5" />
              More filters
              {moreFiltersActive && (
                <span className="ml-0.5 size-1.5 rounded-full bg-blue-500" />
              )}
            </ToolbarButton>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-60 space-y-3">
            <div>
              <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Interface
              </p>
              <div className="flex flex-wrap gap-1">
                {['all', ...interfaceOptions].map((iface) => (
                  <button
                    key={iface}
                    type="button"
                    onClick={() => setFilterInterface(iface)}
                    className={cn(
                      'rounded-md border px-2 py-1 text-[11.5px] font-medium transition-colors',
                      filterInterface === iface
                        ? 'border-border bg-muted text-foreground'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {iface === 'all' ? 'All' : iface}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[12.5px]">
              <Checkbox
                checked={longRunningOnly}
                onCheckedChange={(c) => setLongRunningOnly(c === true)}
              />
              Long-running only{' '}
              <span className="text-muted-foreground">(&gt; 30s)</span>
            </label>
            {moreFiltersActive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-full text-[12px]"
                onClick={() => {
                  setFilterInterface('all')
                  setLongRunningOnly(false)
                }}
              >
                Reset filters
              </Button>
            )}
          </PopoverContent>
        </Popover>

        <div className="ml-auto flex items-center gap-2">
          <span className="whitespace-nowrap text-[11.5px] tabular-nums text-muted-foreground">
            {visible.length} of {rows.length}
          </span>
          <div className="h-5 w-px bg-border" />

          {/* Table / cards view */}
          <ViewToggle active={view} onChange={setUserView} />

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Column settings"
                className="inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <SlidersHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {OPTIONAL_COLUMNS.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={!hiddenColumns.has(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          <ToolbarButton
            onClick={() => downloadRunningCsv(visible)}
            disabled={visible.length === 0}
          >
            <Download className="size-3.5" />
            Export
          </ToolbarButton>
        </div>
      </div>

      {view === 'cards' ? (
        /* Card list — SQL-first, the default on phones. */
        <div
          className="flex flex-col gap-3 p-3"
          data-testid="running-queries-cards"
        >
          {visible.map((d) => (
            <QueryCard
              key={d.key}
              d={d}
              expanded={expanded.has(d.key)}
              onToggle={() => toggleRow(d.key)}
            />
          ))}
          {visible.length === 0 && (
            <div className="px-6 py-12 text-center text-[13px] text-muted-foreground">
              No queries match your filters
            </div>
          )}
        </div>
      ) : (
        /* Table — table-fixed so the Query column truncates instead of pushing
          the metric columns off-screen. `min-w` keeps the columns legible on
          phones: below it the wrapper scrolls horizontally rather than letting
          table-fixed crush the Query column to a few pixels. */
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
                {headerFor('memory') && (
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
                )}
                {headerFor('dataRead') && (
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
                )}
                {headerFor('cpu') && (
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
                )}
                {headerFor('threads') && (
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
                )}
                {headerFor('duration') && (
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
                )}
                <SortableHeader width="84px" align="right">
                  <span className="sr-only">Actions</span>
                </SortableHeader>
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => (
                // Keyed by stable row key so each row keeps identity and
                // component state through refreshes, sorts and filters.
                <QueryRow
                  key={d.key}
                  d={d}
                  expanded={expanded.has(d.key)}
                  onToggle={() => toggleRow(d.key)}
                  hiddenColumns={hiddenColumns}
                />
              ))}
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={totalColumns}
                    className="px-6 py-12 text-center text-[13px] text-muted-foreground"
                  >
                    No queries match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
