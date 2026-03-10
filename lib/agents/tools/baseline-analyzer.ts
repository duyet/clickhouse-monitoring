/**
 * Baseline Analyzer Tool
 *
 * Statistical analysis tool for comparing current metrics against historical baselines.
 * Detects anomalies using rolling averages, z-scores, and percentile-based thresholds.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Statistical Methods
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 1. Rolling Average Baseline: Compute average over historical time window
 * 2. Z-Score Detection: (value - mean) / std_dev > threshold
 * 3. Percentile Thresholds: Values above p95/p99 are anomalies
 * 4. Rate-of-Change: Sudden spikes in query count, memory usage
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { FetchDataResult } from '@/lib/clickhouse/types'

import { fetchData } from '@/lib/clickhouse'

/**
 * Anomaly severity levels
 */
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Anomaly types supported by the detector
 */
export type AnomalyType =
  | 'query_spike' // Query count spike
  | 'memory_anomaly' // Unusual memory usage
  | 'merge_delay' // Merge operation delays
  | 'replication_lag' // Replication lag spikes
  | 'disk_change' // Unusual disk usage changes
  | 'error_rate' // Elevated error rates

/**
 * Detected anomaly with actionable insights
 */
export interface Anomaly {
  /** Anomaly identifier */
  readonly id: string
  /** Type of anomaly detected */
  readonly type: AnomalyType
  /** Severity level */
  readonly severity: AnomalySeverity
  /** Human-readable title */
  readonly title: string
  /** Detailed description */
  readonly description: string
  /** Current value that triggered the anomaly */
  readonly currentValue: number
  /** Baseline value for comparison */
  readonly baselineValue: number
  /** Deviation from baseline (percentage) */
  readonly deviation: number
  /** Timestamp when anomaly was detected */
  readonly timestamp: Date
  /** Recommended action to resolve */
  readonly recommendedAction: string
  /** Related query for investigation */
  readonly investigationQuery?: string
  /** Additional context/metadata */
  readonly context?: Record<string, unknown>
}

/**
 * Baseline analysis result
 */
export interface BaselineAnalysis {
  /** Anomalies detected */
  readonly anomalies: readonly Anomaly[]
  /** Analysis metadata */
  readonly metadata: {
    readonly timeRange: string
    readonly dataPoints: number
    readonly analysisDuration: number
  }
}

/**
 * Configuration for baseline analyzer
 */
export interface BaselineAnalyzerConfig {
  /** Host identifier */
  readonly hostId: number
  /** Time window for baseline calculation (hours) */
  readonly baselineHours?: number
  /** Time window for current values (hours) */
  readonly currentHours?: number
  /** Z-score threshold for anomaly detection */
  readonly zScoreThreshold?: number
  /** Minimum deviation percentage to trigger alert */
  readonly minDeviationPercent?: number
  /** Which anomaly types to check */
  readonly anomalyTypes?: readonly AnomalyType[]
}

/** Default configuration values */
const DEFAULT_CONFIG = {
  baselineHours: 24, // 24 hours of historical data
  currentHours: 1, // Compare against last hour
  zScoreThreshold: 2.5, // 2.5 standard deviations
  minDeviationPercent: 50, // 50% deviation minimum
} as const satisfies Required<
  Omit<BaselineAnalyzerConfig, 'hostId' | 'anomalyTypes'>
>

/**
 * Calculate statistical metrics from an array of numbers
 */
function calculateStats(values: readonly number[]): {
  readonly mean: number
  readonly stdDev: number
  readonly p50: number
  readonly p95: number
  readonly p99: number
  readonly min: number
  readonly max: number
} {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0 }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((a, b) => a + b, 0)
  const mean = sum / values.length

  // Standard deviation
  const squaredDiffs = values.map((v) => (v - mean) ** 2)
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
  const stdDev = Math.sqrt(variance)

  // Percentiles
  const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0
  const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0

  return {
    mean,
    stdDev,
    p50,
    p95,
    p99,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
  }
}

/**
 * Calculate Z-score for a value
 */
function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0
  return (value - mean) / stdDev
}

/**
 * Determine severity from deviation and z-score
 */
function determineSeverity(
  deviation: number,
  zScore: number,
  config: Required<Omit<BaselineAnalyzerConfig, 'anomalyTypes'>>
): AnomalySeverity {
  const { minDeviationPercent, zScoreThreshold } = config

  if (deviation > 300 || zScore > zScoreThreshold * 2) return 'critical'
  if (deviation > 200 || zScore > zScoreThreshold * 1.5) return 'high'
  if (deviation > 100 || zScore > zScoreThreshold) return 'medium'
  if (deviation > minDeviationPercent) return 'low'
  return 'low'
}

