import type { ClickHouseConfig } from '@chm/clickhouse-client'

import { getServerAlertConfig } from './server-alert-config'
import { fetchData, getClickHouseConfigs } from '@chm/clickhouse-client'
import { debug, error } from '@chm/logger'
import { HEALTH_CHECKS } from '@/components/health/health-checks'
import { generateInsights } from '@/lib/insights/generate-insights'
import { registerBuiltinRules } from '@/lib/alerting/builtin-rules'

// Register pluggable alert rules into the global ruleRegistry once at module
// load. HEALTH_CHECKS (same rule set) continue to drive the /health page UI.
registerBuiltinRules()

type Severity = 'ok' | 'warning' | 'critical'

const SEVERITY_ORDER: Record<Severity, number> = {
  ok: 0,
  warning: 1,
  critical: 2,
}

export interface SweepFinding {
  hostId: number
  hostName: string
  checkId: string
  title: string
  severity: 'warning' | 'critical'
  value: number | null
  label: string
}

export interface SweepHostSummary {
  hostId: number
  hostName: string
  checksRun: number
  findings: number
  errored: number
}

export interface SweepSummary {
  ranAt: string
  enabled: boolean
  webhookConfigured: boolean
  minSeverity: 'warning' | 'critical'
  hostsChecked: number
  totalChecks: number
  totalFindings: number
  alertsDispatched: number
  /** Total AI insights generated and persisted across all hosts. */
  insightsGenerated: number
  hosts: SweepHostSummary[]
  findings: SweepFinding[]
}

function hostLabel(config: ClickHouseConfig): string {
  return config.customName?.trim() || config.host
}

/**
 * Run a single health-check SQL on one host in read-only mode and read the
 * numeric value from the configured `valueKey`. Mirrors the client read path
 * (`readOnlyQuery`) so cron results match what the Health dashboard shows.
 */
async function runHealthCheck(
  sql: string,
  valueKey: string,
  hostId: number
): Promise<number | null> {
  const result = await fetchData<Array<Record<string, unknown>>>({
    query: sql,
    hostId,
    format: 'JSONEachRow',
    clickhouse_settings: { readonly: '1' },
  })

  if (result.error) {
    throw new Error(result.error.message)
  }

  const rows = result.data
  if (!Array.isArray(rows) || rows.length === 0) return 0
  const raw = rows[0]?.[valueKey]
  if (raw === null || raw === undefined) return 0
  const num = Number(raw)
  return Number.isFinite(num) ? num : null
}

function classify(
  value: number | null,
  warning: number,
  critical: number
): Severity {
  if (value === null || !Number.isFinite(value)) return 'ok'
  if (value >= critical) return 'critical'
  if (value >= warning) return 'warning'
  return 'ok'
}

/**
 * POST an alert to the configured webhook using the EXACT payload shape the
 * `/api/v1/health/webhook` proxy forwards upstream (`{ text, content: text }`),
 * so Slack (`text`) and Discord (`content`) both render it. Server-side, no CORS
 * proxy needed — we post directly to the operator-configured webhook URL.
 */
async function postWebhook(url: string, text: string): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, content: text }),
      signal: controller.signal,
    })
    if (!res.ok) {
      error(
        '[health-sweep] Webhook returned non-OK status',
        new Error(`Status ${res.status}`)
      )
    }
    return res.ok
  } catch (err) {
    error('[health-sweep] Webhook POST failed', err as Error)
    return false
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Autonomous health sweep: runs every configured health check over ALL hosts,
 * classifies severity from each check's default thresholds, and dispatches a
 * webhook alert for any finding at or above the configured minimum severity.
 *
 * Disabled (or no webhook URL) → checks still run, alerts are skipped.
 */
export async function runHealthSweep(): Promise<SweepSummary> {
  const ranAt = new Date().toISOString()
  const settings = getServerAlertConfig()
  const webhookConfigured = Boolean(settings.webhookUrl)
  const canDispatch = settings.webhookEnabled && webhookConfigured
  const minRank = SEVERITY_ORDER[settings.minSeverity]

  const configs = getClickHouseConfigs()

  const hosts: SweepHostSummary[] = []
  const findings: SweepFinding[] = []
  let insightsGenerated = 0

  for (const config of configs) {
    const name = hostLabel(config)
    let checksRun = 0
    let errored = 0

    for (const check of HEALTH_CHECKS) {
      if (!check.sql) continue
      checksRun++
      try {
        const value = await runHealthCheck(check.sql, check.valueKey, config.id)
        const severity = classify(
          value,
          check.defaults.warning,
          check.defaults.critical
        )
        if (severity === 'ok') continue
        findings.push({
          hostId: config.id,
          hostName: name,
          checkId: check.id,
          title: check.title,
          severity,
          value,
          label: check.formatLabel ? check.formatLabel(value) : String(value),
        })
      } catch (err) {
        errored++
        debug(
          `[health-sweep] check "${check.id}" failed on host ${config.id}`,
          err instanceof Error ? err.message : String(err)
        )
      }
    }

    hosts.push({
      hostId: config.id,
      hostName: name,
      checksRun,
      findings: findings.filter((f) => f.hostId === config.id).length,
      errored,
    })

    // Generate + persist AI insights for this host (best-effort; never throws).
    try {
      const insights = await generateInsights(config.id)
      insightsGenerated += insights.length
    } catch (err) {
      debug(
        `[health-sweep] insight generation failed on host ${config.id}`,
        err instanceof Error ? err.message : String(err)
      )
    }
  }

  let alertsDispatched = 0
  if (canDispatch) {
    for (const finding of findings) {
      if (SEVERITY_ORDER[finding.severity] < minRank) continue
      const text = `[${finding.severity.toUpperCase()}] ${finding.title} — ${finding.label} (host ${finding.hostName})`
      const ok = await postWebhook(settings.webhookUrl, text)
      if (ok) alertsDispatched++
    }
  }

  return {
    ranAt,
    enabled: settings.webhookEnabled,
    webhookConfigured,
    minSeverity: settings.minSeverity,
    hostsChecked: configs.length,
    totalChecks: hosts.reduce((sum, h) => sum + h.checksRun, 0),
    totalFindings: findings.length,
    alertsDispatched,
    insightsGenerated,
    hosts,
    findings,
  }
}
