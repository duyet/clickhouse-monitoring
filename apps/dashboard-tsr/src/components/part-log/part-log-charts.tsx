import { HardDrive, Layers, Merge, Sparkles } from 'lucide-react'

import type { PartLogRow } from './lib'

import {
  formatReadableQuantity,
  formatReadableSize,
  lifecycleClass,
  num,
  SIZE_BINS,
  TONE_COLOR,
  tableTone,
} from './lib'
import { REFRESH_INTERVAL } from '@/lib/swr/config'
import { useChartData } from '@/lib/swr/use-chart-data'
import { useHostId } from '@/lib/swr/use-host'
import { cn } from '@/lib/utils'

// ───────────────────────── shared card primitives ─────────────────────────

const cardClass = 'flex flex-col rounded-xl border border-border bg-card p-3.5'
const labelClass =
  'text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground'

function DeltaChip({ text }: { text: string }) {
  const positive = text.startsWith('+')
  const negative = text.startsWith('-')
  return (
    <span
      className={cn(
        'rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums',
        positive &&
          'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
        negative &&
          'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
        !positive && !negative && 'border-border bg-muted text-muted-foreground'
      )}
    >
      {text}
    </span>
  )
}

function Kpi({
  label,
  value,
  unit,
  sub,
  delta,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  unit?: string
  sub: string
  delta?: string
  icon: typeof Sparkles
  accent?: string
}) {
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn(labelClass, 'truncate')}>{label}</span>
        <Icon className="size-3.5 shrink-0 text-muted-foreground/60" />
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span
          className="text-[22px] font-bold leading-none tracking-tight tabular-nums"
          style={accent ? { color: accent } : undefined}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[12px] text-muted-foreground">{unit}</span>
        )}
        {delta && (
          <span className="ml-auto">
            <DeltaChip text={delta} />
          </span>
        )}
      </div>
      <div className="mt-1.5 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  )
}

// ───────────────────────── lifecycle stacked bars (24h) ─────────────────────────

interface LifecyclePoint {
  event_time: string
  new_parts: number
  merges: number
  mutations: number
  removals: number
  [key: string]: unknown
}

const LIFECYCLE_SERIES = [
  { key: 'new_parts', color: TONE_COLOR.green },
  { key: 'merges', color: TONE_COLOR.violet },
  { key: 'mutations', color: TONE_COLOR.amber },
  { key: 'removals', color: TONE_COLOR.rose },
] as const

