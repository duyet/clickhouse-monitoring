'use client'

import {
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Flame,
  HardDrive,
  ListFilter,
  MemoryStick,
  Repeat,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'

import { memo, useCallback, useMemo, useState } from 'react'
import { DialogSQL } from '@/components/dialogs/dialog-sql'
import { DetailField } from '@/components/query-tables/detail-field'
import { exportCsv } from '@/components/query-tables/export-csv'
import { formatDuration } from '@/components/query-tables/format-duration'
import { SortableHeader } from '@/components/query-tables/sortable-header'
import { ToolbarButton } from '@/components/query-tables/toolbar-button'
import { ViewToggle } from '@/components/query-tables/view-toggle'
import { AppLink as Link } from '@/components/ui/app-link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
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
import {
  formatCompactNumber,
  formatReadableSecondDuration,
} from '@/lib/format-readable'
import { useHostId } from '@/lib/swr/use-host'
import { cn } from '@/lib/utils'

/**
 * Shape of a single `expensive-queries` row — one normalized query fingerprint
 * aggregated over the last 24h of `system.query_log`. Only the fields the
 * table reads are typed; the index signature tolerates the long tail of
 * ProfileEvents-derived columns the config also selects.
 */
export interface ExpensiveQueryRow {
  normalized_query_hash?: string | number
  query: string
  query_cache_usage?: string
  cnt?: number
  queries_duration?: number
  real_time?: number
  user_time?: number
  system_time?: number
  disk_read_time?: number
  disk_write_time?: number
  network_send_time?: number
  network_receive_time?: number
  zookeeper_wait_time?: number
  os_io_wait_time?: number
  os_cpu_wait_time?: number
  os_cpu_virtual_time?: number
  network_receive_bytes?: string
  network_send_bytes?: string
  selected_rows?: number
  selected_parts?: number
  selected_marks?: number
  selected_ranges?: number
  file_open?: number
  zookeeper_transactions?: number
  memory_usage_q97?: number
  readable_memory_usage_q97?: string
  read_rows?: number
  written_rows?: number
  result_rows?: number
  read_bytes?: string
  written_bytes?: string
  result_bytes?: string
  [key: string]: unknown
}

// ───────────────────────── helpers ─────────────────────────

type Severity = 'critical' | 'warning' | 'normal'

/**
 * Classify a fingerprint by its total wall-clock time across all executions
 * in the window — the same thresholds the original `rowClassName` used, so the
 * heat accent stays consistent with the rest of the app.
 */
function getSeverity(queriesDuration: number): Severity {
  if (queriesDuration > 30) return 'critical'
  if (queriesDuration > 5) return 'warning'
  return 'normal'
}

function num(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

// ───────────────────────── derived row ─────────────────────────

/**
 * An `ExpensiveQueryRow` with the metrics the table sorts / filters / renders
 * pre-computed once. `rank` is the row's 1-based position in the *original*
 * order (most expensive first), so the "#1 / #2 …" badges survive re-sorting.
 */
interface DerivedQuery {
  row: ExpensiveQueryRow
  key: string
  rank: number
  query: string
  cacheUsage: string | null
  cnt: number
  queriesDuration: number
  userTime: number
  systemTime: number
  realTime: number
  memory: number
  readableMemory: string
  readRows: number
  writtenRows: number
  resultRows: number
  selectedRows: number
  readBytes: string
  writtenBytes: string
  resultBytes: string
  severity: Severity
}

function derive(row: ExpensiveQueryRow, index: number): DerivedQuery {
  const query = String(row.query ?? '')
  const hash = row.normalized_query_hash
  const key = hash != null && hash !== '' ? String(hash) : `idx-${index}`
  const queriesDuration = num(row.queries_duration)
  const memory = num(row.memory_usage_q97)

  return {
    row,
    key,
    rank: index + 1,
    query,
    cacheUsage:
      row.query_cache_usage != null && row.query_cache_usage !== ''
        ? String(row.query_cache_usage)
        : null,
    cnt: num(row.cnt),
    queriesDuration,
    userTime: num(row.user_time),
    systemTime: num(row.system_time),
    realTime: num(row.real_time),
    memory,
    readableMemory:
      row.readable_memory_usage_q97 || formatCompactNumber(memory),
    readRows: num(row.read_rows),
    writtenRows: num(row.written_rows),
    resultRows: num(row.result_rows),
    selectedRows: num(row.selected_rows),
    readBytes: String(row.read_bytes ?? '—'),
    writtenBytes: String(row.written_bytes ?? '—'),
    resultBytes: String(row.result_bytes ?? '—'),
    severity: getSeverity(queriesDuration),
  }
}

// ───────────────────────── sorting ─────────────────────────

type SortKey = 'rank' | 'cnt' | 'duration' | 'cpu' | 'memory' | 'readRows'

type SortDir = 'asc' | 'desc'

const SORT_ACCESSOR: Record<SortKey, (d: DerivedQuery) => number> = {
  // Rank ascending == most expensive first (the server's native order).
  rank: (d) => -d.rank,
  cnt: (d) => d.cnt,
  duration: (d) => d.queriesDuration,
  cpu: (d) => d.userTime,
  memory: (d) => d.memory,
  readRows: (d) => d.readRows,
}

// ───────────────────────── columns ─────────────────────────

type OptionalColumn = 'cnt' | 'cpu' | 'memory' | 'readRows'

const OPTIONAL_COLUMNS: { key: OptionalColumn; label: string }[] = [
  { key: 'cnt', label: 'Runs' },
  { key: 'cpu', label: 'CPU time' },
  { key: 'memory', label: 'Memory' },
  { key: 'readRows', label: 'Rows read' },
]

// Always present: Rank, Query, Total time, Actions.
const BASE_COLUMN_COUNT = 4

// ───────────────────────── cells ─────────────────────────

const RANK_BADGE: Record<Severity, string> = {
  critical:
    'bg-rose-100 text-rose-700 ring-1 ring-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:ring-rose-800',
  warning:
    'bg-amber-100 text-amber-700 ring-1 ring-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-800',
  normal: 'bg-muted text-muted-foreground',
}

/**
 * Rank chip — "#1, #2 …" with a heat ring keyed to severity. The top three
 * offenders also get a flame so the worst queries are obvious at a glance.
 */
function RankBadge({ rank, severity }: { rank: number; severity: Severity }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums',
        RANK_BADGE[severity]
      )}
    >
      {rank <= 3 && severity !== 'normal' && (
        <Flame className="size-3 shrink-0" />
      )}
      #{rank}
    </span>
  )
}

