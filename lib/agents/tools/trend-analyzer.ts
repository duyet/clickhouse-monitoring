/**
 * Trend Analyzer Tool for ClickHouse Monitoring
 *
 * Provides trend analysis capabilities for the AI agent system.
 * Analyzes query performance, cluster health, and resource usage patterns.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Tool Architecture
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This tool provides structured data about:
 * - Query performance trends (duration, memory, failures)
 * - Cluster health status (replicas, merges, disks)
 * - Top resource consumers (tables, users, queries)
 * - Merge operation analysis
 * - Recommendations for optimization
 *
 * Data is aggregated from ClickHouse system tables and returned in a
 * structured format suitable for LLM consumption.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { FetchDataResult } from '@/lib/clickhouse/types'

import { fetchData } from '@/lib/clickhouse'

/**
 * Time period for trend analysis
 */
export type TrendPeriod = '1h' | '6h' | '24h' | '7d' | '30d'

/**
 * Severity level for insights
 */
export type InsightSeverity = 'info' | 'warning' | 'critical'

/**
 * Category of insight
 */
export type InsightCategory =
  | 'query_performance'
  | 'cluster_health'
  | 'resource_usage'
  | 'merge_operations'
  | 'optimization'

/**
 * A single insight with recommendation
 */
export interface Insight {
  /** Category of the insight */
  readonly category: InsightCategory
  /** Severity level */
  readonly severity: InsightSeverity
  /** Brief title */
  readonly title: string
  /** Detailed description */
  readonly description: string
  /** Metric value (if applicable) */
  readonly metric?: string | number
  /** Trend direction */
  readonly trend?: 'up' | 'down' | 'stable'
  /** Actionable recommendation */
  readonly recommendation?: string
  /** Related tables */
  readonly relatedTables?: readonly string[]
}

/**
 * Query performance trend data
 */
export interface QueryPerformanceTrend {
  /** Average query duration (ms) */
  readonly avgDuration: number
  /** Previous period average */
  readonly prevAvgDuration: number
  /** Total queries executed */
  readonly totalQueries: number
  /** Failed queries count */
  readonly failedQueries: number
  /** Slow queries (>1s) count */
  readonly slowQueries: number
  /** Query cache hit rate (%) */
  readonly cacheHitRate: number
}

/**
 * Cluster health status
 */
export interface ClusterHealthStatus {
  /** Overall health score (0-100) */
  readonly healthScore: number
  /** Number of replicas */
  readonly replicaCount: number
  /** Replicas with issues */
  readonly replicasWithIssues: number
  /** Active merge operations */
  readonly activeMerges: number
  /** Long-running merges (>1h) */
  readonly longRunningMerges: number
  /** Disk usage percentage */
  readonly diskUsage: number
}

/**
 * Top resource consumer
 */
export interface TopConsumer {
  /** Name (table, user, etc.) */
  readonly name: string
  /** Resource value */
  readonly value: number
  /** Human-readable value */
  readonly readableValue: string
  /** Percentage of total */
  readonly percentage: number
}

/**
 * Complete trend analysis result
 */
export interface TrendAnalysis {
  /** Analysis period */
  readonly period: TrendPeriod
  /** Timestamp of analysis */
  readonly timestamp: number
  /** Query performance trends */
  readonly queryPerformance?: QueryPerformanceTrend
  /** Cluster health status */
  readonly clusterHealth?: ClusterHealthStatus
  /** Top tables by size */
  readonly topTables?: readonly TopConsumer[]
  /** Top users by query count */
  readonly topUsers?: readonly TopConsumer[]
  /** Merge operation status */
  readonly mergeStatus?: {
    readonly active: number
    readonly longRunning: number
    readonly avgProgress: number
  }
  /** Generated insights */
  readonly insights: readonly Insight[]
}

/**
 * Convert period to ClickHouse INTERVAL
 */