/**
 * Detect query count spikes
 */
async function detectQuerySpike(
  config: Required<Omit<BaselineAnalyzerConfig, 'anomalyTypes'>>
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = []

  // Query: Compare current query count to baseline
  const query = `
    SELECT
      toUnixTimestamp(toStartOfMinute(event_time)) * 1000 as timestamp,
      count() as query_count
    FROM system.query_log
    WHERE type = 'QueryFinish'
      AND event_time >= now() - INTERVAL ${config.baselineHours} HOUR
    GROUP BY toStartOfMinute(event_time)
    ORDER BY event_time ASC
  `

  const result = await fetchData({
    query,
    query_params: {},
    format: 'JSONEachRow',
    hostId: config.hostId,
  })

  if (!result.data || !Array.isArray(result.data)) {
    return []
  }

  const data = result.data as readonly {
    readonly timestamp: number
    readonly query_count: string
  }[]

  // Split into baseline (historical) and current (recent)
  const splitPoint = Date.now() - config.currentHours * 60 * 60 * 1000
  const baseline = data
    .filter((d) => d.timestamp < splitPoint)
    .map((d) => Number(d.query_count))
  const current = data
    .filter((d) => d.timestamp >= splitPoint)
    .map((d) => Number(d.query_count))

  if (baseline.length === 0 || current.length === 0) {
    return []
  }

  const stats = calculateStats(baseline)
  const currentAvg = current.reduce((a, b) => a + b, 0) / current.length

  // Check if current average exceeds threshold
  const zScore = calculateZScore(currentAvg, stats.mean, stats.stdDev)
  const deviation = ((currentAvg - stats.mean) / stats.mean) * 100

  if (
    currentAvg > stats.mean &&
    (deviation > config.minDeviationPercent ||
      Math.abs(zScore) > config.zScoreThreshold)
  ) {
    const severity = determineSeverity(deviation, zScore, config)

    anomalies.push({
      id: crypto.randomUUID(),
      type: 'query_spike',
      severity,
      title: `Query count ${severity === 'critical' ? 'spike' : 'increase'} detected`,
      description: `Current query rate (${currentAvg.toFixed(0)}/min) is ${deviation.toFixed(0)}% above the ${config.baselineHours}h baseline of ${stats.mean.toFixed(0)}/min`,
      currentValue: currentAvg,
      baselineValue: stats.mean,
      deviation,
      timestamp: new Date(),
      recommendedAction:
        severity === 'critical'
          ? 'Investigate top consumers and consider rate limiting. Check for runaway queries or application bugs.'
          : 'Review slow queries and optimize expensive operations.',
      investigationQuery: `SELECT user, query, count() as cnt FROM system.query_log WHERE type = 'QueryFinish' AND event_time >= now() - INTERVAL ${config.currentHours} HOUR GROUP BY user, query ORDER BY cnt DESC LIMIT 10`,
      context: {
        zScore: zScore.toFixed(2),
        baselineStdDev: stats.stdDev.toFixed(0),
        baselineMax: stats.max,
      },
    })
  }

  return anomalies
}

/**
 * Detect memory usage anomalies
 */