const SEVERITY_DURATION: Record<Severity, string> = {
  critical: 'text-rose-600 dark:text-rose-400 font-semibold',
  warning: 'text-amber-600 dark:text-amber-400 font-medium',
  normal: '',
}

/** Total-time cell — the headline metric, with a heat-toned bar. */
function TotalTimeCell({ d, max }: { d: DerivedQuery; max: number }) {
  const t = formatDuration(d.queriesDuration)
  const pct = max > 0 ? Math.min(100, (d.queriesDuration / max) * 100) : 0
  const color =
    d.severity === 'critical'
      ? 'hsl(0 84% 60%)'
      : d.severity === 'warning'
        ? 'hsl(38 92% 50%)'
        : 'hsl(217 91% 60%)'
  return (
    <div className="flex min-w-[88px] flex-col gap-1">
      <span className={cn('tabular-nums', SEVERITY_DURATION[d.severity])}>
        {t.value}
        <span className="ml-0.5 text-[10.5px] text-muted-foreground">
          {t.unit}
        </span>
      </span>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: `${Math.max(pct, 2)}%`, background: color }}
        />
      </div>
    </div>
  )
}

// ───────────────────────── expanded row ─────────────────────────

/**
 * Expanded panel — the full secondary-metric grid, the full query as a
 * scrollable code block, then row actions (full-query dialog + explorer).
 */