function periodToInterval(period: TrendPeriod): string {
  const intervals: Record<TrendPeriod, string> = {
    '1h': '1 HOUR',
    '6h': '6 HOUR',
    '24h': '24 HOUR',
    '7d': '7 DAY',
    '30d': '30 DAY',
  }
  return intervals[period]
}

/**
 * Analyze query performance trends
 */
async function analyzeQueryTrends(
  hostId: number,
  period: TrendPeriod
): Promise<QueryPerformanceTrend | undefined> {
  const interval = periodToInterval(period)

  try {
    // Query current period stats
    const currentQuery = `
      SELECT
        avg(query_duration_ms) AS avg_duration,
        count() AS total_queries,
        countIf(exception_text != '') AS failed_queries,
        countIf(query_duration_ms > 1000) AS slow_queries,
        countIf(query_cache_usage = 'Hit') * 100.0 / count() AS cache_hit_rate
      FROM system.query_log
      WHERE type = 'QueryFinish'
        AND event_time >= now() - INTERVAL ${interval}
    `

    const current = await fetchData({
      query: currentQuery,
      hostId,
      format: 'JSONEachRow',
    })

    if (
      !current.data ||
      !Array.isArray(current.data) ||
      current.data.length === 0
    ) {
      return undefined
    }

    const row = current.data[0] as Record<string, unknown>

    // Query previous period for comparison
    const prevQuery = `
      SELECT
        avg(query_duration_ms) AS avg_duration
      FROM system.query_log
      WHERE type = 'QueryFinish'
        AND event_time >= now() - INTERVAL ${interval} * 2
        AND event_time < now() - INTERVAL ${interval}
    `

    const prev = await fetchData({
      query: prevQuery,
      hostId,
      format: 'JSONEachRow',
    })
    const prevAvgDuration =
      prev.data && Array.isArray(prev.data) && prev.data.length > 0
        ? ((prev.data[0] as Record<string, unknown>).avg_duration as number)
        : 0

    return {
      avgDuration: (row.avg_duration as number) ?? 0,
      prevAvgDuration,
      totalQueries: (row.total_queries as number) ?? 0,
      failedQueries: (row.failed_queries as number) ?? 0,
      slowQueries: (row.slow_queries as number) ?? 0,
      cacheHitRate: (row.cache_hit_rate as number) ?? 0,
    }
  } catch {
    return undefined
  }
}

/**
 * Analyze cluster health
 */
async function analyzeClusterHealth(
  hostId: number
): Promise<ClusterHealthStatus | undefined> {
  try {
    // Check for replicas with issues
    const replicasQuery = `
      SELECT
        count() AS total_replicas,
        countIf(is_readonly = 1 OR is_session_expired = 1 OR queue_size > 0) AS issues
      FROM system.replicas
    `

    const replicas = await fetchData({
      query: replicasQuery,
      hostId,
      format: 'JSONEachRow',
    })
    const replicaRow =
      replicas.data && Array.isArray(replicas.data) && replicas.data.length > 0
        ? (replicas.data[0] as Record<string, unknown>)
        : undefined

    // Check active merges
    const mergesQuery = `
      SELECT
        count() AS active_merges,
        countIf(elapsed > 3600) AS long_running,
        avg(progress) * 100 AS avg_progress
      FROM system.merges
    `

    const merges = await fetchData({
      query: mergesQuery,
      hostId,
      format: 'JSONEachRow',
    })
    const mergeRow =
      merges.data && Array.isArray(merges.data) && merges.data.length > 0
        ? (merges.data[0] as Record<string, unknown>)
        : undefined

    // Check disk usage from asynchronous metrics
    const diskQuery = `
      SELECT
        sum(value) AS total_bytes,
        max(value) AS max_bytes
      FROM system.asynchronous_metrics
      WHERE metric LIKE 'Disk%Used'
    `

    const disk = await fetchData({
      query: diskQuery,
      hostId,
      format: 'JSONEachRow',
    })
    let diskUsage = 0
    if (disk.data && Array.isArray(disk.data) && disk.data.length > 0) {
      const diskRow = disk.data[0] as Record<string, unknown>
      const total = (diskRow.total_bytes as number) ?? 0
      const max = (diskRow.max_bytes as number) ?? 1
      diskUsage = max > 0 ? (total / max) * 100 : 0
    }

    const totalReplicas = (replicaRow?.total_replicas as number) ?? 0
    const issues = (replicaRow?.issues as number) ?? 0

    // Calculate health score (0-100)
    let healthScore = 100
    if (totalReplicas > 0 && issues > 0) {
      healthScore -= (issues / totalReplicas) * 30
    }
    if (diskUsage > 80) {
      healthScore -= (diskUsage - 80) * 2
    }
    healthScore = Math.max(0, Math.min(100, healthScore))

    return {
      healthScore: Math.round(healthScore),
      replicaCount: totalReplicas,
      replicasWithIssues: issues,
      activeMerges: (mergeRow?.active_merges as number) ?? 0,
      longRunningMerges: (mergeRow?.long_running as number) ?? 0,
      diskUsage: Math.round(diskUsage),
    }
  } catch {
    return undefined
  }
}

