'use client'

import { ArrowRight, CheckCircle2, Clock, User as UserIcon } from 'lucide-react'

import { memo, useMemo } from 'react'
import { AppLink as Link } from '@/components/ui/app-link'
import {
  formatCompactNumber,
  formatReadableSecondDuration,
  formatReadableSize,
} from '@/lib/format-readable'
import { useHostId } from '@/lib/swr/use-host'
import { buildUrl } from '@/lib/url/url-builder'
import { cn } from '@/lib/utils'

/**
 * Shape of a single `system.query_log` row as returned by the
 * `history-queries` table API (see {@link historyQueriesConfig}). Only the
 * fields this table reads are typed; the index signature keeps it tolerant of
 * the extra columns the config selects.
 */
export interface CompletedQueryRow {
  query_id: string
  query: string
  query_kind?: string
  type?: string
  user?: string
  event_time?: string
  query_duration_ms?: number
  query_duration?: number
  read_rows?: number
  readable_read_rows?: string
  written_rows?: number
  readable_written_rows?: string
  memory_usage?: number
  readable_memory_usage?: string
  client_name?: string
  [key: string]: unknown
}

/** Toned chip class per query kind — mirrors the running-queries table. */
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

/** Format the `event_time` string as a short clock label. */
function formatTime(value: unknown): string {
  if (!value) return '—'
  const text = String(value)
  // `event_time` arrives as `YYYY-MM-DD HH:MM:SS` — show just the clock part.
  const match = text.match(/\d{2}:\d{2}:\d{2}/)
  return match ? match[0] : text
}

interface DerivedCompleted {
  id: string
  key: string
  kind: string
  query: string
  user: string
  time: string
  duration: string
  readRows: string
  memory: string
  failed: boolean
}

function derive(row: CompletedQueryRow): DerivedCompleted {
  const id = String(row.query_id ?? '')
  const durationSeconds =
    row.query_duration ??
    (row.query_duration_ms != null ? row.query_duration_ms / 1000 : 0)
  return {
    id,
    // event_time disambiguates the QueryStart/QueryFinish pair that shares a
    // query_id, so the same query never collides in the keyed list.
    key: id ? `${id}|${String(row.event_time ?? '')}` : String(row.query ?? ''),
    kind: row.query_kind || 'Query',
    query: String(row.query ?? ''),
    user: String(row.user ?? ''),
    time: formatTime(row.event_time),
    duration: formatReadableSecondDuration(Number(durationSeconds) || 0),
    readRows:
      row.readable_read_rows || formatCompactNumber(Number(row.read_rows ?? 0)),
    memory:
      row.readable_memory_usage ||
      formatReadableSize(Number(row.memory_usage ?? 0)),
    failed:
      row.type === 'ExceptionWhileProcessing' ||
      row.type === 'ExceptionBeforeStart',
  }
}

interface CompletedQueryRowProps {
  d: DerivedCompleted
  justFinished: boolean
}