function ExpandedRow({ d }: { d: DerivedQuery }) {
  const hostId = useHostId()
  const explorerUrl = buildExplorerQueryUrl(d.query, hostId)
  const lineCount = (d.query.match(/\n/g)?.length ?? 0) + 1

  // Every field is backed by a real column the config selects.
  const fields: { label: string; value: React.ReactNode; mono?: boolean }[] = [
    { label: 'Runs', value: formatCompactNumber(d.cnt) },
    {
      label: 'Total time',
      value: formatReadableSecondDuration(Math.round(d.queriesDuration)),
      mono: false,
    },
    {
      label: 'User CPU',
      value: formatReadableSecondDuration(Math.round(d.userTime)),
      mono: false,
    },
    {
      label: 'System CPU',
      value: formatReadableSecondDuration(Math.round(d.systemTime)),
      mono: false,
    },
    {
      label: 'Real time',
      value: formatReadableSecondDuration(Math.round(d.realTime)),
      mono: false,
    },
    { label: 'Memory (q97)', value: d.readableMemory },
    { label: 'Rows read', value: formatCompactNumber(d.readRows) },
    { label: 'Rows written', value: formatCompactNumber(d.writtenRows) },
    { label: 'Result rows', value: formatCompactNumber(d.resultRows) },
    { label: 'Selected rows', value: formatCompactNumber(d.selectedRows) },
    { label: 'Bytes read', value: d.readBytes },
    { label: 'Bytes written', value: d.writtenBytes },
    { label: 'Result bytes', value: d.resultBytes },
    {
      label: 'Disk read',
      value: formatReadableSecondDuration(
        Math.round(num(d.row.disk_read_time))
      ),
      mono: false,
    },
    {
      label: 'Net receive',
      value: String(d.row.network_receive_bytes ?? '—'),
    },
    {
      label: 'Cache',
      value: d.cacheUsage ?? '—',
      mono: false,
    },
  ]

  return (
    <div className="space-y-3 border-t border-border bg-muted/40 px-3 py-3.5 sm:px-5">
      {/* Secondary metrics — a compact key/value grid */}
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Aggregated metrics (last 24h)
        </div>
        <dl className="-ml-px -mt-px grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
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

      {/* Full query — a plain, scrollable code block. */}
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Query fingerprint
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
        <DialogSQL
          sql={d.query}
          title={`#${d.rank} · Most expensive query`}
          description="Full normalized query fingerprint"
          button={
            <Button variant="outline" size="sm" className="h-7 gap-1.5">
              <Code2 className="size-3.5" />
              Full query
            </Button>
          }
        />
        <Button variant="outline" size="sm" className="h-7 gap-1.5" asChild>
          <Link href={explorerUrl}>
            <ExternalLink className="size-3.5" />
            Open in Explorer
          </Link>
        </Button>
      </div>
    </div>
  )
}

// ───────────────────────── query row ─────────────────────────

interface QueryRowProps {
  d: DerivedQuery
  maxDuration: number
  expanded: boolean
  onToggle: () => void
  hiddenColumns: Set<OptionalColumn>
}

