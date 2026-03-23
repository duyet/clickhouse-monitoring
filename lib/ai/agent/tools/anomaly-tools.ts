import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

interface AnomalyCheck {
  name: string
  recentQuery: string
  baselineQuery: string
  unit: string
}

const ANOMALY_CHECKS: AnomalyCheck[] = [
  {
    name: 'error_rate',
    recentQuery: `SELECT countIf(type = 'ExceptionWhileProcessing') * 100.0 / nullIf(count(), 0) as value FROM system.query_log WHERE event_time > now() - INTERVAL 1 HOUR`,
    baselineQuery: `SELECT countIf(type = 'ExceptionWhileProcessing') * 100.0 / nullIf(count(), 0) as value FROM system.query_log WHERE event_time BETWEEN now() - INTERVAL 25 HOUR AND now() - INTERVAL 1 HOUR`,
    unit: '%',
  },
  {
    name: 'query_duration_p95',
    recentQuery: `SELECT quantile(0.95)(query_duration_ms) as value FROM system.query_log WHERE type = 'QueryFinish' AND event_time > now() - INTERVAL 1 HOUR`,
    baselineQuery: `SELECT quantile(0.95)(query_duration_ms) as value FROM system.query_log WHERE type = 'QueryFinish' AND event_time BETWEEN now() - INTERVAL 25 HOUR AND now() - INTERVAL 1 HOUR`,
    unit: 'ms',
  },
  {
    name: 'query_volume',
    recentQuery: `SELECT count() as value FROM system.query_log WHERE type = 'QueryFinish' AND event_time > now() - INTERVAL 1 HOUR`,
    baselineQuery: `SELECT count() / 24.0 as value FROM system.query_log WHERE type = 'QueryFinish' AND event_time BETWEEN now() - INTERVAL 25 HOUR AND now() - INTERVAL 1 HOUR`,
    unit: 'queries/hour',
  },
  {
    name: 'memory_usage',
    recentQuery: `SELECT value as value FROM system.metrics WHERE metric = 'MemoryTracking'`,
    baselineQuery: `SELECT avg(value) as value FROM system.asynchronous_metric_log WHERE metric = 'MemoryResident' AND event_time BETWEEN now() - INTERVAL 25 HOUR AND now() - INTERVAL 1 HOUR`,
    unit: 'bytes',
  },
  {
    name: 'active_parts_count',
    recentQuery: `SELECT count() as value FROM system.parts WHERE active`,
    baselineQuery: `SELECT count() as value FROM system.parts WHERE active`,
    unit: 'parts',
  },
]

export function createAnomalyTools(hostId: number) {
  return {
    detect_anomalies: dynamicTool({
      description:
        'Detect statistical anomalies by comparing recent (1h) vs baseline (24h) metrics. Checks error rate, query duration P95, query volume, memory usage, and part counts. Returns severity levels.',
      inputSchema: z.object({
        hostId: z.number().optional().describe('Override host ID'),
      }),
      execute: async (input: unknown) => {
        const { hostId: toolHostId } = input as { hostId?: number }
        const resolved = resolveHostId(toolHostId, hostId)

        const results = await Promise.all(
          ANOMALY_CHECKS.map(async (check) => {
            try {
              const [recentResult, baselineResult] = await Promise.all([
                readOnlyQuery({
                  query: check.recentQuery,
                  hostId: resolved,
                }),
                readOnlyQuery({
                  query: check.baselineQuery,
                  hostId: resolved,
                }),
              ])

              const recent = extractValue(recentResult)
              const baseline = extractValue(baselineResult)

              if (baseline === 0 || baseline === null || recent === null) {
                return {
                  metric: check.name,
                  status: 'insufficient_data',
                  unit: check.unit,
                }
              }

              const changePercent =
                ((recent - baseline) / Math.abs(baseline)) * 100
              const severity = classifyAnomaly(check.name, changePercent)

              return {
                metric: check.name,
                recent_value: recent,
                baseline_value: baseline,
                change_percent: Math.round(changePercent * 100) / 100,
                severity,
                unit: check.unit,
              }
            } catch (e) {
              return {
                metric: check.name,
                status: 'error',
                error: e instanceof Error ? e.message : String(e),
              }
            }
          })
        )

        const anomalies = results.filter(
          (r) => 'severity' in r && r.severity !== 'ok'
        )

        return {
          checked_at: new Date().toISOString(),
          total_checks: results.length,
          anomalies_found: anomalies.length,
          results,
          summary:
            anomalies.length === 0
              ? 'No anomalies detected. All metrics within normal range.'
              : `Found ${anomalies.length} anomaly(ies). Review the results for details.`,
        }
      },
    }),
  }
}

function extractValue(result: unknown): number | null {
  if (Array.isArray(result) && result.length > 0) {
    const row = result[0] as Record<string, unknown>
    const val = row.value
    return typeof val === 'number' ? val : Number(val) || null
  }
  return null
}

function classifyAnomaly(
  metric: string,
  changePercent: number
): 'ok' | 'warning' | 'critical' {
  if (metric === 'error_rate') {
    if (changePercent > 100) return 'critical'
    if (changePercent > 50) return 'warning'
    return 'ok'
  }

  if (metric === 'query_duration_p95') {
    if (changePercent > 200) return 'critical'
    if (changePercent > 100) return 'warning'
    return 'ok'
  }

  if (metric === 'memory_usage') {
    if (changePercent > 80) return 'critical'
    if (changePercent > 40) return 'warning'
    return 'ok'
  }

  // Generic threshold for other metrics
  const abs = Math.abs(changePercent)
  if (abs > 100) return 'critical'
  if (abs > 50) return 'warning'
  return 'ok'
}