/**
 * Get top resource consumers
 */
async function getTopConsumers(
  hostId: number,
  period: TrendPeriod
): Promise<{
  readonly topTables?: readonly TopConsumer[]
  readonly topUsers?: readonly TopConsumer[]
}> {
  const interval = periodToInterval(period)

  try {
    // Top tables by bytes read
    const tablesQuery = `
      SELECT
        concat(database, '.', table) AS name,
        sum(read_bytes) AS value,
        formatReadableSize(sum(read_bytes)) AS readable_value
      FROM system.query_log
      WHERE type = 'QueryFinish'
        AND event_time >= now() - INTERVAL ${interval}
      GROUP BY database, table
      ORDER BY value DESC
      LIMIT 5
    `

    const tables = await fetchData({
      query: tablesQuery,
      hostId,
      format: 'JSONEachRow',
    })

    const topTables: TopConsumer[] =
      tables.data && Array.isArray(tables.data)
        ? tables.data.map((row) => {
            const r = row as Record<string, unknown>
            return {
              name: r.name as string,
              value: r.value as number,
              readableValue: r.readable_value as string,
              percentage: 0, // Will be calculated
            }
          })
        : []

    // Calculate percentages
    const totalBytes = topTables.reduce((sum, t) => sum + t.value, 0)
    if (totalBytes > 0) {
      for (const table of topTables) {
        ;(table as { percentage: number }).percentage =
          (table.value / totalBytes) * 100
      }
    }

    // Top users by query count
    const usersQuery = `
      SELECT
        user AS name,
        count() AS value,
        formatReadableQuantity(count()) AS readable_value
      FROM system.query_log
      WHERE type = 'QueryFinish'
        AND event_time >= now() - INTERVAL ${interval}
      GROUP BY user
      ORDER BY value DESC
      LIMIT 5
    `

    const users = await fetchData({
      query: usersQuery,
      hostId,
      format: 'JSONEachRow',
    })

    const totalQueries =
      users.data && Array.isArray(users.data)
        ? users.data.reduce<number>(
            (sum, r) => sum + ((r as Record<string, unknown>).value as number),
            0
          )
        : 0

    const topUsers: TopConsumer[] =
      users.data && Array.isArray(users.data)
        ? users.data.map((row) => {
            const r = row as Record<string, unknown>
            return {
              name: r.name as string,
              value: r.value as number,
              readableValue: r.readable_value as string,
              percentage:
                totalQueries > 0
                  ? ((r.value as number) / totalQueries) * 100
                  : 0,
            }
          })
        : []

    return { topTables, topUsers }
  } catch {
    return {}
  }
}

/**
 * Generate insights from analyzed data
 */