/** One fingerprint rendered as a table row (collapsed) + detail row. */
const QueryRow = memo(function QueryRow({
  d,
  maxDuration,
  expanded,
  onToggle,
  hiddenColumns,
}: QueryRowProps) {
  const hostId = useHostId()
  const showCnt = !hiddenColumns.has('cnt')
  const showCpu = !hiddenColumns.has('cpu')
  const showMemory = !hiddenColumns.has('memory')
  const showReadRows = !hiddenColumns.has('readRows')
  const colSpan =
    BASE_COLUMN_COUNT + (OPTIONAL_COLUMNS.length - hiddenColumns.size)
  const cpu = formatDuration(d.userTime)

  return (
    <>
      <tr
        className={cn(
          'group animate-in cursor-pointer border-b border-border align-middle fade-in-0 duration-300 hover:bg-muted/60',
          d.severity === 'critical' && 'bg-rose-50/60 dark:bg-rose-950/15',
          d.severity === 'warning' && 'bg-amber-50/60 dark:bg-amber-950/10'
        )}
        onClick={onToggle}
      >
        {/* Rank + expand chevron */}
        <td className="px-2 py-2.5 sm:px-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ChevronRight
              className={cn(
                'size-3 shrink-0 text-muted-foreground transition-transform',
                expanded && 'rotate-90'
              )}
            />
            <RankBadge rank={d.rank} severity={d.severity} />
          </div>
        </td>

        {/* Query text + meta line (carries hidden-column values on small screens) */}
        <td className="min-w-0 px-2 py-2.5">
          <span
            className="block min-w-0 truncate font-mono text-[11.5px] text-foreground sm:text-[12px]"
            title={d.query}
          >
            {d.query}
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Repeat className="size-3" />
              {formatCompactNumber(d.cnt)} runs
            </span>
            {/* Each metric surfaces inline when its column is collapsed by the
                viewport (responsive `*:hidden`) or hidden in the column menu. */}
            <span
              className={cn(
                'inline-flex items-center gap-1',
                showCpu && 'lg:hidden'
              )}
            >
              <Cpu className="size-3" />
              {cpu.value} {cpu.unit}
            </span>
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
                showReadRows && 'xl:hidden'
              )}
            >
              <Database className="size-3" />
              {formatCompactNumber(d.readRows)} rows
            </span>
          </div>
        </td>

        {/* Total time — always visible */}
        <td className="px-2 py-2.5 sm:px-3">
          <TotalTimeCell d={d} max={maxDuration} />
        </td>

        {/* Runs — sm+ */}
        {showCnt && (
          <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums sm:table-cell">
            {formatCompactNumber(d.cnt)}
          </td>
        )}

        {/* CPU time — lg+ */}
        {showCpu && (
          <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums lg:table-cell">
            {cpu.value}
            <span className="ml-0.5 text-[10.5px] text-muted-foreground">
              {cpu.unit}
            </span>
          </td>
        )}

        {/* Memory — md+ */}
        {showMemory && (
          <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums md:table-cell">
            {d.readableMemory}
          </td>
        )}

        {/* Rows read — xl+ */}
        {showReadRows && (
          <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums text-muted-foreground xl:table-cell">
            {formatCompactNumber(d.readRows)}
          </td>
        )}

        {/* Actions */}
        <td className="px-1.5 py-2.5 sm:px-3">
          <div
            className="flex items-center justify-end gap-0.5 opacity-60 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <DialogSQL
              sql={d.query}
              title={`#${d.rank} · Most expensive query`}
              description="Full normalized query fingerprint"
              button={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-foreground"
                  aria-label="Show full query"
                >
                  <Code2 className="size-3.5" />
                </Button>
              }
            />
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
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={colSpan} className="p-0">
            <ExpandedRow d={d} />
          </td>
        </tr>
      )}
    </>
  )
})

// ───────────────────────── toolbar ─────────────────────────

const SEVERITY_FILTERS = ['all', 'critical', 'warning'] as const
type SeverityFilter = (typeof SEVERITY_FILTERS)[number]

const SEVERITY_LABEL: Record<SeverityFilter, string> = {
  all: 'All',
  critical: 'Critical',
  warning: 'Warning+',
}

/** Segmented severity (heat) filter. */
function SeverityFilterBar({
  value,
  onChange,
}: {
  value: SeverityFilter
  onChange: (value: SeverityFilter) => void
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
      {SEVERITY_FILTERS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            'h-7 whitespace-nowrap rounded px-2.5 text-[11.5px] font-medium transition-colors',
            value === s
              ? 'bg-card text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {SEVERITY_LABEL[s]}
        </button>
      ))}
    </div>
  )
}

// ───────────────────────── csv export ─────────────────────────

const CSV_HEADERS = [
  'Rank',
  'Runs',
  'Total time (s)',
  'User CPU (s)',
  'System CPU (s)',
  'Memory (q97)',
  'Rows read',
  'Rows written',
  'Result rows',
  'Query',
] as const

/** Download the currently-filtered rows as a CSV file. */
function downloadExpensiveCsv(rows: DerivedQuery[]) {
  exportCsv(
    CSV_HEADERS,
    rows,
    (d) => [
      d.rank,
      d.cnt,
      d.queriesDuration.toFixed(1),
      d.userTime.toFixed(1),
      d.systemTime.toFixed(1),
      d.readableMemory,
      d.readRows,
      d.writtenRows,
      d.resultRows,
      d.query,
    ],
    'expensive-queries'
  )
}