function LifecycleChart({
  data,
  height = 172,
}: {
  data: LifecyclePoint[]
  height?: number
}) {
  const w = 100
  const h = 100
  const totals = data.map(
    (d) => num(d.new_parts) + num(d.merges) + num(d.mutations) + num(d.removals)
  )
  const max = Math.max(...totals, 1)
  const slot = w / Math.max(data.length, 1)
  const bw = slot * 0.74
  const gap = slot * 0.26
  return (
    <div className="w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="block size-full"
      >
        <title>Part lifecycle events by type, last 24 hours</title>
        {[0.25, 0.5, 0.75].map((p) => (
          <line
            key={p}
            x1="0"
            x2={w}
            y1={h * p + 2}
            y2={h * p + 2}
            stroke="currentColor"
            className="text-border"
            strokeWidth="0.2"
            strokeDasharray="0.6 0.6"
          />
        ))}
        {data.map((d, i) => {
          const x = i * slot + gap / 2
          let y = h - 4
          return (
            <g key={d.event_time || i}>
              {LIFECYCLE_SERIES.map((s) => {
                const hh = (num(d[s.key]) / max) * (h - 8)
                y -= hh
                return (
                  <rect
                    key={s.key}
                    x={x}
                    y={y}
                    width={bw}
                    height={hh}
                    fill={s.color}
                    opacity="0.9"
                    rx="0.3"
                  />
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ───────────────────────── donut ─────────────────────────

interface DonutSegment {
  label: string
  value: number
  color: string
}

function Donut({
  segments,
  size = 132,
  thickness = 16,
  center,
}: {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  center?: { value: string; label: string }
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          stroke="currentColor"
          className="text-muted"
        />
        {segments.map((s) => {
          const len = (s.value / total) * c
          const el = (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={thickness}
              stroke={s.color}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          )
          offset += len
          return el
        })}
      </svg>
      {center && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[19px] font-bold leading-none tabular-nums">
            {center.value}
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            {center.label}
          </div>
        </div>
      )}
    </div>
  )
}

// ───────────────────────── churn bars ─────────────────────────

function ChurnBars({
  rows,
}: {
  rows: { table: string; events: number; color: string }[]
}) {
  const max = Math.max(...rows.map((r) => r.events), 1)
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.table}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 truncate font-mono text-[11.5px]">
              <span
                className="size-1.5 shrink-0 rounded-sm"
                style={{ background: r.color }}
              />
              <span className="truncate">{r.table}</span>
            </span>
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {formatReadableQuantity(r.events)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(r.events / max) * 100}%`,
                background: r.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ───────────────────────── size histogram ─────────────────────────

function SizeHistogram({
  bins,
  height = 146,
}: {
  bins: number[]
  height?: number
}) {
  const w = 100
  const h = 100
  const max = Math.max(...bins, 1)
  const slot = w / Math.max(bins.length, 1)
  const bw = slot * 0.8
  const gap = slot * 0.2
  return (
    <div className="w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="block size-full"
      >
        <title>Part size distribution</title>
        {[0.25, 0.5, 0.75].map((p) => (
          <line
            key={p}
            x1="0"
            x2={w}
            y1={h * p + 2}
            y2={h * p + 2}
            stroke="currentColor"
            className="text-border"
            strokeWidth="0.2"
            strokeDasharray="0.6 0.6"
          />
        ))}
        {bins.map((count, i) => {
          const hh = (count / max) * (h - 8)
          const x = i * slot + gap / 2
          const y = h - 4 - hh
          const fill =
            i <= 1
              ? TONE_COLOR.rose
              : i <= 3
                ? TONE_COLOR.amber
                : i <= 5
                  ? TONE_COLOR.blue
                  : TONE_COLOR.green
          return (
            <rect
              key={SIZE_BINS[i]?.label ?? i}
              x={x}
              y={y}
              width={bw}
              height={hh}
              fill={fill}
              opacity="0.88"
              rx="0.3"
            />
          )
        })}
      </svg>
    </div>
  )
}

// ───────────────────────── derived analytics ─────────────────────────

export interface PartLogKpis {
  totalEvents: number
  tableCount: number
  newParts: number
  newAvgSize: number
  merges: number
  mergeRegularPct: number
  mergeTtlPct: number
  reclaimedBytes: number
  removedParts: number
}

/** Aggregate KPI + chart datasets straight from the loaded part_log rows. */
export function derivePartLogData(rows: PartLogRow[]) {
  const tables = new Set<string>()
  let newParts = 0
  let newSizeSum = 0
  let merges = 0
  let mergeRegular = 0
  let mergeTtl = 0
  let removedParts = 0
  let reclaimedBytes = 0

  const reasonCounts: Record<string, number> = {
    RegularMerge: 0,
    TTLDeleteMerge: 0,
    TTLRecompressMerge: 0,
    NotAMerge: 0,
  }
  const churn = new Map<string, number>()
  const sizeBins = new Array(SIZE_BINS.length).fill(0)
  const sizesBelow64k: number[] = []
  const allSizes: number[] = []

  for (const r of rows) {
    tables.add(r.table)
    const cls = lifecycleClass(r.event_type)
    const size = num(r.size_in_bytes)
    churn.set(r.table, (churn.get(r.table) ?? 0) + 1)

    if (cls === 'new') {
      newParts++
      newSizeSum += size
    }
    if (cls === 'merge') {
      merges++
      if (r.merge_reason === 'RegularMerge') mergeRegular++
      else if (r.merge_reason.startsWith('TTL')) mergeTtl++
    }
    if (cls === 'remove') {
      removedParts++
      reclaimedBytes += size
    }

    if (r.merge_reason in reasonCounts) reasonCounts[r.merge_reason]++

    // size distribution: only count parts that physically exist (have bytes)
    if (size > 0) {
      const binIdx = SIZE_BINS.findIndex((b) => size < b.max)
      sizeBins[binIdx === -1 ? SIZE_BINS.length - 1 : binIdx]++
      allSizes.push(size)
      if (size < 64 * 1024) sizesBelow64k.push(size)
    }
  }

  const kpis: PartLogKpis = {
    totalEvents: rows.length,
    tableCount: tables.size,
    newParts,
    newAvgSize: newParts ? newSizeSum / newParts : 0,
    merges,
    mergeRegularPct: merges ? Math.round((mergeRegular / merges) * 100) : 0,
    mergeTtlPct: merges ? Math.round((mergeTtl / merges) * 100) : 0,
    reclaimedBytes,
    removedParts,
  }

  const churnRows = Array.from(churn.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([table, events]) => ({
      table,
      events,
      color: TONE_COLOR[tableTone(table)],
    }))

  const sortedSizes = [...allSizes].sort((a, b) => a - b)
  const median = sortedSizes.length
    ? sortedSizes[Math.floor(sortedSizes.length / 2)]
    : 0
  const pctBelow64 = allSizes.length
    ? Math.round((sizesBelow64k.length / allSizes.length) * 100)
    : 0

  return {
    kpis,
    reasonCounts,
    churnRows,
    sizeBins,
    sizeMedian: median,
    sizePctBelow64: pctBelow64,
  }
}

// ───────────────────────── main strip ─────────────────────────

function ChartCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn(cardClass, className)}>{children}</div>
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  )
}

export function PartLogCharts({ rows }: { rows: PartLogRow[] }) {
  const hostId = useHostId()
  const lifecycleSwr = useChartData<LifecyclePoint>({
    chartName: 'part-log-lifecycle',
    hostId,
    interval: 'toStartOfHour',
    lastHours: 24,
    refreshInterval: REFRESH_INTERVAL.SLOW_2M,
  })

  const {
    kpis,
    reasonCounts,
    churnRows,
    sizeBins,
    sizeMedian,
    sizePctBelow64,
  } = derivePartLogData(rows)

  const lifecycleData = (lifecycleSwr.data ?? []).map((d) => ({
    event_time: String(d.event_time),
    new_parts: num(d.new_parts),
    merges: num(d.merges),
    mutations: num(d.mutations),
    removals: num(d.removals),
  }))

  const reasonSegments: DonutSegment[] = [
    {
      label: 'Regular',
      value: reasonCounts.RegularMerge,
      color: TONE_COLOR.green,
    },
    {
      label: 'TTL delete',
      value: reasonCounts.TTLDeleteMerge,
      color: TONE_COLOR.amber,
    },
    {
      label: 'TTL recompress',
      value: reasonCounts.TTLRecompressMerge,
      color: TONE_COLOR.violet,
    },
    {
      label: 'Not a merge',
      value: reasonCounts.NotAMerge,
      color: TONE_COLOR.neutral,
    },
  ]
  const mergeTotal =
    reasonCounts.RegularMerge +
    reasonCounts.TTLDeleteMerge +
    reasonCounts.TTLRecompressMerge

  // Pick ~6 evenly-spaced x labels for the lifecycle axis.
  const axisLabels = lifecycleData.filter(
    (_, i) => i % Math.max(1, Math.ceil(lifecycleData.length / 6)) === 0
  )

  return (
    <div className="flex flex-col gap-3">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Total events"
          value={formatReadableQuantity(kpis.totalEvents)}
          sub={`across ${kpis.tableCount} ${kpis.tableCount === 1 ? 'table' : 'tables'}`}
          icon={Layers}
        />
        <Kpi
          label="New parts"
          value={formatReadableQuantity(kpis.newParts)}
          sub={`avg ${formatReadableSize(kpis.newAvgSize)} · inserts`}
          icon={Sparkles}
          accent={TONE_COLOR.green}
        />
        <Kpi
          label="Merges"
          value={formatReadableQuantity(kpis.merges)}
          sub={`${kpis.mergeRegularPct}% regular · ${kpis.mergeTtlPct}% TTL`}
          icon={Merge}
          accent={TONE_COLOR.violet}
        />
        <Kpi
          label="Reclaimed"
          value={formatReadableSize(kpis.reclaimedBytes)}
          sub={`${formatReadableQuantity(kpis.removedParts)} parts removed`}
          icon={HardDrive}
          accent={TONE_COLOR.rose}
        />
      </div>

      {/* Charts row A */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className={labelClass}>Part lifecycle</div>
              <div className="mt-0.5 text-[13px] font-semibold">
                Events by type · last 24 hours
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-muted-foreground">
              <LegendDot color={TONE_COLOR.green} label="New" />
              <LegendDot color={TONE_COLOR.violet} label="Merge" />
              <LegendDot color={TONE_COLOR.amber} label="Mutate" />
              <LegendDot color={TONE_COLOR.rose} label="Remove" />
            </div>
          </div>
          {lifecycleData.length > 0 ? (
            <>
              <LifecycleChart data={lifecycleData} />
              <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted-foreground">
                {axisLabels.map((d) => (
                  <span key={d.event_time}>
                    {d.event_time.match(/(\d{2}):\d{2}/)?.[1] ?? ''}h
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[172px] items-center justify-center text-[12px] text-muted-foreground">
              No lifecycle data in the last 24 hours
            </div>
          )}
        </ChartCard>

        <ChartCard>
          <div className={labelClass}>Merge reasons</div>
          <div className="mb-2 mt-0.5 text-[13px] font-semibold">
            {formatReadableQuantity(mergeTotal)} merges
          </div>
          <div className="flex items-center gap-4">
            <Donut
              segments={reasonSegments.filter((s) => s.label !== 'Not a merge')}
              center={{
                value: formatReadableQuantity(mergeTotal),
                label: 'merges',
              }}
            />
            <div className="min-w-0 flex-1 space-y-2">
              {reasonSegments.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between gap-2 text-[11.5px]"
                >
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <span
                      className="size-2 shrink-0 rounded-sm"
                      style={{ background: s.color }}
                    />
                    <span className="truncate">{s.label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatReadableQuantity(s.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Charts row B */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className={labelClass}>Part churn by table</div>
              <div className="mt-0.5 text-[13px] font-semibold">
                Part events in window
              </div>
            </div>
            <span className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              top {churnRows.length}
            </span>
          </div>
          {churnRows.length > 0 ? (
            <ChurnBars rows={churnRows} />
          ) : (
            <div className="py-6 text-center text-[12px] text-muted-foreground">
              No part events
            </div>
          )}
        </ChartCard>

        <ChartCard>
          <div className={labelClass}>Part size distribution</div>
          <div className="mb-2 mt-0.5 text-[13px] font-semibold">
            median{' '}
            <span className="font-mono">{formatReadableSize(sizeMedian)}</span>{' '}
            ·{' '}
            <span className="text-rose-600 dark:text-rose-400">
              {sizePctBelow64}% &lt; 64 KiB
            </span>
          </div>
          <SizeHistogram bins={sizeBins} />
          <div className="mt-1 flex justify-between text-[9px] tabular-nums text-muted-foreground">
            {SIZE_BINS.map((b) => (
              <span key={b.label}>{b.label}</span>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
