'use client'

export const dynamic = 'force-static'

import { Suspense } from 'react'
import { ChartSkeleton } from '@/components/skeletons'
import { useChartData, useHostId } from '@/lib/swr'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Thresholds {
  warning: number
  critical: number
}

type HealthStatus = 'ok' | 'warning' | 'critical' | 'loading' | 'error'

// ─── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: HealthStatus }) {
  return (
    <span
      className={cn(
        'inline-block h-3 w-3 rounded-full flex-shrink-0',
        status === 'ok' && 'bg-green-500',
        status === 'warning' && 'bg-amber-500',
        status === 'critical' && 'bg-red-500',
        status === 'loading' && 'bg-muted animate-pulse',
        status === 'error' && 'bg-muted'
      )}
      aria-label={status}
    />
  )
}

// ─── HealthCard ───────────────────────────────────────────────────────────────

interface HealthCardProps {
  title: string
  chartName: string
  hostId: number
  thresholds: Thresholds
  /** Key in the first data row to read the numeric value from */
  valueKey: string
  /** Human-readable label template, receives the value */
  formatLabel: (value: number | null) => string
}

function HealthCard({
  title,
  chartName,
  hostId,
  thresholds,
  valueKey,
  formatLabel,
}: HealthCardProps) {
  const swr = useChartData({
    chartName,
    hostId,
    refreshInterval: 30000,
  })

  let status: HealthStatus = 'loading'
  let value: number | null = null
  let label = ''

  if (swr.isLoading) {
    status = 'loading'
    label = 'Loading…'
  } else if (swr.error) {
    status = 'error'
    label = 'Unavailable'
  } else if (swr.data && swr.data.length > 0) {
    const row = swr.data[0] as Record<string, unknown>
    const raw = row[valueKey]
    value = raw !== null && raw !== undefined ? Number(raw) : 0
    label = formatLabel(value)

    if (value >= thresholds.critical) {
      status = 'critical'
    } else if (value >= thresholds.warning) {
      status = 'warning'
    } else {
      status = 'ok'
    }
  } else {
    // Empty result set — treat as zero (healthy)
    value = 0
    label = formatLabel(0)
    status = 'ok'
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4 bg-card shadow-sm transition-colors',
        status === 'critical' && 'border-red-500/50 bg-red-500/5',
        status === 'warning' && 'border-amber-500/50 bg-amber-500/5'
      )}
    >
      <div className="flex items-center gap-2">
        <StatusDot status={status} />
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="text-2xl font-bold tabular-nums">
        {value !== null ? value.toLocaleString() : '—'}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

// ─── MutationsCard ─────────────────────────────────────────────────────────────
// Uses the multi-value 'summary-stuck-mutations' chart (active, stuck, failed)

function MutationsCard({ hostId }: { hostId: number }) {
  const swr = useChartData({
    chartName: 'summary-stuck-mutations',
    hostId,
    refreshInterval: 30000,
  })

  let status: HealthStatus = 'loading'
  let stuck = 0
  let active = 0
  let failed = 0
  let label = ''

  if (swr.isLoading) {
    status = 'loading'
    label = 'Loading…'
  } else if (swr.error) {
    status = 'error'
    label = 'Unavailable'
  } else if (swr.data && swr.data.length > 0) {
    const row = swr.data[0] as Record<string, unknown>
    stuck = Number(row.stuck ?? 0)
    active = Number(row.active ?? 0)
    failed = Number(row.failed ?? 0)
    label = `${active} active, ${stuck} stuck, ${failed} failed`

    if (stuck > 0 || failed > 0) {
      status = 'critical'
    } else if (active > 5) {
      status = 'warning'
    } else {
      status = 'ok'
    }
  } else {
    status = 'ok'
    label = '0 active, 0 stuck, 0 failed'
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4 bg-card shadow-sm transition-colors',
        status === 'critical' && 'border-red-500/50 bg-red-500/5',
        status === 'warning' && 'border-amber-500/50 bg-amber-500/5'
      )}
    >
      <div className="flex items-center gap-2">
        <StatusDot status={status} />
        <span className="text-sm font-medium text-muted-foreground">
          Mutations
        </span>
      </div>
      <div className="text-2xl font-bold tabular-nums">{stuck}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

// ─── RunningMutationsCard ──────────────────────────────────────────────────────

function RunningMutationsCard({ hostId }: { hostId: number }) {
  const swr = useChartData({
    chartName: 'summary-used-by-mutations',
    hostId,
    refreshInterval: 30000,
  })

  let status: HealthStatus = 'loading'
  let value: number | null = null
  let label = ''

  if (swr.isLoading) {
    status = 'loading'
    label = 'Loading…'
  } else if (swr.error) {
    status = 'error'
    label = 'Unavailable'
  } else if (swr.data && swr.data.length > 0) {
    const row = swr.data[0] as Record<string, unknown>
    value = Number(row.running_count ?? 0)
    label = `${value} running mutations`
    status = value >= 10 ? 'critical' : value >= 3 ? 'warning' : 'ok'
  } else {
    value = 0
    label = '0 running mutations'
    status = 'ok'
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4 bg-card shadow-sm transition-colors',
        status === 'critical' && 'border-red-500/50 bg-red-500/5',
        status === 'warning' && 'border-amber-500/50 bg-amber-500/5'
      )}
    >
      <div className="flex items-center gap-2">
        <StatusDot status={status} />
        <span className="text-sm font-medium text-muted-foreground">
          Running Mutations
        </span>
      </div>
      <div className="text-2xl font-bold tabular-nums">
        {value !== null ? value.toLocaleString() : '—'}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

// ─── Page Content ─────────────────────────────────────────────────────────────

function HealthPageContent() {
  const hostId = useHostId()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Health Summary</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time health indicators for your ClickHouse cluster
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <HealthCard
          title="Readonly Replicas"
          chartName="health-readonly-replicas"
          hostId={hostId}
          thresholds={{ warning: 1, critical: 3 }}
          valueKey="readonly_count"
          formatLabel={(v) => `${v ?? 0} readonly replica${v === 1 ? '' : 's'}`}
        />
        <HealthCard
          title="Delayed Inserts"
          chartName="health-delayed-inserts"
          hostId={hostId}
          thresholds={{ warning: 1, critical: 5 }}
          valueKey="delayed_inserts"
          formatLabel={(v) => `${v ?? 0} delayed insert${v === 1 ? '' : 's'}`}
        />
        <HealthCard
          title="Max Parts per Partition"
          chartName="health-max-part-count"
          hostId={hostId}
          thresholds={{ warning: 150, critical: 300 }}
          valueKey="part_count"
          formatLabel={(v) => `${v ?? 0} parts (max partition)`}
        />
        <RunningMutationsCard hostId={hostId} />
        <MutationsCard hostId={hostId} />
      </div>
    </div>
  )
}

export default function HealthPage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HealthPageContent />
    </Suspense>
  )
}
