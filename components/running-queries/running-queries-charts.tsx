'use client'

import { Area, AreaChart, Bar, BarChart, ResponsiveContainer } from 'recharts'

import type { RunningQueryRow } from './running-queries-table'

import { memo, useId, useMemo } from 'react'
import {
  formatReadableQuantity,
  formatReadableSize,
} from '@/lib/format-readable'
import { REFRESH_INTERVAL } from '@/lib/swr/config'
import { useChartData } from '@/lib/swr/use-chart-data'
import { cn } from '@/lib/utils'

// ───────────────────────── chart data shapes ─────────────────────────

interface CountPoint {
  event_time: string
  query_count: number
  [key: string]: unknown
}
interface MemoryPoint {
  event_time: string
  memory_usage: number
  [key: string]: unknown
}
interface ByUserPoint {
  event_time: string
  user: string
  count: number
  [key: string]: unknown
}
interface TodayPoint {
  count: number
  [key: string]: unknown
}

/** Series color palette for the per-user stacked bars. */
const USER_COLORS = ['#0d9488', '#1e3a5f', '#f59e0b', '#8b5cf6', '#ef4444']

// ───────────────────────── mini charts (Recharts) ─────────────────────────

/** A smooth, gradient-filled Recharts area sparkline. */
function MiniArea({
  data,
  color,
  height = 92,
}: {
  data: number[]
  color: string
  height?: number
}) {
  const gradientId = useId()
  if (data.length < 2) {
    return <div style={{ height }} aria-hidden="true" />
  }

  const chartData = data.map((value, index) => ({ index, value }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={chartData}
        margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.6}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Per-time-bucket stacked bars rendered with Recharts. */
function MiniStackedBar({
  buckets,
  users,
  colors,
  height = 92,
}: {
  buckets: number[][]
  users: string[]
  colors: string[]
  height?: number
}) {
  if (buckets.length === 0 || users.length === 0) {
    return <div style={{ height }} aria-hidden="true" />
  }

  const chartData = buckets.map((bucket) => {
    const row: Record<string, number> = {}
    users.forEach((user, i) => {
      row[user] = bucket[i] ?? 0
    })
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
        barCategoryGap={2}
      >
        {users.map((user, i) => (
          <Bar
            key={user}
            dataKey={user}
            stackId="users"
            fill={colors[i % colors.length]}
            isAnimationActive={false}
            radius={i === users.length - 1 ? [1.5, 1.5, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ───────────────────────── card primitives ─────────────────────────

const cardClass =
  'flex flex-col rounded-xl border border-border bg-card p-4 min-h-[196px]'
const labelClass =
  'text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground'

/** A stat card: label + headline value + sub line + area sparkline. */
function StatCard({
  label,
  value,
  unit,
  sub,
  trend,
  color,
  series,
}: {
  label: string
  value: string
  unit?: string
  sub: string
  trend?: { text: string; positive: boolean }
  color: string
  series: number[]
}) {
  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-2">
        <span className={labelClass}>{label}</span>
        {trend && (
          <span
            className={cn(
              'rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums',
              trend.positive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
            )}
          >
            {trend.text}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[26px] font-bold leading-none tracking-tight tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-[13px] font-medium text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      <div className="mt-0.5 text-[11.5px] text-muted-foreground">{sub}</div>
      <div className="mt-auto pt-3">
        <MiniArea data={series} color={color} />
      </div>
    </div>
  )
}

/** Queries-by-user card: stacked bars + a per-user legend. */
function ByUserCard({
  buckets,
  users,
}: {
  buckets: number[][]
  users: string[]
}) {
  return (
    <div className={cardClass}>
      <span className={labelClass}>Queries by user</span>
      <div className="mt-auto pt-3">
        <MiniStackedBar buckets={buckets} users={users} colors={USER_COLORS} />
        {users.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-muted-foreground">
            {users.map((user, i) => (
              <span key={user} className="inline-flex items-center gap-1">
                <span
                  className="size-2 rounded-sm"
                  style={{ background: USER_COLORS[i % USER_COLORS.length] }}
                />
                {user}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Summary card: a labelled key / value list. */
function SummaryCard({
  items,
}: {
  items: { label: string; value: string; unit?: string }[]
}) {
  return (
    <div className={cardClass}>
      <span className={labelClass}>Summary</span>
      <dl className="mt-2 flex flex-col gap-y-1.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-baseline justify-between gap-2 text-[12px]"
          >
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="font-semibold tabular-nums">
              {item.value}
              {item.unit && (
                <span className="ml-1 font-normal text-muted-foreground">
                  {item.unit}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// ───────────────────────── helpers ─────────────────────────

/** Compact integer ("13,247" → "13.2K", "1.4M"). */
function compact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return String(Math.round(n))
}

/** Split a "560.6 MiB" string into its number and unit halves. */
function splitSize(readable: string): { value: string; unit: string } {
  const [value, ...rest] = readable.split(' ')
  return { value: value ?? readable, unit: rest.join(' ') }
}

// ───────────────────────── strip ─────────────────────────

interface RunningQueriesChartsProps {
  /** Live `system.processes` rows — drives the Summary + active-memory card. */
  rows: RunningQueryRow[]
  hostId: number
}

/**
 * RunningQueriesCharts — the four-card strip above the Running Queries table.
 *
 * "Running over time" and "Queries by user" come from `system.query_log`
 * (14-day history); "Memory consumed" pairs the live active total with the
 * query-memory trend; "Summary" is aggregated straight from the live rows.
 * Every number is real — there is no synthetic series.
 */
export const RunningQueriesCharts = memo(function RunningQueriesCharts({
  rows,
  hostId,
}: RunningQueriesChartsProps) {
  const countSwr = useChartData<CountPoint>({
    chartName: 'query-count',
    hostId,
    interval: 'toStartOfDay',
    lastHours: 24 * 14,
    refreshInterval: REFRESH_INTERVAL.VERY_SLOW_5M,
  })
  const memorySwr = useChartData<MemoryPoint>({
    chartName: 'query-memory',
    hostId,
    interval: 'toStartOfDay',
    lastHours: 24 * 14,
    refreshInterval: REFRESH_INTERVAL.VERY_SLOW_5M,
  })
  const byUserSwr = useChartData<ByUserPoint>({
    chartName: 'query-count-by-user',
    hostId,
    interval: 'toStartOfDay',
    lastHours: 24 * 14,
    refreshInterval: REFRESH_INTERVAL.VERY_SLOW_5M,
  })
  const todaySwr = useChartData<TodayPoint>({
    chartName: 'query-count-today',
    hostId,
    refreshInterval: REFRESH_INTERVAL.SLOW_2M,
  })

  // "Running over time" — 14-day query volume + a recent-vs-prior-week trend.
  const running = useMemo(() => {
    const series = (countSwr.data ?? []).map((d) => Number(d.query_count) || 0)
    const total = series.reduce((s, v) => s + v, 0)
    const half = Math.floor(series.length / 2)
    const prior = series.slice(0, half).reduce((s, v) => s + v, 0)
    const recent = series.slice(half).reduce((s, v) => s + v, 0)
    const pct = prior > 0 ? ((recent - prior) / prior) * 100 : 0
    return {
      series,
      total: total.toLocaleString(),
      trend:
        series.length >= 4 && prior > 0
          ? {
              text: `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`,
              positive: pct >= 0,
            }
          : undefined,
    }
  }, [countSwr.data])

  // "Memory consumed" — live active total, with the 14-day query-memory trend.
  const memory = useMemo(() => {
    const series = (memorySwr.data ?? []).map(
      (d) => Number(d.memory_usage) || 0
    )
    const active = rows.reduce((s, r) => s + (Number(r.memory_usage) || 0), 0)
    const avg = series.length
      ? series.reduce((s, v) => s + v, 0) / series.length
      : 0
    return {
      series,
      ...splitSize(formatReadableSize(active)),
      sub: `active · ${formatReadableSize(avg)} 14d avg`,
    }
  }, [memorySwr.data, rows])

  // "Queries by user" — pivot the long-form rows into stacked daily bars.
  const byUser = useMemo(() => {
    const data = byUserSwr.data ?? []
    const totals = new Map<string, number>()
    for (const d of data) {
      totals.set(d.user, (totals.get(d.user) ?? 0) + (Number(d.count) || 0))
    }
    const users = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, USER_COLORS.length)
      .map(([user]) => user)

    const byTime = new Map<string, Map<string, number>>()
    for (const d of data) {
      const bucket = byTime.get(d.event_time) ?? new Map()
      bucket.set(d.user, (bucket.get(d.user) ?? 0) + (Number(d.count) || 0))
      byTime.set(d.event_time, bucket)
    }
    const buckets = Array.from(byTime.keys())
      .sort()
      .map((time) => {
        const bucket = byTime.get(time)
        return users.map((user) => bucket?.get(user) ?? 0)
      })
    return { buckets, users }
  }, [byUserSwr.data])

  // "Summary" — aggregated straight from the live rows.
  const summary = useMemo(() => {
    const sum = (key: keyof RunningQueryRow) =>
      rows.reduce((s, r) => s + (Number(r[key]) || 0), 0)
    const today = Number(todaySwr.data?.[0]?.count ?? 0)
    return [
      { label: 'Active', value: String(rows.length) },
      ...splitItem('Memory', formatReadableSize(sum('memory_usage'))),
      { label: 'Rows read', value: formatReadableQuantity(sum('read_rows')) },
      ...splitItem('Data read', formatReadableSize(sum('read_bytes'))),
      { label: 'Threads', value: String(sum('thread_count')) },
      { label: 'Today', value: compact(today) },
    ]
  }, [rows, todaySwr.data])

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Running over time"
        value={running.total}
        sub="last 14d total"
        trend={running.trend}
        color="hsl(38 92% 55%)"
        series={running.series}
      />
      <StatCard
        label="Memory consumed"
        value={memory.value}
        unit={memory.unit}
        sub={memory.sub}
        color="#8b5cf6"
        series={memory.series}
      />
      <ByUserCard buckets={byUser.buckets} users={byUser.users} />
      <SummaryCard items={summary} />
    </div>
  )
})

/** Split a "560.6 MiB" reading into a `{value, unit}` summary item. */
function splitItem(
  label: string,
  readable: string
): { label: string; value: string; unit?: string }[] {
  const { value, unit } = splitSize(readable)
  return [{ label, value, unit }]
}
