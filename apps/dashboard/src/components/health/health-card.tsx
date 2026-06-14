import { Maximize2 } from 'lucide-react'

import type { Thresholds } from '@/lib/health/thresholds-storage'
import type { HealthCheckDef } from './health-checks'

import { HealthDetailDialog } from './health-detail-dialog'
import { useEffect, useRef, useState } from 'react'
import { AppLink } from '@/components/ui/app-link'
import { dispatchAlert, isEscalation } from '@/lib/health/alert-dispatcher'
import { useChartData, useHostId } from '@/lib/swr'
import { cn } from '@/lib/utils'

export type HealthStatus = 'ok' | 'warning' | 'critical' | 'loading' | 'error'

function StatusDot({ status }: { status: HealthStatus }) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full flex-shrink-0',
        status === 'ok' && 'bg-green-500',
        status === 'warning' && 'bg-amber-500',
        status === 'critical' && 'bg-red-500',
        status === 'loading' && 'bg-muted animate-pulse',
        status === 'error' && 'bg-muted'
      )}
      role="img"
      aria-label={`Status: ${status}`}
    />
  )
}

interface HealthCardProps {
  check: HealthCheckDef
  thresholds: Thresholds
}

export function HealthCard({ check, thresholds }: HealthCardProps) {
  const hostId = useHostId()
  const [detailOpen, setDetailOpen] = useState(false)
  const swr = useChartData({
    chartName: check.chartName,
    hostId,
    refreshInterval: 30000,
  })

  let status: HealthStatus = 'loading'
  let value: number | null = null
  let label = ''
  let row: Record<string, unknown> | undefined

  const metaStatus = swr.metadata?.status
  const isUnavailable =
    metaStatus === 'table_not_found' || metaStatus === 'table_not_configured'

  if (swr.isLoading) {
    status = 'loading'
    label = 'Loading…'
  } else if (swr.error) {
    status = 'error'
    label = 'Unavailable'
  } else if (isUnavailable) {
    status = 'error'
    label = swr.metadata?.statusMessage ?? 'Unavailable'
  } else if (swr.data && swr.data.length > 0) {
    row = swr.data[0] as Record<string, unknown>
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
      void (async () => {
        try {
          await dispatchAlert({
            checkId: check.id,
            title: check.title,
            severity: status,
            value,
            label,
            hostId,
          })
        } catch (error) {
          console.error('Failed to dispatch health alert', error)
        }
      })()
    }
    lastStatusRef.current = status
  }, [status, value, label, check.id, check.title, hostId])

  const displayValue = check.formatValue
    ? check.formatValue(value)
    : value !== null
      ? value.toLocaleString()
      : '—'

  const withHost = (href: string) =>
    `${href}${href.includes('?') ? '&' : '?'}host=${hostId}`

  const Icon = check.icon

  return (
    <>
      <div
        className={cn(
          'group flex flex-col gap-3 rounded-lg border p-4 bg-card transition-colors',
          status === 'critical' && 'border-red-500/50 bg-red-500/5',
          status === 'warning' && 'border-amber-500/50 bg-amber-500/5'
        )}
      >
        {/* Header: icon + title + status dot + expand button */}
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon
              className={cn(
                'size-4 flex-shrink-0',
                status === 'critical' && 'text-red-500',
                status === 'warning' && 'text-amber-500',
                status === 'ok' && 'text-green-500',
                (status === 'loading' || status === 'error') &&
                  'text-muted-foreground'
              )}
              aria-hidden
            />
          )}
          <span className="text-[12.5px] font-medium text-muted-foreground leading-tight flex-1 min-w-0 truncate">
            {check.title}
          </span>
          <StatusDot status={status} />
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            aria-label={`Open ${check.title} details`}
            className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Maximize2 className="size-3" />
          </button>
        </div>

        {/* Body: big number + sub-label */}
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="text-left"
        >
          <div className="text-2xl font-bold tabular-nums">{displayValue}</div>
          <div className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug">
            {label}
          </div>
        </button>

        {/* Footer: related links as tappable chips */}
        {check.relatedLinks && check.relatedLinks.length > 0 && (
          <div className="border-t pt-2">
            <div className="flex flex-wrap gap-1">
              {check.relatedLinks.slice(0, 3).map((l) => (
                <AppLink
                  key={l.href}
                  href={withHost(l.href)}
                  className={cn(
                    'inline-flex items-center rounded-md px-2 py-0.5',
                    'text-[11px] font-medium leading-none',
                    'bg-muted/60 text-muted-foreground',
                    'hover:bg-muted hover:text-foreground',
                    'transition-colors'
                  )}
                >
                  {l.label}
                </AppLink>
              ))}
            </div>
          </div>
        )}
      </div>

      <HealthDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        check={check}
        hostId={hostId}
        status={status}
        value={value}
        label={label}
        thresholds={thresholds}
        row={row}
        clickhouseVersion={swr.metadata?.clickhouseVersion}
      />
    </>
  )
}