function generateInsights(
  queryPerf: QueryPerformanceTrend | undefined,
  clusterHealth: ClusterHealthStatus | undefined,
  topConsumers: {
    readonly topTables?: readonly TopConsumer[]
    readonly topUsers?: readonly TopConsumer[]
  },
  period: TrendPeriod
): Insight[] {
  const insights: Insight[] = []

  // Query performance insights
  if (queryPerf) {
    const durationChange =
      queryPerf.prevAvgDuration > 0
        ? ((queryPerf.avgDuration - queryPerf.prevAvgDuration) /
            queryPerf.prevAvgDuration) *
          100
        : 0

    if (Math.abs(durationChange) > 20) {
      insights.push({
        category: 'query_performance',
        severity: durationChange > 0 ? 'warning' : 'info',
        title: `Query duration ${durationChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(durationChange).toFixed(0)}%`,
        description: `Average query duration changed from ${queryPerf.prevAvgDuration.toFixed(0)}ms to ${queryPerf.avgDuration.toFixed(0)}ms over the last ${period}.`,
        metric: `${queryPerf.avgDuration.toFixed(0)}ms`,
        trend: durationChange > 0 ? 'up' : 'down',
        recommendation:
          durationChange > 0
            ? 'Review slow queries and consider adding indexes or optimizing query patterns.'
            : undefined,
        relatedTables: ['system.query_log'],
      })
    }

    const failRate =
      queryPerf.totalQueries > 0
        ? (queryPerf.failedQueries / queryPerf.totalQueries) * 100
        : 0

    if (failRate > 1) {
      insights.push({
        category: 'query_performance',
        severity: failRate > 5 ? 'critical' : 'warning',
        title: `${failRate.toFixed(1)}% of queries failing`,
        description: `${queryPerf.failedQueries} out of ${queryPerf.totalQueries} queries failed in the last ${period}.`,
        metric: `${queryPerf.failedQueries} queries`,
        trend: 'up',
        recommendation:
          'Check system.query_log for exception patterns and address common errors.',
        relatedTables: ['system.query_log'],
      })
    }

    if (queryPerf.slowQueries > 100) {
      insights.push({
        category: 'query_performance',
        severity: 'warning',
        title: `${queryPerf.slowQueries} slow queries detected`,
        description: `${queryPerf.slowQueries} queries took longer than 1 second to execute.`,
        metric: `${queryPerf.slowQueries} queries`,
        recommendation:
          'Review and optimize slow queries. Consider using query caching or materialized views.',
        relatedTables: ['system.query_log'],
      })
    }

    if (queryPerf.cacheHitRate < 50 && queryPerf.totalQueries > 100) {
      insights.push({
        category: 'optimization',
        severity: 'info',
        title: 'Low query cache hit rate',
        description: `Only ${queryPerf.cacheHitRate.toFixed(0)}% of queries are served from cache.`,
        metric: `${queryPerf.cacheHitRate.toFixed(0)}%`,
        trend: 'stable',
        recommendation:
          'Enable query cache for repeated queries to improve performance.',
      })
    }
  }

  // Cluster health insights
  if (clusterHealth) {
    if (clusterHealth.healthScore < 80) {
      insights.push({
        category: 'cluster_health',
        severity: clusterHealth.healthScore < 60 ? 'critical' : 'warning',
        title: `Cluster health score: ${clusterHealth.healthScore}/100`,
        description:
          clusterHealth.replicasWithIssues > 0
            ? `${clusterHealth.replicasWithIssues} of ${clusterHealth.replicaCount} replicas have issues.`
            : 'Multiple cluster health indicators need attention.',
        metric: `${clusterHealth.healthScore}/100`,
        trend: 'stable',
        recommendation:
          clusterHealth.replicasWithIssues > 0
            ? 'Check replica status and ZooKeeper connectivity.'
            : 'Review cluster metrics and address issues.',
        relatedTables: ['system.replicas', 'system.clusters'],
      })
    }

    if (clusterHealth.diskUsage > 80) {
      insights.push({
        category: 'resource_usage',
        severity: clusterHealth.diskUsage > 90 ? 'critical' : 'warning',
        title: `Disk usage at ${clusterHealth.diskUsage}%`,
        description:
          'Storage is running low. Consider cleaning old data or adding storage.',
        metric: `${clusterHealth.diskUsage}%`,
        trend: 'up',
        recommendation:
          'Review system.parts for large tables, configure TTL for old data, or add disk storage.',
        relatedTables: ['system.parts', 'system.disks'],
      })
    }

    if (clusterHealth.longRunningMerges > 0) {
      insights.push({
        category: 'merge_operations',
        severity: 'info',
        title: `${clusterHealth.longRunningMerges} long-running merge(s)`,
        description:
          'Some merge operations have been running for over an hour.',
        metric: `${clusterHealth.longRunningMerges} merges`,
        trend: 'stable',
        recommendation:
          'Long merges are normal for large tables. Monitor system.merges for progress.',
        relatedTables: ['system.merges', 'system.part_log'],
      })
    }

    if (clusterHealth.activeMerges > 50) {
      insights.push({
        category: 'merge_operations',
        severity: 'warning',
        title: `High merge activity: ${clusterHealth.activeMerges} active merges`,
        description:
          'Many merge operations running simultaneously may affect query performance.',
        metric: `${clusterHealth.activeMerges} merges`,
        trend: 'up',
        recommendation:
          'Consider adjusting parts_to_throw_insert and related merge settings.',
        relatedTables: ['system.merges'],
      })
    }
  }

  // Top consumer insights
  if (topConsumers.topTables && topConsumers.topTables.length > 0) {
    const topTable = topConsumers.topTables[0]
    insights.push({
      category: 'resource_usage',
      severity: 'info',
      title: `Top table: ${topTable.name}`,
      description: `${topTable.name} accounts for ${topTable.percentage.toFixed(0)}% of data read (${topTable.readableValue}).`,
      metric: topTable.readableValue,
      trend: 'stable',
      recommendation:
        'Monitor frequently accessed tables for optimization opportunities.',
      relatedTables: ['system.query_log', 'system.parts'],
    })
  }

  return insights
}

