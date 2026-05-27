'use client'

import type { HealthStatus } from './health-card'

import { useEffect, useRef } from 'react'
import { dispatchAlert, isEscalation } from '@/lib/health/alert-dispatcher'
import { useChartData, useHostId } from '@/lib/swr'
import { cn } from '@/lib/utils'

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

function useAlertOnEscalate(
  checkId: string,
  title: string,
  status: HealthStatus,
  value: number,
  label: string,
  hostId: number
) {
  const lastRef = useRef<'ok' | 'warning' | 'critical' | null>(null)
  useEffect(() => {
    if (status !== 'ok' && status !== 'warning' && status !== 'critical') return
    if (isEscalation(lastRef.current, status) && status !== 'ok') {
      void dispatchAlert({
        checkId,
        title,
        severity: status,
        value,
        label,
        hostId,
      })
    }
    lastRef.current = status
  }, [status, value, label, checkId, title, hostId])
}

export function StuckMutationsCard() {
  const hostId = useHostId()
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
    if (
      !Number.isFinite(stuck) ||
      !Number.isFinite(active) ||
      !Number.isFinite(failed)
    ) {
      status = 'error'
      label = 'Invalid value'
      stuck = 0
      active = 0
      failed = 0
    } else {
      label = `${active} active, ${stuck} stuck, ${failed} failed`
      if (stuck > 0 || failed > 0) status = 'critical'
      else if (active > 5) status = 'warning'
      else status = 'ok'
    }
  } else {
    status = 'ok'
    label = '0 active, 0 stuck, 0 failed'
  }

  useAlertOnEscalate(
    'stuck-mutations',
    'Stuck Mutations',
    status,
    stuck,
    label,
    hostId
  )

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4 bg-card transition-colors',
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

export function RunningMutationsCard() {
  const hostId = useHostId()
  const swr = useChartData({
    chartName: 'summary-used-by-mutations',
    hostId,
    refreshInterval: 30000,
  })

  let status: HealthStatus = 'loading'
  let value = 0
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
    if (!Number.isFinite(value)) {
      status = 'error'
      label = 'Invalid value'
      value = 0
    } else {
      label = `${value} running mutations`
      status = value >= 10 ? 'critical' : value >= 3 ? 'warning' : 'ok'
    }
  } else {
    label = '0 running mutations'
    status = 'ok'
  }

  useAlertOnEscalate(
    'running-mutations',
    'Running Mutations',
    status,
    value,
    label,
    hostId
  )

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4 bg-card transition-colors',
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
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