const CompletedRow = memo(function CompletedRow({
  d,
  justFinished,
}: CompletedQueryRowProps) {
  const hostId = useHostId()
  const detailUrl = d.id
    ? `/query?query_id=${encodeURIComponent(d.id)}&host=${hostId}`
    : ''

  return (
    <tr
      className={cn(
        'border-b border-border align-middle transition-colors hover:bg-muted/60',
        // Newly-finished queries flash in with an emerald tint so the
        // running → completed transition reads as live.
        justFinished &&
          'animate-in bg-emerald-50/70 fade-in-0 slide-in-from-top-1 duration-500 dark:bg-emerald-950/20'
      )}
    >
      {/* Type */}
      <td className="px-2 py-2.5 sm:px-3">
        <div className="flex items-center gap-1.5">
          {justFinished && (
            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
          )}
          <KindBadge kind={d.kind} />
        </div>
      </td>

      {/* Query + meta */}
      <td className="min-w-0 px-2 py-2.5">
        <span
          className="block min-w-0 truncate font-mono text-[11.5px] text-foreground sm:text-[12px]"
          title={d.query}
        >
          {d.query}
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] text-muted-foreground">
          {detailUrl ? (
            <Link
              href={detailUrl}
              className="inline-flex items-center gap-1 font-mono transition-colors hover:text-foreground"
            >
              #{d.id.slice(0, 8)}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 font-mono">
              #n/a
            </span>
          )}
          {d.user && (
            <span className="inline-flex items-center gap-1">
              <UserIcon className="size-3" />
              {d.user}
            </span>
          )}
          {d.failed && (
            <span className="inline-flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
              Failed
            </span>
          )}
        </div>
      </td>

      {/* Time — always visible */}
      <td className="whitespace-nowrap px-2 py-2.5 text-right text-[12px] tabular-nums text-muted-foreground sm:px-3">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" />
          {d.time}
        </span>
      </td>

      {/* Duration — sm+ */}
      <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums sm:table-cell">
        {d.duration}
      </td>

      {/* Rows read — md+ */}
      <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums md:table-cell">
        {d.readRows}
      </td>

      {/* Memory — lg+ */}
      <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[12px] tabular-nums lg:table-cell">
        {d.memory}
      </td>
    </tr>
  )
})

interface CompletedQueriesTableProps {
  rows: CompletedQueryRow[]
  /** query_ids observed running on the previous poll but gone on this one. */
  justFinishedIds: Set<string>
  /** Auto-refresh cadence label, e.g. "5s". */
  refreshLabel?: string
}

/**
 * CompletedQueriesTable — a compact, read-only list of recently-finished
 * queries pulled from `system.query_log` (QueryFinish, recent window).
 *
 * Queries that just left the live `system.processes` list (their query_id was
 * present on the previous poll but absent now) are highlighted as
 * "just finished" so the running → completed handoff reads as live, even
 * before the query_log row materializes. A "view all in history" link points
 * to the full {@link historyQueriesConfig} page.
 */
export const CompletedQueriesTable = memo(function CompletedQueriesTable({
  rows,
  justFinishedIds,
  refreshLabel,
}: CompletedQueriesTableProps) {
  const hostId = useHostId()
  const derived = useMemo(() => rows.map(derive), [rows])

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <span className="text-[13px] font-medium">Recently completed</span>
        <span className="text-[12px] text-muted-foreground">
          {refreshLabel
            ? `Finished queries · last few minutes · refreshes every ${refreshLabel}`
            : 'Finished queries · last few minutes'}
        </span>
        <Link
          href={buildUrl('/history-queries', { host: hostId })}
          className="group ml-auto inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all in history
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] table-fixed border-collapse">
          <thead className="border-b border-border bg-muted/40">
            <tr className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th
                className="px-2 py-2 text-left sm:px-3"
                style={{ width: '96px' }}
              >
                Type
              </th>
              <th className="px-2 py-2 text-left">Query</th>
              <th
                className="px-2 py-2 text-right sm:px-3"
                style={{ width: '92px' }}
              >
                Finished
              </th>
              <th
                className="hidden px-3 py-2 text-right sm:table-cell"
                style={{ width: '96px' }}
              >
                Duration
              </th>
              <th
                className="hidden px-3 py-2 text-right md:table-cell"
                style={{ width: '92px' }}
              >
                Rows read
              </th>
              <th
                className="hidden px-3 py-2 text-right lg:table-cell"
                style={{ width: '92px' }}
              >
                Memory
              </th>
            </tr>
          </thead>
          <tbody>
            {derived.map((d) => (
              <CompletedRow
                key={d.key}
                d={d}
                justFinished={Boolean(d.id) && justFinishedIds.has(d.id)}
              />
            ))}
            {derived.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-[13px] text-muted-foreground"
                >
                  No queries finished in the last few minutes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
})