async function detectMemoryAnomaly(
  config: Required<Omit<BaselineAnalyzerConfig, 'anomalyTypes'>>
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = []

  const query = `
    SELECT
      toUnixTimestamp(toStartOfFiveMinutes(event_time)) * 1000 as timestamp,
      avg(memory_usage) as avg_memory
    FROM system.query_log
    WHERE type = 'QueryFinish'
      AND event_time >= now() - INTERVAL ${config.baselineHours} HOUR
    GROUP BY toStartOfFiveMinutes(event_time)
    ORDER BY event_time ASC
  `

  const result = await fetchData({
    query,
    query_params: {},
    format: 'JSONEachRow',
    hostId: config.hostId,
  })

  if (!result.data || !Array.isArray(result.data)) {
    return []
  }

  const data = result.data as readonly {
    readonly timestamp: number
    readonly avg_memory: string
  }[]

  const splitPoint = Date.now() - config.currentHours * 60 * 60 * 1000
  const baseline = data
    .filter((d) => d.timestamp < splitPoint)
    .map((d) => Number(d.avg_memory))
  const current = data
    .filter((d) => d.timestamp >= splitPoint)
    .map((d) => Number(d.avg_memory))

  if (baseline.length === 0 || current.length === 0) {
    return []
  }

  const stats = calculateStats(baseline)
  const currentAvg = current.reduce((a, b) => a + b, 0) / current.length

  const zScore = calculateZScore(currentAvg, stats.mean, stats.stdDev)
  const deviation =
    stats.mean > 0 ? ((currentAvg - stats.mean) / stats.mean) * 100 : 0

  // Memory anomalies are significant even at lower thresholds
  const memoryThreshold = config.minDeviationPercent * 0.5 // More sensitive

  if (currentAvg > stats.p95 && deviation > memoryThreshold) {
    const severity = determineSeverity(deviation, zScore, {
      ...config,
      minDeviationPercent: memoryThreshold,
    })

    anomalies.push({
      id: crypto.randomUUID(),
      type: 'memory_anomaly',
      severity,
      title: `Memory usage elevated`,
      description: `Current average memory usage (${(currentAvg / 1024 / 1024 / 1024).toFixed(2)} GB) exceeds p95 baseline (${(stats.p95 / 1024 / 1024 / 1024).toFixed(2)} GB)`,
      currentValue: currentAvg,
      baselineValue: stats.p95,
      deviation,
      timestamp: new Date(),
      recommendedAction:
        'Check for memory-intensive queries. Consider max_memory_usage limits or query optimization.',
      investigationQuery: `SELECT user, query, formatReadableSize(avg(memory_usage)) as avg_mem, count() FROM system.query_log WHERE type = 'QueryFinish' AND event_time >= now() - INTERVAL ${config.currentHours} HOUR GROUP BY user, query ORDER BY avg_mem DESC LIMIT 10`,
      context: {
        zScore: zScore.toFixed(2),
        p95Baseline: stats.p95,
      },
    })
  }

  return anomalies
}

/**
 * Detect merge operation delays
 */
async function detectMergeDelay(
  config: Required<Omit<BaselineAnalyzerConfig, 'anomalyTypes'>>
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = []

  const query = `
    SELECT
      toUnixTimestamp(toStartOfFiveMinutes(event_time)) * 1000 as timestamp,
      avg(elapsed) as avg_elapsed
    FROM system.part_log
    WHERE event_type = 'MergeParts'
      AND event_time >= now() - INTERVAL ${config.baselineHours} HOUR
    GROUP BY toStartOfFiveMinutes(event_time)
    ORDER BY event_time ASC
  `

  const result = await fetchData({
    query,
    query_params: {},
    format: 'JSONEachRow',
    hostId: config.hostId,
  })

  if (!result.data || !Array.isArray(result.data)) {
    return []
  }

  const data = result.data as readonly {
    readonly timestamp: number
    readonly avg_elapsed: string
  }[]

  const splitPoint = Date.now() - config.currentHours * 60 * 60 * 1000
  const baseline = data
    .filter((d) => d.timestamp < splitPoint)
    .map((d) => Number(d.avg_elapsed))
  const current = data
    .filter((d) => d.timestamp >= splitPoint)
    .map((d) => Number(d.avg_elapsed))

  if (baseline.length === 0 || current.length === 0) {
    return []
  }

  const stats = calculateStats(baseline)
  const currentAvg = current.reduce((a, b) => a + b, 0) / current.length

  const zScore = calculateZScore(currentAvg, stats.mean, stats.stdDev)
  const deviation =
    stats.mean > 0 ? ((currentAvg - stats.mean) / stats.mean) * 100 : 0

  const mergeThreshold = config.minDeviationPercent * 0.75

  if (currentAvg > stats.p95 && deviation > mergeThreshold) {
    const severity = determineSeverity(deviation, zScore, {
      ...config,
      minDeviationPercent: mergeThreshold,
    })

    anomalies.push({
      id: crypto.randomUUID(),
      type: 'merge_delay',
      severity,
      title: `Merge operations delayed`,
      description: `Merge operations averaging ${(currentAvg).toFixed(1)}s, ${(deviation).toFixed(0)}% above baseline`,
      currentValue: currentAvg,
      baselineValue: stats.p95,
      deviation,
      timestamp: new Date(),
      recommendedAction:
        'Check for disk I/O bottlenecks, large parts, or concurrent merges. Consider adjusting parts_to_throw_insert and parts_to_merge_with_max_insert_size.',
      investigationQuery: `SELECT database, table, avg(elapsed) as avg_time, count() FROM system.part_log WHERE event_type = 'MergeParts' AND event_time >= now() - INTERVAL ${config.currentHours} HOUR GROUP BY database, table ORDER BY avg_time DESC LIMIT 10`,
      context: {
        zScore: zScore.toFixed(2),
        p95Baseline: stats.p95,
      },
    })
  }

  return anomalies
}

