/**
 * Replication Lag Health Score (#1914)
 *
 * Per-replica health score: 0-100 scale that combines lag duration and
 * queue depth. Used by the replication lag chart and alert rules.
 *
 * SQL for lag trend (time-series) is exported for use in chart queries.
 */

// ---------------------------------------------------------------------------
// Per-replica health score
// ---------------------------------------------------------------------------

export type ReplicaLagStatus =
  | 'synced'
  | 'slight lag'
  | 'moderate lag'
  | 'severe lag'

/**
 * Map absolute_delay (seconds) to a categorical lag status.
 * Boundaries match the existing replication-lag chart in replication-charts.ts.
 */
export function getLagStatus(absoluteDelaySeconds: number): ReplicaLagStatus {
  if (absoluteDelaySeconds === 0) return 'synced'
  if (absoluteDelaySeconds < 60) return 'slight lag'
  if (absoluteDelaySeconds < 300) return 'moderate lag'
  return 'severe lag'
}

/**
 * Compute a 0-100 health score for a single replica.
 *
 * Base score by lag:
 *   synced        → 100
 *   slight lag    → 75
 *   moderate lag  → 50
 *   severe lag    → 0
 *
 * Queue depth penalty: -5 points per 100 items in the combined queue.
 * Score is clamped to [0, 100].
 */
export function computeReplicaHealthScore(
  absoluteDelaySeconds: number,
  insertsInQueue = 0,
  mergesInQueue = 0
): number {
  let base: number
  if (absoluteDelaySeconds === 0) base = 100
  else if (absoluteDelaySeconds < 60) base = 75
  else if (absoluteDelaySeconds < 300) base = 50
  else base = 0

  const totalQueue = insertsInQueue + mergesInQueue
  const queuePenalty = Math.floor(totalQueue / 100) * 5

  return Math.max(0, Math.min(100, base - queuePenalty))
}

// ---------------------------------------------------------------------------
// Lag trend SQL
// ---------------------------------------------------------------------------

/**
 * SQL for the replication lag trend chart (time-series of max lag).
 *
 * Uses system.metric_log which records `CurrentMetric_ReplicasMaxAbsoluteDelay`
 * every few seconds. Falls back to 0 when metric_log is absent.
 *
 * @param lastHours  How many hours back to query (default 24)
 * @param interval   Time bucket interval function (default toStartOfFiveMinutes)
 */
export function buildLagTrendSQL(
  lastHours = 24,
  interval = 'toStartOfFiveMinutes'
): string {
  return `
SELECT
  ${interval}(event_time) AS ts,
  max(CurrentMetric_ReplicasMaxAbsoluteDelay) AS max_lag_seconds,
  avg(CurrentMetric_ReplicasMaxAbsoluteDelay) AS avg_lag_seconds
FROM merge('system', '^metric_log')
WHERE event_time > now() - INTERVAL ${lastHours} HOUR
GROUP BY ts
ORDER BY ts
`
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReplicaHealthRow {
  database: string
  table: string
  replica_name: string
  absolute_delay: number
  inserts_in_queue: number
  merges_in_queue: number
  lag_status: ReplicaLagStatus
  health_score: number
  [key: string]: string | number
}

export interface LagTrendPoint {
  ts: string
  max_lag_seconds: number
  avg_lag_seconds: number
  [key: string]: string | number
}
