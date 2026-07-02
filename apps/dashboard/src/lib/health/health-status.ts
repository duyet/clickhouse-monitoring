/**
 * Pure status computation for the /health page.
 *
 * Extracted from the individual card components so the grid can compute every
 * card's status up-front — which it needs in order to sort by severity, count
 * issues for the summary banner, and drive the filter tabs. The cards then
 * become presentational, rendering the result rather than recomputing it.
 *
 * Everything here is pure (no React, no side effects), so it is unit-testable
 * and shared by both the grid and the cards.
 */

import type { HealthCheckDef } from '@/components/health/health-checks'
import type { HealthCheckState } from '@/components/health/use-health-checks'
import type { Thresholds } from '@/lib/health/thresholds-storage'

import { classifyValue } from '@/lib/alerting/rule-registry'

export type HealthStatus = 'ok' | 'warning' | 'critical' | 'loading' | 'error'

/** Sort order: worst first, then unknown (error/loading) last. */
export const SEVERITY_RANK: Record<HealthStatus, number> = {
  critical: 0,
  warning: 1,
  ok: 2,
  error: 3,
  loading: 4,
}

/** Severities that count toward the aggregate banner / filter tallies. */
export type CountableSeverity = 'critical' | 'warning' | 'ok'

export interface ComputedCheck {
  status: HealthStatus
  /** Numeric value, or null when loading / error / non-finite. */
  value: number | null
  /** Human-readable sub-label (e.g. "106 failed queries in last hour"). */
  label: string
  /** Formatted headline value (e.g. "106", "84.9%", "—"). */
  displayValue: string
  /** First data row, forwarded to the detail dialog. */
  row?: Record<string, unknown>
}

/**
 * Resolve a standard health check into a renderable state.
 *
 * Mirrors the threshold logic that previously lived inline in `HealthCard`:
 * `value >= critical` → critical, `value >= warning` → warning, else ok.
 */
export function computeCheckStatus(
  check: HealthCheckDef,
  thresholds: Thresholds,
  result: HealthCheckState,
  isLoading: boolean
): ComputedCheck {
  let status: HealthStatus = 'loading'
  let value: number | null = null
  let label = ''
  let row: Record<string, unknown> | undefined

  const metaStatus = result.status
  const isUnavailable =
    metaStatus === 'table_not_found' || metaStatus === 'table_not_configured'

  if (isLoading) {
    status = 'loading'
    label = 'Loading…'
  } else if (result.error) {
    status = 'error'
    label = 'Unavailable'
  } else if (isUnavailable) {
    status = 'error'
    label = result.statusMessage ?? 'Unavailable'
  } else if (result.data && result.data.length > 0) {
    row = result.data[0] as Record<string, unknown>
    const raw = row[check.valueKey]
    value = raw === null || raw === undefined ? 0 : Number(raw)
    label = check.formatLabel ? check.formatLabel(value) : String(value)
    if (Number.isFinite(value)) {
      status = classifyValue(value, thresholds)
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

  const displayValue = check.formatValue
    ? check.formatValue(value)
    : value !== null
      ? value.toLocaleString()
      : '—'

  return { status, value, label, displayValue, row }
}

export interface ComputedMutations {
  status: HealthStatus
  /** Headline value the card shows and tracks for the sparkline. */
  value: number
  label: string
}

/**
 * Stuck/active/failed mutations. Any stuck or failed mutation is critical;
 * more than five active is a warning. The headline value is the stuck count.
 */
export function computeStuckMutations(
  result: HealthCheckState,
  isLoading: boolean
): ComputedMutations {
  let status: HealthStatus = 'loading'
  let stuck = 0
  let active = 0
  let failed = 0
  let label = ''

  if (isLoading) {
    status = 'loading'
    label = 'Loading…'
  } else if (result.error) {
    status = 'error'
    label = 'Unavailable'
  } else if (result.data && result.data.length > 0) {
    const row = result.data[0] as Record<string, unknown>
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
      label = `${active} active · ${stuck} stuck · ${failed} failed`
      // Mutations-specific rules layered on the shared classifier: any stuck or
      // failed mutation (count ≥ 1) is critical; more than five active is a
      // warning. Counts are non-negative integers, so `> 0` ≡ `>= 1` and
      // `> 5` ≡ `>= 6`. Take the worst of the two signals.
      const blockingStatus = classifyValue(Math.max(stuck, failed), {
        warning: Number.POSITIVE_INFINITY,
        critical: 1,
      })
      const activeStatus = classifyValue(active, {
        warning: 6,
        critical: Number.POSITIVE_INFINITY,
      })
      status =
        SEVERITY_RANK[blockingStatus] <= SEVERITY_RANK[activeStatus]
          ? blockingStatus
          : activeStatus
    }
  } else {
    status = 'ok'
    label = '0 active · 0 stuck · 0 failed'
  }

  return { status, value: stuck, label }
}

/**
 * Running mutations. 10+ is critical, 3+ is a warning. The headline value is
 * the running count.
 */
export function computeRunningMutations(
  result: HealthCheckState,
  isLoading: boolean
): ComputedMutations {
  let status: HealthStatus = 'loading'
  let value = 0
  let label = ''

  if (isLoading) {
    status = 'loading'
    label = 'Loading…'
  } else if (result.error) {
    status = 'error'
    label = 'Unavailable'
  } else if (result.data && result.data.length > 0) {
    const row = result.data[0] as Record<string, unknown>
    value = Number(row.running_count ?? 0)
    if (!Number.isFinite(value)) {
      status = 'error'
      label = 'Invalid value'
      value = 0
    } else {
      label = `${value.toLocaleString()} running mutations`
      status = classifyValue(value, { warning: 3, critical: 10 })
    }
  } else {
    label = '0 running mutations'
    status = 'ok'
  }

  return { status, value, label }
}
