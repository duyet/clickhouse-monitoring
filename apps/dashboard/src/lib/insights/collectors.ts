/**
 * Deterministic insight collectors.
 *
 * Each collector runs read-only queries against a single host and returns
 * candidate insights. Collectors NEVER throw — any query failure (missing
 * table, read-only cluster, permission) yields an empty list so the engine
 * degrades gracefully. The SQL/severity heuristics are ported from the agent's
 * anomaly and table-insight tools so the panel matches what the agent reports.
 */

import type { InsightCandidate, InsightSeverity } from './types'

import { readOnlyQuery } from '../ai/agent/tools/helpers'

function extractValue(result: unknown): number | null {
  if (Array.isArray(result) && result.length > 0) {
    const row = result[0] as Record<string, unknown>
    const val = row.value
    const num = typeof val === 'number' ? val : Number(val)
    return Number.isFinite(num) ? num : null
  }
  return null
}

async function firstRow(
  sql: string,
  hostId: number
): Promise<Record<string, unknown> | null> {
  try {
    const rows = await readOnlyQuery({ query: sql, hostId })
    return Array.isArray(rows) && rows.length > 0
      ? (rows[0] as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Anomaly collector — recent (1h) vs baseline (24h), ported from anomaly-tools.
// ---------------------------------------------------------------------------

interface AnomalyCheck {
  metric: string
  title: string
  recentQuery: string
  baselineQuery: string
  /** Render the change into a human detail string. */
  format: (recent: number, baseline: number, changePct: number) => string
  classify: (changePct: number) => InsightSeverity
}

const round = (n: number) => Math.round(n * 100) / 100

const ANOMALY_CHECKS: AnomalyCheck[] = [
  {
    metric: 'error_rate',
    title: 'Query error rate is climbing',
    recentQuery: `SELECT countIf(type = 'ExceptionWhileProcessing') * 100.0 / nullIf(count(), 0) as value FROM system.query_log WHERE event_time > now() - INTERVAL 1 HOUR`,
    baselineQuery: `SELECT countIf(type = 'ExceptionWhileProcessing') * 100.0 / nullIf(count(), 0) as value FROM system.query_log WHERE event_time BETWEEN now() - INTERVAL 25 HOUR AND now() - INTERVAL 1 HOUR`,
    format: (recent, baseline) =>
      `Error rate in the last hour is ${round(recent)}% vs a 24h baseline of ${round(baseline)}%. Investigate failing queries before they spread.`,
    classify: (pct) => (pct > 100 ? 'critical' : pct > 50 ? 'warning' : 'info'),
  },
  {
    metric: 'query_duration_p95',
    title: 'Queries are slowing down (p95)',
    recentQuery: `SELECT quantile(0.95)(query_duration_ms) as value FROM system.query_log WHERE type = 'QueryFinish' AND event_time > now() - INTERVAL 1 HOUR`,
    baselineQuery: `SELECT quantile(0.95)(query_duration_ms) as value FROM system.query_log WHERE type = 'QueryFinish' AND event_time BETWEEN now() - INTERVAL 25 HOUR AND now() - INTERVAL 1 HOUR`,
    format: (recent, baseline, pct) =>
      `p95 query duration rose ${round(pct)}% (now ${round(recent)}ms vs ${round(baseline)}ms baseline). Check for heavy scans or contention.`,
    classify: (pct) =>
      pct > 200 ? 'critical' : pct > 100 ? 'warning' : 'info',
  },
  {
    metric: 'memory_usage',
    title: 'Memory usage spiked',
    recentQuery: `SELECT value as value FROM system.metrics WHERE metric = 'MemoryTracking'`,
    baselineQuery: `SELECT avg(value) as value FROM system.asynchronous_metric_log WHERE metric = 'MemoryResident' AND event_time BETWEEN now() - INTERVAL 25 HOUR AND now() - INTERVAL 1 HOUR`,
    format: (_recent, _baseline, pct) =>
      `Tracked memory is ${round(pct)}% above the 24h average. Watch for OOM risk on memory-heavy queries.`,
    classify: (pct) => (pct > 80 ? 'critical' : pct > 40 ? 'warning' : 'info'),
  },
]

async function collectAnomalies(hostId: number): Promise<InsightCandidate[]> {
  const out: InsightCandidate[] = []
  await Promise.all(
    ANOMALY_CHECKS.map(async (check) => {
      try {
        const [recentRes, baselineRes] = await Promise.all([
          readOnlyQuery({ query: check.recentQuery, hostId }).catch(() => null),
          readOnlyQuery({ query: check.baselineQuery, hostId }).catch(
            () => null
          ),
        ])
        const recent = extractValue(recentRes)
        const baseline = extractValue(baselineRes)
        if (recent === null || baseline === null || baseline === 0) return

        const changePct = ((recent - baseline) / Math.abs(baseline)) * 100
        const severity = check.classify(changePct)
        // Only surface meaningful regressions.
        if (severity === 'info') return

        out.push({
          severity,
          category: 'anomaly',
          metric: check.metric,
          title: check.title,
          detail: check.format(recent, baseline, changePct),
          value: round(changePct),
          action: {
            label: 'Open running queries',
            href: '/running-queries',
            prompt: `Why did ${check.metric} change recently on host ${hostId}? Detect anomalies and explain.`,
          },
        })
      } catch {
        // ignore — collector stays best-effort
      }
    })
  )
  return out
}

// ---------------------------------------------------------------------------
// Storage collector — fragmented tables + poor compression.
// ---------------------------------------------------------------------------

async function collectStorage(hostId: number): Promise<InsightCandidate[]> {
  const out: InsightCandidate[] = []

  // Highly fragmented table (many active parts → merge pressure, slow reads).
  const parts = await firstRow(
    `SELECT database, table, count() AS value,
       formatReadableSize(sum(bytes_on_disk)) AS size
     FROM system.parts WHERE active
     GROUP BY database, table
     ORDER BY value DESC
     LIMIT 1`,
    hostId
  )
  if (parts) {
    const partCount = Number(parts.value) || 0
    if (partCount >= 300) {
      out.push({
        severity: partCount >= 1000 ? 'warning' : 'info',
        category: 'storage',
        metric: 'max_active_parts',
        title: `${parts.database}.${parts.table} is fragmented`,
        detail: `${parts.database}.${parts.table} has ${partCount} active parts (${parts.size}). Consider OPTIMIZE or reviewing the partition key to cut merge overhead.`,
        value: partCount,
        action: { label: 'View tables', href: '/tables' },
      })
    }
  }

  // Worst compression on a sizeable table (ratio near 1 == barely compressed).
  const compression = await firstRow(
    `SELECT database, table,
       round(sum(data_compressed_bytes) * 1.0 / nullIf(sum(data_uncompressed_bytes), 0), 3) AS value,
       formatReadableSize(sum(data_uncompressed_bytes)) AS uncompressed
     FROM system.parts WHERE active
     GROUP BY database, table
     HAVING sum(data_uncompressed_bytes) > 1073741824
     ORDER BY value DESC
     LIMIT 1`,
    hostId
  )
  if (compression) {
    const ratio = Number(compression.value) || 0
    if (ratio >= 0.7) {
      out.push({
        severity: 'info',
        category: 'storage',
        metric: 'worst_compression_ratio',
        title: `Poor compression on ${compression.database}.${compression.table}`,
        detail: `${compression.database}.${compression.table} (${compression.uncompressed} uncompressed) compresses to ${Math.round(ratio * 100)}% of its size. A better codec (ZSTD/Delta) or column ordering could reclaim storage.`,
        value: ratio,
        action: {
          label: 'Ask the agent',
          prompt: `Suggest compression improvements for ${compression.database}.${compression.table}.`,
        },
      })
    }
  }

  return out
}

// ---------------------------------------------------------------------------
// Reliability collector — readonly replicas + replication lag.
// ---------------------------------------------------------------------------

async function collectReliability(hostId: number): Promise<InsightCandidate[]> {
  const out: InsightCandidate[] = []

  const readonly = await firstRow(
    `SELECT count() AS value FROM system.replicas WHERE is_readonly`,
    hostId
  )
  if (readonly) {
    const count = Number(readonly.value) || 0
    if (count > 0) {
      out.push({
        severity: 'critical',
        category: 'reliability',
        metric: 'readonly_replicas',
        title: `${count} replica${count > 1 ? 's are' : ' is'} read-only`,
        detail: `${count} replicated table${count > 1 ? 's' : ''} entered read-only mode — usually a ZooKeeper/Keeper connectivity problem. Writes to these tables are blocked.`,
        value: count,
        action: { label: 'View replicas', href: '/replicas' },
      })
    }
  }

  const lag = await firstRow(
    `SELECT max(absolute_delay) AS value FROM system.replicas`,
    hostId
  )
  if (lag) {
    const seconds = Number(lag.value) || 0
    if (seconds >= 60) {
      out.push({
        severity: seconds >= 600 ? 'warning' : 'info',
        category: 'reliability',
        metric: 'max_replication_delay',
        title: 'Replication is lagging',
        detail: `The most-delayed replica is ${Math.round(seconds)}s behind. Sustained lag risks stale reads and growing replication queues.`,
        value: Math.round(seconds),
        action: { label: 'View replicas', href: '/replicas' },
      })
    }
  }

  return out
}

/**
 * Run all collectors for a host and return de-duplicated candidates,
 * highest severity first.
 */
export async function collectInsights(
  hostId: number
): Promise<InsightCandidate[]> {
  const groups = await Promise.all([
    collectAnomalies(hostId).catch(() => []),
    collectStorage(hostId).catch(() => []),
    collectReliability(hostId).catch(() => []),
  ])

  const seen = new Set<string>()
  const merged: InsightCandidate[] = []
  for (const candidate of groups.flat()) {
    const dedupeKey = `${candidate.category}:${candidate.metric ?? candidate.title}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    merged.push(candidate)
  }

  const rank: Record<InsightSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  }
  return merged.sort((a, b) => rank[a.severity] - rank[b.severity])
}
