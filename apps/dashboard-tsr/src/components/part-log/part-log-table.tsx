import {
  ChevronRight,
  Copy,
  ExternalLink,
  Merge,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  ZoomIn,
} from 'lucide-react'

import type { PartLogRow, Tone } from './lib'

import {
  EVENT_TONE,
  num,
  REASON_TONE,
  relativeAgo,
  TONE_BADGE,
  TONE_COLOR,
  tableTone,
  timeOfDay,
} from './lib'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buildUrl } from '@/lib/url/url-builder'
import { cn } from '@/lib/utils'

// ───────────────────────── quick filters ─────────────────────────

interface QuickFilter {
  key: string
  label: string
  test: (r: PartLogRow) => boolean
}

const QUICK_FILTERS: QuickFilter[] = [
  { key: 'new', label: 'New parts', test: (r) => r.event_type === 'NewPart' },
  {
    key: 'merge',
    label: 'Merges',
    test: (r) => r.event_type.startsWith('Merge'),
  },
  {
    key: 'mutate',
    label: 'Mutations',
    test: (r) => r.event_type.startsWith('Mutate'),
  },
  {
    key: 'remove',
    label: 'Removals',
    test: (r) => r.event_type === 'RemovePart',
  },
  {
    key: 'move',
    label: 'Moves & downloads',
    test: (r) => r.event_type === 'MovePart' || r.event_type === 'DownloadPart',
  },
  {
    key: 'ttl',
    label: 'TTL merges',
    test: (r) => r.merge_reason.startsWith('TTL'),
  },
  {
    key: 'big',
    label: '> 100 MiB',
    test: (r) => num(r.size_in_bytes) >= 100 * 1024 * 1024,
  },
  {
    key: 'analytics',
    label: 'analytics.*',
    test: (r) => r.database === 'analytics',
  },
]

// ───────────────────────── sorting ─────────────────────────

type SortKey = 'time' | 'event_type' | 'table' | 'size'
interface SortState {
  key: SortKey
  dir: 'asc' | 'desc'
}

const SORT_VALUE: Record<SortKey, (r: PartLogRow) => number | string> = {
  time: (r) => num(r.event_unixtime),
  event_type: (r) => r.event_type,
  table: (r) => r.table,
  size: (r) => num(r.size_in_bytes),
}

// ───────────────────────── small UI bits ─────────────────────────