/**
 * Detect replication lag spikes
 */
async function detectReplicationLag(
  config: Required<Omit<BaselineAnalyzerConfig, 'anomalyTypes'>>
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = []

  // Check if system.replication_queue exists
  const checkResult = await fetchData({
    query: 'SELECT count() as cnt FROM system.replication_queue LIMIT 1',
    query_params: {},
    format: 'JSONEachRow',
    hostId: config.hostId,
  })

  // If table doesn't exist, skip this check
  if (!checkResult.data) {
    return []
  }

  const query = `
    SELECT
      toUnixTimestamp(toStartOfFiveMinutes(event_time)) * 1000 as timestamp,
      avg(replication_lag) as avg_lag
    FROM system.replication_queue
    WHERE event_time >= now() - INTERVAL ${config.baselineHours} HOUR
    GROUP BY toStartOfFiveMinutes(event_time)
    ORDER BY event_time ASC
  `

  const result = await fetchData({
    query,
    query_params: {},
    format: 'JSONEachRow',
    hostId: config.hostId,
  })

  if (!result.data || !Array.isArray(result.data)) {
    return []
  }

  const data = result.data as readonly {
    readonly timestamp: number
    readonly avg_lag: string
  }[]

  const splitPoint = Date.now() - config.currentHours * 60 * 60 * 1000
  const baseline = data
    .filter((d) => d.timestamp < splitPoint)
    .map((d) => Number(d.avg_lag))
  const current = data
    .filter((d) => d.timestamp >= splitPoint)
    .map((d) => Number(d.avg_lag))

  if (baseline.length === 0 || current.length === 0) {
    return []
  }

  const stats = calculateStats(baseline)
  const currentAvg = current.reduce((a, b) => a + b, 0) / current.length

  // Replication lag is critical even at low absolute values
  if (currentAvg > 10 && currentAvg > stats.p95) {
    // 10 seconds is concerning
    const deviation =
      stats.mean > 0 ? ((currentAvg - stats.mean) / stats.mean) * 100 : 100
    const zScore = calculateZScore(currentAvg, stats.mean, stats.stdDev)

    anomalies.push({
      id: crypto.randomUUID(),
      type: 'replication_lag',
      severity:
        currentAvg > 60 ? 'critical' : currentAvg > 30 ? 'high' : 'medium',
      title: `Replication lag elevated`,
      description: `Replication lag at ${currentAvg.toFixed(1)}s, exceeding baseline p95 of ${stats.p95.toFixed(1)}s`,
      currentValue: currentAvg,
      baselineValue: stats.p95,
      deviation,
      timestamp: new Date(),
      recommendedAction:
        'Check network connectivity between replicas, disk performance, and replication queue.',
      investigationQuery: `SELECT database, table, avg(replication_lag) as avg_lag, count() FROM system.replication_queue WHERE event_time >= now() - INTERVAL ${config.currentHours} HOUR GROUP BY database, table ORDER BY avg_lag DESC`,
      context: {
        zScore: zScore.toFixed(2),
        baselineMean: stats.mean,
      },
    })
  }

  return anomalies
}

/**
 * Detect error rate spikes
 */
async function detectErrorRate(
  config: Required<Omit<BaselineAnalyzerConfig, 'anomalyTypes'>>
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = []

  const query = `
    SELECT
      toUnixTimestamp(toStartOfFiveMinutes(event_time)) * 1000 as timestamp,
      countIf(type = 'ExceptionBeforeStart' OR type = 'ExceptionWhileProcessing') * 100.0 / count() as error_rate
    FROM system.query_log
    WHERE type IN ('QueryFinish', 'ExceptionBeforeStart', 'ExceptionWhileProcessing')
      AND event_time >= now() - INTERVAL ${config.baselineHours} HOUR
    GROUP BY toStartOfFiveMinutes(event_time)
    ORDER BY event_time ASC
  `

  const result = await fetchData({
    query,
    query_params: {},
    format: 'JSONEachRow',
    hostId: config.hostId,
  })

  if (!result.data || !Array.isArray(result.data)) {
    return []
  }

  const data = result.data as readonly {
    readonly timestamp: number
    readonly error_rate: string
  }[]

  const splitPoint = Date.now() - config.currentHours * 60 * 60 * 1000
  const baseline = data
    .filter((d) => d.timestamp < splitPoint)
    .map((d) => Number(d.error_rate))
  const current = data
    .filter((d) => d.timestamp >= splitPoint)
    .map((d) => Number(d.error_rate))

  if (baseline.length === 0 || current.length === 0) {
    return []
  }

  const stats = calculateStats(baseline)
  const currentAvg = current.reduce((a, b) => a + b, 0) / current.length

  // Error rate is always concerning
  if (currentAvg > 1 && currentAvg > stats.p95 * 1.5) {
    // 1% error rate is concerning
    const deviation =
      stats.mean > 0 ? ((currentAvg - stats.mean) / stats.mean) * 100 : 100

    anomalies.push({
      id: crypto.randomUUID(),
      type: 'error_rate',
      severity:
        currentAvg > 5 ? 'critical' : currentAvg > 2 ? 'high' : 'medium',
      title: `Elevated error rate`,
      description: `Query error rate at ${currentAvg.toFixed(2)}%, exceeding baseline`,
      currentValue: currentAvg,
      baselineValue: stats.mean,
      deviation,
      timestamp: new Date(),
      recommendedAction:
        'Review error logs for common patterns. Check for syntax errors, permission issues, or resource constraints.',
      investigationQuery: `SELECT exception_code, exception_text, count() as cnt FROM system.query_log WHERE type LIKE 'Exception%' AND event_time >= now() - INTERVAL ${config.currentHours} HOUR GROUP BY exception_code, exception_text ORDER BY cnt DESC LIMIT 10`,
      context: {
        baselineP95: stats.p95,
      },
    })
  }

  return anomalies
}

