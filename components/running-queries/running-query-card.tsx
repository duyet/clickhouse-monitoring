'use client'

import {
  ArrowDownToLine,
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
  Gauge,
  Hash,
  Loader2,
  Network,
  ScanSearch,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { memo, useCallback, useState } from 'react'
import { CodeDialogFormat } from '@/components/data-table/cells/code-dialog-format'
import { AppLink as Link } from '@/components/ui/app-link'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { buildExplorerQueryUrl } from '@/lib/explorer-url'
import { formatReadableSecondDuration } from '@/lib/format-readable'
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
  client_name?: string
  initial_query_id?: string
  is_initial_query?: number | boolean
  distributed_depth?: number
  elapsed?: number
  readable_elapsed?: string
  read_rows?: number
  readable_read_rows?: string
  written_rows?: number
  readable_written_rows?: string
  total_rows_approx?: number
  readable_total_rows_approx?: string
  readable_memory_usage?: string
  readable_peak_memory_usage?: string
  pct_memory_usage?: number
  peak_threads_usage?: number
  thread_ids?: unknown[]
  pct_progress?: number
  estimated_remaining_time?: number | null
  launched_merges?: string
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

const SEVERITY_CARD: Record<Severity, string> = {
  critical: 'border-l-red-500 bg-red-50/40 dark:bg-red-950/15',
  warning: 'border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/15',
  normal: 'border-l-transparent',
}

const SEVERITY_ELAPSED: Record<Severity, string> = {
  critical: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  normal: 'text-foreground',
}

/** A compact inline metric: small icon + value. */
function Stat({
  icon: Icon,
  children,
  title,
}: {
  icon: React.ElementType
  children: React.ReactNode
  title: string
}) {
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap"
      title={title}
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground/70" />
      <span className="tabular-nums text-foreground/80">{children}</span>
    </span>
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

interface RunningQueryCardProps {
  row: RunningQueryRow
}

/**
 * RunningQueryCard — one running query rendered as a compact row-card.
 *
 * Layout (top to bottom): query metadata → SQL → metrics + actions.
 * Query content comes first; actions sit last on the right. Long-running
 * queries get a colored left border. Extended attributes are tucked into a
 * collapsed detail grid so the default view stays dense.
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
    (Array.isArray(row.thread_ids) ? row.thread_ids.length : 0)
  const remaining =
    typeof row.estimated_remaining_time === 'number' &&
    row.estimated_remaining_time > 0
      ? formatReadableSecondDuration(Math.round(row.estimated_remaining_time))
      : null

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
        'group rounded-lg border border-l-2 bg-card transition-colors hover:bg-muted/30',
        SEVERITY_CARD[severity]
      )}
    >
      {/* Row 1 — query metadata */}
      <div className="flex items-center gap-2 px-3 pt-2.5 text-xs">
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
            trigger_classname: 'w-full min-w-0',
          }}
        />
      </div>

      {/* Row 3 — metrics + actions */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/60 px-3 py-1.5 text-xs">
        <Stat icon={Gauge} title="Memory usage">
          {row.readable_memory_usage || '0 B'}
        </Stat>
        <Stat icon={ArrowDownToLine} title="Rows read">
          {row.readable_read_rows || '0'} read
        </Stat>
        {writtenRows > 0 && (
          <Stat icon={ArrowUpFromLine} title="Rows written">
            {row.readable_written_rows} written
          </Stat>
        )}
        {threads > 0 && (
          <Stat icon={Cpu} title="Peak threads">
            {threads} {threads === 1 ? 'thread' : 'threads'}
          </Stat>
        )}

        {showProgress && (
          <span
            className="inline-flex min-w-[140px] items-center gap-2"
            title={`Scanned ${pctProgress.toFixed(1)}% of approx. rows`}
          >
            <Progress value={pctProgress} className="h-1.5 w-20" />
            <span className="tabular-nums text-foreground/80">
              {pctProgress.toFixed(0)}%
            </span>
            {remaining && (
              <span className="text-muted-foreground">~{remaining} left</span>
            )}
          </span>
        )}

        {/* Actions — placed last, on the right */}
        <div className="ml-auto flex items-center gap-0.5">
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                aria-label={expanded ? 'Hide details' : 'Show details'}
              >
                <ChevronDown
                  className={cn(
                    'size-3.5 transition-transform',
                    expanded && 'rotate-180'
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {expanded ? 'Hide details' : 'More details'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Row 4 — extended details (collapsed by default) */}
      {expanded && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-border/60 px-3 py-2.5 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Query ID">{queryId}</DetailField>
          <DetailField label="Address">{row.address}</DetailField>
          <DetailField label="Client">{row.client_name}</DetailField>
          <DetailField label="Peak memory">
            {row.readable_peak_memory_usage}
          </DetailField>
          <DetailField label="Total rows (approx)">
            {row.readable_total_rows_approx}
          </DetailField>
          <DetailField label="Launched merges">
            {row.launched_merges}
          </DetailField>
          <DetailField label="Distributed depth">
            {row.distributed_depth != null
              ? String(row.distributed_depth)
              : '—'}
          </DetailField>
          <DetailField label="Initial query">
            {row.is_initial_query ? 'Yes' : row.initial_query_id || 'No'}
          </DetailField>
        </div>
      )}
    </div>
  )
})