function Badge({
  tone,
  children,
  className,
}: {
  tone: Tone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-md border px-1.5 py-0.5 text-[11px]',
        TONE_BADGE[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

function ThSort({
  children,
  align = 'left',
  sortKey,
  sort,
  onSort,
  className,
  style,
}: {
  children?: React.ReactNode
  align?: 'left' | 'right'
  sortKey?: SortKey
  sort: SortState
  onSort: (k: SortKey) => void
  className?: string
  style?: React.CSSProperties
}) {
  const active = sortKey && sort.key === sortKey
  return (
    <th
      className={cn(
        'select-none whitespace-nowrap px-2 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground sm:px-3',
        align === 'right' ? 'text-right' : 'text-left',
        className
      )}
      style={style}
    >
      {sortKey ? (
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          className={cn(
            'inline-flex items-center gap-1 hover:text-foreground',
            align === 'right' && 'flex-row-reverse'
          )}
        >
          {children}
          <ChevronRight
            className={cn(
              'size-3 transition-transform',
              active ? 'opacity-100' : 'opacity-40',
              active && sort.dir === 'desc' ? 'rotate-90' : '-rotate-90'
            )}
          />
        </button>
      ) : (
        children
      )}
    </th>
  )
}

// ───────────────────────── expanded row ─────────────────────────

function ExpandedRow({ row, hostId }: { row: PartLogRow; hostId: number }) {
  const fields: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Part name', value: row.part_name, mono: true },
    { label: 'Table', value: row.table, mono: true },
    { label: 'Partition', value: row.partition_id, mono: true },
    { label: 'Event type', value: row.event_type },
    { label: 'Merge reason', value: row.merge_reason },
    { label: 'Part type', value: row.part_type || '—' },
    { label: 'Part level', value: String(row.part_level) },
    { label: 'Rows', value: row.readable_rows },
    { label: 'Size on disk', value: row.readable_size },
    {
      label: 'Duration',
      value: num(row.duration_ms) ? row.readable_duration : '—',
    },
    { label: 'Peak memory', value: row.readable_peak_memory },
    { label: 'Event time', value: row.event_time },
  ]

  const copyName = () => {
    void navigator.clipboard?.writeText(row.part_name)
  }

  return (
    <div className="space-y-3 border-t border-border bg-muted/40 px-3 py-3.5 sm:px-5">
      {row.event_type.startsWith('Merge') &&
        row.merge_reason !== 'NotAMerge' && (
          <div className="rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-[11.5px] text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-80">
              <Merge className="size-3" />
              Merge composition
            </div>
            Produced a level-
            <span className="font-mono font-semibold">
              {String(row.part_level)}
            </span>{' '}
            part · {row.readable_size} written
            {num(row.duration_ms) > 0 ? <> in {row.readable_duration}</> : null}{' '}
            · reason{' '}
            <span className="font-mono font-semibold">{row.merge_reason}</span>
          </div>
        )}

      {Number(row.error) > 0 && row.exception && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 font-mono text-[11px] text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <div className="mb-1 font-sans text-[10px] font-semibold uppercase tracking-wider opacity-80">
            Exception
          </div>
          {row.exception}
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Part details
        </div>
        <dl className="grid grid-cols-2 text-[11.5px] sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {fields.map((f) => (
            <div
              key={f.label}
              className="-ml-px -mt-px min-w-0 border-l border-t border-border px-3 py-1.5"
            >
              <dt className="text-[10px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground">
                {f.label}
              </dt>
              <dd
                className={cn(
                  'truncate text-[12px] font-medium tabular-nums',
                  f.mono && 'font-mono'
                )}
                title={f.value}
              >
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="default"
          size="sm"
          className="h-7 gap-1.5 text-[11.5px]"
          asChild
        >
          <a
            href={buildUrl('/tables', {
              host: hostId,
              database: row.database,
              table: row.table_name,
            })}
          >
            <ZoomIn className="size-3" />
            Inspect part
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-[11.5px]"
          onClick={copyName}
        >
          <Copy className="size-3" />
          Copy part name
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-[11.5px]"
          asChild
        >
          <a href={buildUrl('/merges', { host: hostId })}>
            <Merge className="size-3" />
            Merge tree
          </a>
        </Button>
        <div className="ml-auto" />
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-[11.5px]"
          asChild
        >
          <a
            href={buildUrl('/tables', {
              host: hostId,
              database: row.database,
              table: row.table_name,
            })}
          >
            <ExternalLink className="size-3" />
            Open in Tables
          </a>
        </Button>
      </div>
    </div>
  )
}

// ───────────────────────── row ─────────────────────────

function Row({
  row,
  maxSize,
  expanded,
  onToggle,
  hostId,
  nowSeconds,
}: {
  row: PartLogRow
  maxSize: number
  expanded: boolean
  onToggle: () => void
  hostId: number
  nowSeconds: number
}) {
  const eventTone = EVENT_TONE[row.event_type] ?? 'neutral'
  const reasonColor = TONE_COLOR[REASON_TONE[row.merge_reason] ?? 'neutral']
  const size = num(row.size_in_bytes)
  const barPct = maxSize > 0 ? Math.max(3, (size / maxSize) * 100) : 0
  const barColor =
    size >= 100 * 1024 * 1024
      ? TONE_COLOR.violet
      : size >= 1024 * 1024
        ? TONE_COLOR.blue
        : TONE_COLOR.green

  return (
    <>
      <tr
        className="group cursor-pointer border-b border-border align-middle hover:bg-muted/40"
        onClick={onToggle}
      >
        <td className="whitespace-nowrap px-2 py-2.5 align-middle sm:px-3">
          <div className="flex items-center gap-2">
            <ChevronRight
              className={cn(
                'size-3 shrink-0 text-muted-foreground transition-transform',
                expanded && 'rotate-90'
              )}
            />
            <div>
              <div className="font-mono text-[12px] tabular-nums">
                {timeOfDay(row.event_time)}
              </div>
              <div className="text-[10px] tabular-nums text-muted-foreground">
                {relativeAgo(num(row.event_unixtime), nowSeconds)}
              </div>
            </div>
          </div>
        </td>

        <td className="whitespace-nowrap px-2 py-2.5 align-middle">
          <Badge tone={eventTone} className="font-mono font-semibold">
            {row.event_type}
          </Badge>
        </td>

        <td className="min-w-0 px-2 py-2.5 align-middle">
          <Badge tone={tableTone(row.table)} className="font-mono">
            <span className="truncate">{row.table}</span>
          </Badge>
          <div className="mt-1 truncate font-mono text-[10.5px] text-muted-foreground lg:hidden">
            {row.part_name}
          </div>
        </td>

        <td className="hidden min-w-0 px-2 py-2.5 align-middle lg:table-cell">
          <span
            className="block truncate font-mono text-[11.5px]"
            title={row.part_name}
          >
            {row.part_name}
          </span>
        </td>

        <td className="hidden whitespace-nowrap px-2 py-2.5 align-middle sm:px-3 xl:table-cell">
          <span className="font-mono text-[11.5px] text-muted-foreground">
            {row.partition_id}
          </span>
        </td>

        <td className="hidden whitespace-nowrap px-2 py-2.5 align-middle sm:px-3 md:table-cell">
          <span className="inline-flex items-center gap-1.5 text-[11.5px]">
            <span
              className="size-1.5 rounded-full"
              style={{ background: reasonColor }}
            />
            {row.merge_reason}
          </span>
        </td>

        <td className="whitespace-nowrap px-2 py-2.5 text-right align-middle sm:px-3">
          <div className="inline-flex items-center justify-end gap-1.5">
            <div className="hidden h-1 w-12 overflow-hidden rounded-full bg-muted sm:block">
              <div
                className="h-full"
                style={{ width: `${barPct}%`, background: barColor }}
              />
            </div>
            <span
              className={cn(
                'text-[12px] tabular-nums',
                size >= 100 * 1024 * 1024 && 'font-semibold'
              )}
            >
              {row.readable_size}
            </span>
          </div>
        </td>

        <td className="px-1.5 py-2.5 align-middle sm:px-3">
          <div className="flex items-center justify-end gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              title="Copy part name"
              onClick={(e) => {
                e.stopPropagation()
                void navigator.clipboard?.writeText(row.part_name)
              }}
              className="hidden size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground md:inline-flex"
            >
              <Copy className="size-3" />
            </button>
            <button
              type="button"
              title="Details"
              onClick={onToggle}
              className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <ExpandedRow row={row} hostId={hostId} />
          </td>
        </tr>
      )}
    </>
  )
}

// ───────────────────────── main table ─────────────────────────

const SORT_PRESETS: { label: string; key: SortKey; dir: 'asc' | 'desc' }[] = [
  { label: 'Newest', key: 'time', dir: 'desc' },
  { label: 'Oldest', key: 'time', dir: 'asc' },
  { label: 'Largest', key: 'size', dir: 'desc' },
  { label: 'Most rows', key: 'size', dir: 'asc' },
]

export function PartLogTable({
  rows,
  hostId,
}: {
  rows: PartLogRow[]
  hostId: number
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<SortState>({ key: 'time', dir: 'desc' })
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())

  const nowSeconds = useMemo(() => Math.floor(Date.now() / 1000), [])

  const toggleRow = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleFilter = (k: string) =>
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })

  const onSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'time' ? 'desc' : 'desc' }
    )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filters = QUICK_FILTERS.filter((f) => activeFilters.has(f.key))
    const out = rows.filter((r) => {
      if (q) {
        const hay =
          `${r.part_name} ${r.table} ${r.event_type} ${r.partition_id}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      for (const f of filters) if (!f.test(r)) return false
      return true
    })
    const value = SORT_VALUE[sort.key]
    out.sort((a, b) => {
      const av = value(a)
      const bv = value(b)
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv))
      return sort.dir === 'desc' ? -cmp : cmp
    })
    return out
  }, [rows, search, activeFilters, sort])

  const maxSize = useMemo(
    () => Math.max(...rows.map((r) => num(r.size_in_bytes)), 1),
    [rows]
  )

  const rowKey = (r: PartLogRow, i: number) =>
    `${r.event_time}-${r.part_name}-${r.event_type}-${i}`

  return (
    <div className="flex flex-col gap-3">
      {/* search + quick filters */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-2.5 py-2.5 sm:px-3">
          <div className="relative flex min-w-[200px] flex-1 items-center">
            <Search className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search part name, table, event type, partition…"
              className="h-9 pl-8 text-[13px]"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <SlidersHorizontal className="size-3.5" />
            Advanced
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-2.5 py-2.5 sm:px-3">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Quick filters
          </span>
          {QUICK_FILTERS.map((f) => {
            const on = activeFilters.has(f.key)
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => toggleFilter(f.key)}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] font-medium transition-colors',
                  on
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {f.label}
              </button>
            )
          })}
          {activeFilters.size > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilters(new Set())}
              className="ml-auto text-[11.5px] text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-[12px]">
          <span className="font-semibold">Events</span>
          <span className="tabular-nums text-muted-foreground">
            · {filtered.length} of {rows.length} shown
          </span>
          <div className="flex-1" />
          <div className="hidden items-center gap-0.5 rounded-md bg-muted p-0.5 sm:flex">
            {SORT_PRESETS.map((p) => {
              const active = sort.key === p.key && sort.dir === p.dir
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setSort({ key: p.key, dir: p.dir })}
                  className={cn(
                    'h-7 rounded px-2.5 text-[11.5px] font-medium',
                    active
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse"
            style={{ tableLayout: 'fixed' }}
          >
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <ThSort
                  sortKey="time"
                  sort={sort}
                  onSort={onSort}
                  style={{ width: '132px' }}
                >
                  Event time
                </ThSort>
                <ThSort
                  sortKey="event_type"
                  sort={sort}
                  onSort={onSort}
                  style={{ width: '150px' }}
                >
                  Event type
                </ThSort>
                <ThSort
                  sortKey="table"
                  sort={sort}
                  onSort={onSort}
                  style={{ width: '220px' }}
                >
                  Table
                </ThSort>
                <ThSort
                  sort={sort}
                  onSort={onSort}
                  className="hidden lg:table-cell"
                >
                  Part name
                </ThSort>
                <ThSort
                  sort={sort}
                  onSort={onSort}
                  className="hidden xl:table-cell"
                  style={{ width: '96px' }}
                >
                  Partition
                </ThSort>
                <ThSort
                  sort={sort}
                  onSort={onSort}
                  className="hidden md:table-cell"
                  style={{ width: '150px' }}
                >
                  Merge reason
                </ThSort>
                <ThSort
                  align="right"
                  sortKey="size"
                  sort={sort}
                  onSort={onSort}
                  style={{ width: '140px' }}
                >
                  Size
                </ThSort>
                <ThSort
                  sort={sort}
                  onSort={onSort}
                  className="text-right"
                  style={{ width: '64px' }}
                />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const id = rowKey(row, i)
                return (
                  <Row
                    key={id}
                    row={row}
                    maxSize={maxSize}
                    expanded={expanded.has(id)}
                    onToggle={() => toggleRow(id)}
                    hostId={hostId}
                    nowSeconds={nowSeconds}
                  />
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-[13px] text-muted-foreground"
                  >
                    No part events match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-[11.5px] text-muted-foreground">
          <div>
            Showing{' '}
            <span className="font-medium tabular-nums text-foreground">
              {filtered.length}
            </span>{' '}
            of <span className="tabular-nums">{rows.length}</span> loaded events
          </div>
        </div>
      </div>
    </div>
  )
}
