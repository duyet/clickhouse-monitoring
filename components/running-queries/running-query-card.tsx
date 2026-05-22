'use client'

import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  BotMessageSquare,
  Check,
  ChevronDown,
  CircleX,
  Clock,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  GitMerge,
  HardDrive,
  Hash,
  Layers,
  Loader2,
  MemoryStick,
  Network,
  ScanSearch,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { memo, useCallback, useMemo, useState } from 'react'
import { CodeDialogFormat } from '@/components/data-table/cells/code-dialog-format'
import { MetricSparkline } from '@/components/running-queries/metric-sparkline'
import { AppLink as Link } from '@/components/ui/app-link'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { buildExplorerQueryUrl } from '@/lib/explorer-url'
import {
  formatReadableSecondDuration,
  formatReadableSize,
} from '@/lib/format-readable'
import { getRunningQueryHistory } from '@/lib/running-queries/metrics-history'
import { useActions } from '@/lib/swr'
import { useHostId } from '@/lib/swr/use-host'
import { cn } from '@/lib/utils'

/**
 * Shape of a single `system.processes` row as returned by the
 * `running-queries` table API. Only the fields the card reads are typed;
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
  http_user_agent?: string
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
  pct_memory_usage?: number
  peak_threads_usage?: number
  thread_count?: number
  thread_ids?: unknown[]
  pct_progress?: number
  estimated_remaining_time?: number | null
  launched_merges?: string
  ProfileEvents?: Record<string, number>
  [key: string]: unknown
}

type Severity = 'critical' | 'warning' | 'normal'

/** Classify a query by how long it has been running (seconds). */
function getSeverity(elapsed: number): Severity {
  if (elapsed > 30) return 'critical'
  if (elapsed > 5) return 'warning'
  return 'normal'
}

/** Color the query-kind chip so SELECT/INSERT/DDL are scannable at a glance. */
function kindClass(kind?: string): string {
  switch (kind) {
    case 'Select':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    case 'Insert':
      return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    case 'Create':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    case 'Alter':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
    case 'Drop':
    case 'Delete':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    default:
      return 'bg-muted text-muted-foreground'
  }
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

/** Render CPU time (given in microseconds) at an appropriate scale. */
function formatCpuTime(micros: number): string {
  if (micros <= 0) return '0s'
  const seconds = micros / 1e6
  if (seconds < 1) return `${Math.round(micros / 1000)}ms`
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  return formatReadableSecondDuration(Math.round(seconds))
}

const SEVERITY_CARD: Record<Severity, string> = {
  critical: 'border-l-2 border-l-red-500 bg-red-50/40 dark:bg-red-950/15',
  warning: 'border-l-2 border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/15',
  normal: '',
}

/** Live-status dot color, keyed to the same severity scale. */
const SEVERITY_DOT: Record<Severity, string> = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  normal: 'bg-emerald-500',
}

const SEVERITY_ELAPSED: Record<Severity, string> = {
  critical: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  normal: 'text-foreground',
}

/** A compact metric tile: icon + label, value, optional sub-value. */
function MetricTile({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  accent?: string
}) {
  return (
    <div className="flex min-w-[100px] flex-1 flex-col gap-0.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5">
      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
        <Icon className="size-3" />
        {label}
      </span>
      <span
        className={cn(
          'truncate text-[13px] font-semibold leading-tight tabular-nums',
          accent
        )}
      >
        {value}
      </span>
      {sub ? (
        <span className="truncate text-[10px] leading-tight tabular-nums text-muted-foreground/80">
          {sub}
        </span>
      ) : null}
    </div>
  )
}

/** A labelled value used in the expandable detail grid. */
function DetailField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
        {label}
      </span>
      <span className="truncate font-mono text-xs text-foreground/90">
        {children || '—'}
      </span>
    </div>
  )
}

/** A small pulsing dot that signals the card is a live, in-flight query. */
function LiveDot({ severity }: { severity: Severity }) {
  return (
    <span
      className="relative flex size-2 shrink-0"
      title="Query is running"
      aria-hidden="true"
    >
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
          SEVERITY_DOT[severity]
        )}
      />
      <span
        className={cn(
          'relative inline-flex size-2 rounded-full',
          SEVERITY_DOT[severity]
        )}
      />
    </span>
  )
}

interface RunningQueryCardProps {
  row: RunningQueryRow
}

/**
 * RunningQueryCard — one running query rendered as a rich row-card.
 *
 * Layout (top to bottom): query metadata → SQL → progress bar → metrics
 * grid + actions → centered details toggle. Query content comes first;
 * actions sit last. Long-running queries get a colored left border, and
 * the deepest attributes live behind the collapsed detail grid.
 */