/**
 * Analyze trends and generate insights for a ClickHouse instance
 *
 * @param hostId - ClickHouse host identifier
 * @param period - Time period for analysis
 * @returns Trend analysis with insights
 */
export async function analyzeTrends(
  hostId: number,
  period: TrendPeriod = '24h'
): Promise<TrendAnalysis> {
  // Run analyses in parallel
  const [queryPerf, clusterHealth, topConsumers] = await Promise.all([
    analyzeQueryTrends(hostId, period),
    analyzeClusterHealth(hostId),
    getTopConsumers(hostId, period),
  ])

  // Generate insights from collected data
  const insights = generateInsights(
    queryPerf,
    clusterHealth,
    topConsumers,
    period
  )

  return {
    period,
    timestamp: Date.now(),
    queryPerformance: queryPerf,
    clusterHealth: clusterHealth,
    topTables: topConsumers.topTables,
    topUsers: topConsumers.topUsers,
    insights,
  }
}

/**
 * Get a summary of insights for quick display
 */
export function getInsightsSummary(analysis: TrendAnalysis): {
  readonly critical: number
  readonly warning: number
  readonly info: number
  readonly topInsight?: Insight
} {
  const critical = analysis.insights.filter(
    (i) => i.severity === 'critical'
  ).length
  const warning = analysis.insights.filter(
    (i) => i.severity === 'warning'
  ).length
  const info = analysis.insights.filter((i) => i.severity === 'info').length

  // Get top insight by severity and recency
  const topInsight =
    analysis.insights.find((i) => i.severity === 'critical') ??
    analysis.insights.find((i) => i.severity === 'warning') ??
    analysis.insights[0]

  return { critical, warning, info, topInsight }
}