/**
 * Main baseline analysis function
 *
 * Detects anomalies across multiple metric types using statistical comparison
 * against historical baselines.
 */
export async function analyzeBaselines(
  inputConfig: BaselineAnalyzerConfig
): Promise<BaselineAnalysis> {
  const start = Date.now()

  const effectiveConfig: Required<
    Omit<BaselineAnalyzerConfig, 'anomalyTypes'>
  > & {
    readonly anomalyTypes: readonly AnomalyType[]
  } = {
    hostId: inputConfig.hostId,
    baselineHours: inputConfig.baselineHours ?? DEFAULT_CONFIG.baselineHours,
    currentHours: inputConfig.currentHours ?? DEFAULT_CONFIG.currentHours,
    zScoreThreshold:
      inputConfig.zScoreThreshold ?? DEFAULT_CONFIG.zScoreThreshold,
    minDeviationPercent:
      inputConfig.minDeviationPercent ?? DEFAULT_CONFIG.minDeviationPercent,
    anomalyTypes: inputConfig.anomalyTypes ?? [
      'query_spike',
      'memory_anomaly',
      'merge_delay',
      'replication_lag',
      'error_rate',
    ],
  }

  const allAnomalies: Anomaly[] = []

  // Run each detector in parallel
  const detectors: Record<AnomalyType, () => Promise<Anomaly[]>> = {
    query_spike: () => detectQuerySpike(effectiveConfig),
    memory_anomaly: () => detectMemoryAnomaly(effectiveConfig),
    merge_delay: () => detectMergeDelay(effectiveConfig),
    replication_lag: () => detectReplicationLag(effectiveConfig),
    disk_change: async () => [], // Placeholder for future implementation
    error_rate: () => detectErrorRate(effectiveConfig),
  }

  // Execute enabled detectors in parallel
  const results = await Promise.allSettled(
    effectiveConfig.anomalyTypes.map((type) => detectors[type]())
  )

  // Collect successful results
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allAnomalies.push(...result.value)
    }
  }

  // Sort by severity and deviation
  const severityOrder: Record<AnomalySeverity, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  }

  const sortedAnomalies = allAnomalies.sort(
    (a, b) =>
      severityOrder[b.severity] - severityOrder[a.severity] ||
      b.deviation - a.deviation
  )

  return {
    anomalies: sortedAnomalies,
    metadata: {
      timeRange: `Last ${effectiveConfig.baselineHours}h baseline vs ${effectiveConfig.currentHours}h current`,
      dataPoints: allAnomalies.length,
      analysisDuration: Date.now() - start,
    },
  }
}

/**
 * Quick check for critical anomalies only
 *
 * Faster version that only checks for critical-level anomalies.
 */
export async function quickAnomalyCheck(
  hostId: number,
  types?: readonly AnomalyType[]
): Promise<readonly Anomaly[]> {
  const result = await analyzeBaselines({
    hostId,
    baselineHours: 6, // Shorter baseline for quick check
    currentHours: 0.25, // Last 15 minutes
    minDeviationPercent: 100, // 2x threshold
    zScoreThreshold: 3, // Strict threshold
    anomalyTypes: types ?? ['query_spike', 'memory_anomaly', 'error_rate'],
  })

  return result.anomalies.filter((a) => a.severity === 'critical')
}