// ───────────────────────── card view ─────────────────────────

interface QueryCardProps {
  d: DerivedQuery
  maxDuration: number
  expanded: boolean
  onToggle: () => void
}

/**
 * One fingerprint as a card — the mobile-first counterpart to QueryRow.
 * Leads with the rank + SQL, then the key cost metrics; expanding reuses the
 * same ExpandedRow detail panel.
 */
const QueryCard = memo(function QueryCard({
  d,
  maxDuration,
  expanded,
  onToggle,
}: QueryCardProps) {
  const ExpandIcon = expanded ? ChevronDown : ChevronRight
  const cpu = formatDuration(d.userTime)

  return (
    <div
      data-testid="expensive-query-card"
      data-expanded={expanded || undefined}
      className={cn(
        'overflow-hidden rounded-lg border bg-card/40',
        d.severity === 'critical'
          ? 'border-rose-300/60 dark:border-rose-900/50'
          : d.severity === 'warning'
            ? 'border-amber-300/60 dark:border-amber-900/50'
            : 'border-border/60'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full flex-col gap-2.5 p-3 text-left"
      >
        {/* Header: rank chip + total time + expand affordance */}
        <div className="flex min-w-0 items-center gap-2">
          <RankBadge rank={d.rank} severity={d.severity} />
          <span className="min-w-0 truncate text-[11px] text-muted-foreground">
            {formatCompactNumber(d.cnt)} runs
          </span>
          <ExpandIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </div>

        {/* SQL hero — the focus of the card */}
        <div className="min-w-0 rounded-md border border-border/50 bg-muted/60 p-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
            <Code2 className="size-3 shrink-0" />
            Query fingerprint
          </div>
          <pre className="m-0 line-clamp-4 whitespace-pre-wrap break-words font-mono text-[0.8rem] leading-relaxed text-foreground">
            {d.query}
          </pre>
        </div>

        {/* Key cost metrics */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {formatDuration(d.queriesDuration).value}{' '}
            {formatDuration(d.queriesDuration).unit}
          </span>
          <span className="inline-flex items-center gap-1">
            <Cpu className="size-3" />
            {cpu.value} {cpu.unit}
          </span>
          <span className="inline-flex items-center gap-1">
            <MemoryStick className="size-3" />
            {d.readableMemory}
          </span>
          <span className="inline-flex items-center gap-1">
            <HardDrive className="size-3" />
            {formatCompactNumber(d.readRows)} rows
          </span>
        </div>

        <TotalTimeCell d={d} max={maxDuration} />
      </button>

      {expanded && <ExpandedRow d={d} />}
    </div>
  )
})

// ViewToggle is imported from @/components/query-tables/view-toggle

interface ExpensiveQueriesTableProps {
  rows: ExpensiveQueryRow[]
}

/**
 * ExpensiveQueriesTable — a dense, sortable, responsive view of the most
 * expensive ClickHouse query fingerprints over the last 24h.
 *
 * Highlights the worst offenders with rank badges (#1, #2 …) and a severity
 * heat accent. The toolbar carries search, a severity (heat) segment, a
 * "more filters" popover (minimum runs / total time), a column-visibility
 * menu and CSV export. Columns collapse progressively as the viewport
 * narrows; hidden values reappear inline under the query text. Rows expand to
 * a full secondary-metric panel + full-query dialog.
 */
export const ExpensiveQueriesTable = memo(function ExpensiveQueriesTable({
  rows,
}: ExpensiveQueriesTableProps) {
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState<SeverityFilter>('all')
  const [minRuns, setMinRuns] = useState(0)
  const [minDurationSecs, setMinDurationSecs] = useState(0)
  const [hiddenColumns, setHiddenColumns] = useState<Set<OptionalColumn>>(
    () => new Set()
  )
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const isMobile = useIsMobile()
  const [userView, setUserView] = useState<'table' | 'cards' | null>(null)
  const view = userView ?? (isMobile ? 'cards' : 'table')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // The server returns rows already ordered most-expensive-first; rank is
  // assigned here so the "#1 / #2 …" badges reflect that native order and
  // survive any client-side re-sorting / filtering below.
  const derived = useMemo(() => rows.map(derive), [rows])

  const maxDuration = useMemo(
    () => derived.reduce((m, d) => Math.max(m, d.queriesDuration), 0),
    [derived]
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = derived.filter((d) => {
      if (severity === 'critical' && d.severity !== 'critical') return false
      if (severity === 'warning' && d.severity === 'normal') return false
      if (minRuns > 0 && d.cnt < minRuns) return false
      if (minDurationSecs > 0 && d.queriesDuration < minDurationSecs)
        return false
      if (q) return d.query.toLowerCase().includes(q)
      return true
    })
    const accessor = SORT_ACCESSOR[sortKey]
    return [...filtered].sort((a, b) => {
      const cmp = accessor(a) - accessor(b)
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [derived, search, severity, minRuns, minDurationSecs, sortKey, sortDir])

  const moreFiltersActive = minRuns > 0 || minDurationSecs > 0
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
      setSortDir(k === 'rank' ? 'asc' : 'desc')
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
            placeholder="Search query…"
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

        {/* Severity (heat) segment */}
        <SeverityFilterBar value={severity} onChange={setSeverity} />

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
          <PopoverContent align="start" className="w-64 space-y-3">
            <div>
              <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Minimum runs
              </p>
              <div className="flex flex-wrap gap-1">
                {[0, 10, 100, 1000].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMinRuns(n)}
                    className={cn(
                      'rounded-md border px-2 py-1 text-[11.5px] font-medium tabular-nums transition-colors',
                      minRuns === n
                        ? 'border-border bg-muted text-foreground'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {n === 0 ? 'Any' : `${formatCompactNumber(n)}+`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Minimum total time
              </p>
              <div className="flex flex-wrap gap-1">
                {[0, 5, 30, 60].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMinDurationSecs(n)}
                    className={cn(
                      'rounded-md border px-2 py-1 text-[11.5px] font-medium tabular-nums transition-colors',
                      minDurationSecs === n
                        ? 'border-border bg-muted text-foreground'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {n === 0 ? 'Any' : `${n}s+`}
                  </button>
                ))}
              </div>
            </div>
            {moreFiltersActive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-full text-[12px]"
                onClick={() => {
                  setMinRuns(0)
                  setMinDurationSecs(0)
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
            onClick={() => downloadExpensiveCsv(visible)}
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
          data-testid="expensive-queries-cards"
        >
          {visible.map((d) => (
            <QueryCard
              key={d.key}
              d={d}
              maxDuration={maxDuration}
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
          the metric columns off-screen; `min-w` keeps columns legible on
          phones (the wrapper scrolls horizontally below it). */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] table-fixed border-collapse">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <SortableHeader
                  width="84px"
                  sortKey="rank"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                >
                  Rank
                </SortableHeader>
                <SortableHeader>Query</SortableHeader>
                <SortableHeader
                  width="140px"
                  sortKey="duration"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                >
                  Total time
                </SortableHeader>
                {headerFor('cnt') && (
                  <SortableHeader
                    align="right"
                    width="80px"
                    className="hidden sm:table-cell"
                    sortKey="cnt"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  >
                    Runs
                  </SortableHeader>
                )}
                {headerFor('cpu') && (
                  <SortableHeader
                    align="right"
                    width="96px"
                    className="hidden lg:table-cell"
                    sortKey="cpu"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  >
                    CPU time
                  </SortableHeader>
                )}
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
                {headerFor('readRows') && (
                  <SortableHeader
                    align="right"
                    width="92px"
                    className="hidden xl:table-cell"
                    sortKey="readRows"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  >
                    Rows read
                  </SortableHeader>
                )}
                <SortableHeader width="72px" align="right">
                  <span className="sr-only">Actions</span>
                </SortableHeader>
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => (
                <QueryRow
                  key={d.key}
                  d={d}
                  maxDuration={maxDuration}
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
        of <span className="tabular-nums">{rows.length}</span> expensive{' '}
        {rows.length === 1 ? 'query' : 'queries'} · last 24h
      </div>
    </div>
  )
})
