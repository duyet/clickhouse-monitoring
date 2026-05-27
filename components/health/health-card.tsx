'use client'

import type { Thresholds } from '@/lib/health/thresholds-storage'
import type { HealthCheckDef } from './health-checks'

import { useEffect, useRef } from 'react'
import { dispatchAlert, isEscalation } from '@/lib/health/alert-dispatcher'
import { useChartData } from '@/lib/swr'
import { cn } from '@/lib/utils'

export type HealthStatus = 'ok' | 'warning' | 'critical' | 'loading' | 'error'

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

interface HealthCardProps {
  check: HealthCheckDef
  hostId: number
  thresholds: Thresholds
}

export function HealthCard({ check, hostId, thresholds }: HealthCardProps) {
  const swr = useChartData({
    chartName: check.chartName,
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
    const raw = row[check.valueKey]
    value = raw === null || raw === undefined ? 0 : Number(raw)
    label = check.formatLabel ? check.formatLabel(value) : String(value)
    if (Number.isFinite(value)) {
      if (value >= thresholds.critical) status = 'critical'
      else if (value >= thresholds.warning) status = 'warning'
      else status = 'ok'
    } else {
      status = 'error'
      label = 'Invalid value'
      value = null
    }
  } else {
    value = 0
    label = check.formatLabel ? check.formatLabel(0) : '0'
    status = 'ok'
  }

  const lastStatusRef = useRef<'ok' | 'warning' | 'critical' | null>(null)

  useEffect(() => {
    if (status !== 'ok' && status !== 'warning' && status !== 'critical') return
    const prev = lastStatusRef.current
    if (isEscalation(prev, status) && status !== 'ok') {
      void dispatchAlert({
        checkId: check.id,
        title: check.title,
        severity: status,
        value,
        label,
        hostId,
      })
    }
    lastStatusRef.current = status
  }, [status, value, label, check.id, check.title, hostId])

  const displayValue = check.formatValue
    ? check.formatValue(value)
    : value !== null
      ? value.toLocaleString()
      : '—'

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
          {check.title}
        </span>
      </div>
      <div className="text-2xl font-bold tabular-nums">{displayValue}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