export const RunningQueryCard = memo(function RunningQueryCard({
  row,
}: RunningQueryCardProps) {
  const hostId = useHostId()
  const { killQuery } = useActions()
  const [isKilling, setIsKilling] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const queryId = String(row.query_id ?? '')
  const query = String(row.query ?? '')
  const elapsed = Number(row.elapsed ?? 0)
  const severity = getSeverity(elapsed)

  const isSelect = row.query_kind === 'Select'
  const totalRows = Number(row.total_rows_approx ?? 0)
  const showProgress = isSelect && totalRows > 0
  const pctProgress = Math.min(100, Math.max(0, Number(row.pct_progress ?? 0)))
  const writtenRows = Number(row.written_rows ?? 0)
  const threads =
    Number(row.peak_threads_usage ?? 0) ||
    Number(row.thread_count ?? 0) ||
    (Array.isArray(row.thread_ids) ? row.thread_ids.length : 0)
  const remaining =
    typeof row.estimated_remaining_time === 'number' &&
    row.estimated_remaining_time > 0
      ? formatReadableSecondDuration(Math.round(row.estimated_remaining_time))
      : null

  // Resource metrics
  const memoryUsage = Number(row.memory_usage ?? 0)
  const peakMemory = Number(row.peak_memory_usage ?? 0)
  const readBytes = Number(row.read_bytes ?? 0)
  const writtenBytes = Number(row.written_bytes ?? 0)

  // Rolling memory history for the live sparkline. The history store is
  // refreshed in an effect (one render behind), so append the live value to
  // keep the curve's last point in sync with the headline number.
  const memoryHistory = getRunningQueryHistory(queryId)
  const memorySeries = useMemo(() => {
    const series = memoryHistory.map((sample) => sample.memory)
    if (series[series.length - 1] !== memoryUsage) series.push(memoryUsage)
    return series
  }, [memoryHistory, memoryUsage])

  // CPU + network are only exposed through the ProfileEvents map
  const events = row.ProfileEvents
  const cpuMicros =
    profileEvent(events, 'OSCPUVirtualTimeMicroseconds') ||
    profileEvent(events, 'UserTimeMicroseconds') +
      profileEvent(events, 'SystemTimeMicroseconds')
  const cpuCores = elapsed > 0 ? cpuMicros / 1e6 / elapsed : 0
  const networkBytes =
    profileEvent(events, 'NetworkReceiveBytes') +
    profileEvent(events, 'NetworkSendBytes')
  const mergeCount = profileEvent(events, 'Merge')

  const handleKill = useCallback(async () => {
    if (!queryId) return
    setIsKilling(true)
    try {
      const result = await killQuery(queryId)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to kill query')
    } finally {
      setIsKilling(false)
    }
  }, [killQuery, queryId])

  const handleCopyId = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(queryId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* noop */
    }
  }, [queryId])

  const explorerUrl = buildExplorerQueryUrl(query, hostId)
  const detailUrl = `/query?query_id=${encodeURIComponent(queryId)}&host=${hostId}`

  return (
    <div
      className={cn(
        'group rounded-lg border bg-card transition-colors hover:bg-muted/30',
        SEVERITY_CARD[severity]
      )}
    >
      {/* Row 1 — query metadata */}
      <div className="flex items-center gap-2 px-3 pt-2.5 text-xs">
        <LiveDot severity={severity} />
        <span
          className={cn(
            'rounded px-1.5 py-0.5 font-medium uppercase tracking-wide',
            kindClass(row.query_kind)
          )}
        >
          {row.query_kind || 'Query'}
        </span>
        {row.user && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <UserIcon className="size-3.5 text-muted-foreground/70" />
            {row.user}
          </span>
        )}
        {row.current_database && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Database className="size-3.5 text-muted-foreground/70" />
            {row.current_database}
          </span>
        )}
        {interfaceName(row.interface) && (
          <span className="hidden items-center gap-1 text-muted-foreground sm:inline-flex">
            <Network className="size-3.5 text-muted-foreground/70" />
            {interfaceName(row.interface)}
          </span>
        )}

        <span className="ml-auto inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyId}
            title="Copy query id"
            className="inline-flex items-center gap-1 rounded font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Hash className="size-3" />
            {queryId.slice(0, 8)}
            {copied ? (
              <Check className="size-3 text-green-600" />
            ) : (
              <Copy className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
            )}
          </button>
          <span
            className={cn(
              'inline-flex items-center gap-1 font-semibold tabular-nums',
              SEVERITY_ELAPSED[severity]
            )}
            title={`Running for ${row.readable_elapsed || `${elapsed}s`}`}
          >
            <Clock className="size-3.5" />
            {row.readable_elapsed || `${elapsed}s`}
          </span>
        </span>
      </div>

      {/* Row 2 — the query itself (primary content) */}
      <div className="px-3 py-1.5">
        <CodeDialogFormat
          value={query}
          options={{
            dialog_title: 'Running Query',
            hide_query_comment: true,
            max_truncate: 160,
            force_dialog: true,
            show_query_plan: true,
            trigger_classname: 'w-full min-w-0',
          }}
        />
      </div>

      {/* Row 3 — scan progress (SELECT queries with a known row estimate) */}
      {showProgress && (
        <div className="flex items-center gap-2 px-3 pb-1 text-xs">
          <span className="text-muted-foreground">Progress</span>
          <Progress value={pctProgress} className="h-2 flex-1" />
          <span className="font-semibold tabular-nums">
            {pctProgress.toFixed(0)}%
          </span>
          <span className="hidden text-muted-foreground tabular-nums sm:inline">
            {row.readable_read_rows || '0'} /{' '}
            {row.readable_total_rows_approx || '?'} rows
            {remaining ? ` · ~${remaining} left` : ''}
          </span>
        </div>
      )}

      {/* Live memory chart — sparkline accumulates one point per poll */}
      <div className="flex items-center gap-3 border-t border-border/60 px-3 py-1.5">
        <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
          <MemoryStick className="size-3" />
          Memory
        </span>
        <div className="flex h-7 min-w-0 flex-1 items-center">
          {memorySeries.length >= 2 ? (
            <MetricSparkline
              values={memorySeries}
              height={28}
              className="w-full text-indigo-500 dark:text-indigo-400"
            />
          ) : (
            <span className="text-[10px] text-muted-foreground/50">
              Collecting samples…
            </span>
          )}
        </div>
        <span className="shrink-0 text-right leading-tight">
          <span className="block text-sm font-semibold tabular-nums">
            {formatReadableSize(memoryUsage)}
          </span>
          {peakMemory > memoryUsage && (
            <span className="block text-[10px] tabular-nums text-muted-foreground">
              peak {formatReadableSize(peakMemory)}
            </span>
          )}
        </span>
      </div>

      {/* Row 4 — metrics grid + actions */}
      <div className="flex items-start gap-2 border-t border-border/60 px-3 py-2">
        <div className="flex flex-1 flex-wrap gap-1.5">
          <MetricTile
            icon={Cpu}
            label="CPU"
            value={formatCpuTime(cpuMicros)}
            sub={cpuCores >= 0.05 ? `${cpuCores.toFixed(1)} cores` : undefined}
          />
          <MetricTile
            icon={ArrowDownToLine}
            label="Rows read"
            value={row.readable_read_rows || '0'}
            sub={
              totalRows > 0
                ? `of ${row.readable_total_rows_approx || '?'}`
                : undefined
            }
          />
          <MetricTile
            icon={HardDrive}
            label="Data read"
            value={formatReadableSize(readBytes)}
          />
          <MetricTile icon={Layers} label="Threads" value={threads || '0'} />
          {writtenRows > 0 && (
            <MetricTile
              icon={ArrowUpFromLine}
              label="Written"
              value={row.readable_written_rows || '0'}
              sub={
                writtenBytes > 0 ? formatReadableSize(writtenBytes) : undefined
              }
            />
          )}
          {networkBytes > 0 && (
            <MetricTile
              icon={ArrowLeftRight}
              label="Network"
              value={formatReadableSize(networkBytes)}
            />
          )}
          {mergeCount > 0 && (
            <MetricTile
              icon={GitMerge}
              label="Merges"
              value={row.launched_merges || String(mergeCount)}
            />
          )}
        </div>

        {/* Actions — placed last, on the right */}
        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={handleKill}
                disabled={isKilling || !queryId}
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
                className="size-7 text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href={`/agents?host=${hostId}`}>
                  <BotMessageSquare className="size-3.5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Analyze with AI</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href={explorerUrl}>
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
                className="size-7 text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href={detailUrl}>
                  <ScanSearch className="size-3.5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Query detail</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Row 5 — extended details (collapsed by default) */}
      {expanded && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-border/60 px-3 py-2.5 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Query ID">{queryId}</DetailField>
          <DetailField label="Address">
            {row.address
              ? `${row.address}${row.port ? `:${row.port}` : ''}`
              : undefined}
          </DetailField>
          <DetailField label="Client">{row.client_name}</DetailField>
          <DetailField label="Client host">{row.client_hostname}</DetailField>
          <DetailField label="OS user">{row.os_user}</DetailField>
          <DetailField label="Peak memory">
            {row.readable_peak_memory_usage || formatReadableSize(peakMemory)}
          </DetailField>
          <DetailField label="Total rows (approx)">
            {row.readable_total_rows_approx}
          </DetailField>
          <DetailField label="Data read">
            {formatReadableSize(readBytes)}
          </DetailField>
          <DetailField label="Network I/O">
            {networkBytes > 0 ? formatReadableSize(networkBytes) : undefined}
          </DetailField>
          <DetailField label="Launched merges">
            {row.launched_merges}
          </DetailField>
          <DetailField label="Distributed depth">
            {row.distributed_depth != null
              ? String(row.distributed_depth)
              : undefined}
          </DetailField>
          <DetailField label="Initial query">
            {row.is_initial_query ? 'Yes' : row.initial_query_id || 'No'}
          </DetailField>
        </div>
      )}

      {/* Row 6 — full-width details toggle, centered for an easy click target */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-center gap-1.5 rounded-b-lg border-t border-border/60 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <ChevronDown
          className={cn(
            'size-4 transition-transform',
            expanded && 'rotate-180'
          )}
        />
        {expanded ? 'Hide details' : 'Show details'}
      </button>
    </div>
  )
})
