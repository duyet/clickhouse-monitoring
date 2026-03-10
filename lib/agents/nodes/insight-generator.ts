/**
 * Insight Generator Node for ClickHouse AI Agent
 *
 * This LangGraph node generates proactive insights and recommendations
 * from ClickHouse monitoring data. It analyzes trends, identifies issues,
 * and provides actionable recommendations.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Node Architecture
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Input: AgentState with hostId
 * Process:
 *   1. Run trend analysis queries on ClickHouse system tables
 *   2. Analyze query performance, cluster health, resource usage
 *   3. Generate insights with severity levels and recommendations
 *   4. Return structured insights in the response
 *
 * Output: Partial AgentState with response containing insights
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { AgentState } from '../state'

import {
  analyzeTrends,
  type TrendAnalysis,
  type TrendPeriod,
} from '../tools/trend-analyzer'

/**
 * Configuration for insight generator node
 */
export interface InsightGeneratorConfig {
  /** Time period for trend analysis */
  readonly period?: TrendPeriod
  /** Maximum number of insights to generate */
  readonly maxInsights?: number
  /** Whether to include recommendations */
  readonly includeRecommendations?: boolean
  /** Debug mode for logging */
  readonly debug?: boolean
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<InsightGeneratorConfig> = {
  period: '24h',
  maxInsights: 10,
  includeRecommendations: true,
  debug: process.env.NODE_ENV === 'development',
}

/**
 * Format trend analysis into human-readable response
 */
function formatInsightsResponse(
  analysis: TrendAnalysis,
  config: Required<InsightGeneratorConfig>
): {
  readonly content: string
  readonly suggestions: readonly string[]
} {
  const insights = analysis.insights.slice(0, config.maxInsights)

  // Count by severity
  const criticalCount = insights.filter((i) => i.severity === 'critical').length
  const warningCount = insights.filter((i) => i.severity === 'warning').length
  const infoCount = insights.filter((i) => i.severity === 'info').length

  let content = `# ClickHouse Insights (${analysis.period})\n\n`

  // Summary header
  if (criticalCount > 0 || warningCount > 0) {
    content += `**Attention Required:** ${criticalCount} critical, ${warningCount} warning issues found.\n\n`
  } else {
    content += `**System Status:** ${infoCount} informational insights. No critical issues detected.\n\n`
  }

  // Query performance summary
  if (analysis.queryPerformance) {
    const qp = analysis.queryPerformance
    content += `## Query Performance\n\n`
    content += `- **Total Queries:** ${qp.totalQueries.toLocaleString()}\n`
    content += `- **Avg Duration:** ${qp.avgDuration.toFixed(0)}ms`
    if (qp.prevAvgDuration > 0) {
      const change =
        ((qp.avgDuration - qp.prevAvgDuration) / qp.prevAvgDuration) * 100
      content += ` (${change > 0 ? '+' : ''}${change.toFixed(0)}%)`
    }
    content += `\n`
    if (qp.failedQueries > 0) {
      const failRate = (qp.failedQueries / qp.totalQueries) * 100
      content += `- **Failed Queries:** ${qp.failedQueries} (${failRate.toFixed(1)}%)\n`
    }
    content += '\n'
  }

  // Cluster health summary
  if (analysis.clusterHealth) {
    const ch = analysis.clusterHealth
    content += `## Cluster Health\n\n`
    content += `- **Health Score:** ${ch.healthScore}/100\n`
    if (ch.replicaCount > 0) {
      content += `- **Replicas:** ${ch.replicaCount - ch.replicasWithIssues}/${ch.replicaCount} healthy\n`
    }
    content += `- **Active Merges:** ${ch.activeMerges}\n`
    if (ch.diskUsage > 0) {
      content += `- **Disk Usage:** ${ch.diskUsage}%\n`
    }
    content += '\n'
  }

  // Detailed insights
  if (insights.length > 0) {
    content += `## Key Insights\n\n`

    for (const insight of insights) {
      const icon =
        insight.severity === 'critical'
          ? '🔴'
          : insight.severity === 'warning'
            ? '🟡'
            : 'ℹ️'

      content += `### ${icon} ${insight.title}\n\n`
      content += `${insight.description}\n\n`

      if (config.includeRecommendations && insight.recommendation) {
        content += `**Recommendation:** ${insight.recommendation}\n\n`
      }
    }
  }

  // Top tables
  if (analysis.topTables && analysis.topTables.length > 0) {
    content += `## Top Tables by Data Read\n\n`
    for (const table of analysis.topTables.slice(0, 3)) {
      content += `- **${table.name}**: ${table.readableValue} (${table.percentage.toFixed(0)}%)\n`
    }
    content += '\n'
  }

  // Generate suggestions
  const suggestions: string[] = []

  if (analysis.queryPerformance && analysis.queryPerformance.slowQueries > 0) {
    suggestions.push('Show me the slowest queries in detail')
  }

  if (analysis.clusterHealth && analysis.clusterHealth.diskUsage > 80) {
    suggestions.push('Which tables are using the most disk space?')
  }

  if (analysis.clusterHealth && analysis.clusterHealth.activeMerges > 0) {
    suggestions.push('Show me the current merge operations')
  }

  if (
    analysis.queryPerformance &&
    analysis.queryPerformance.failedQueries > 0
  ) {
    suggestions.push('What are the most common query errors?')
  }

  suggestions.push('Generate insights for a different time period')

  return { content, suggestions }
}

/**
 * Insight generator LangGraph node
 *
 * Generates proactive insights from ClickHouse monitoring data.
 * Analyzes trends, identifies issues, and provides recommendations.
 *
 * @param state - Current agent state
 * @param config - Optional node configuration
 * @returns Partial state update with response containing insights
 */
export async function insightGeneratorNode(
  state: AgentState,
  config: InsightGeneratorConfig = {}
): Promise<Partial<AgentState>> {
  const effectiveConfig = { ...DEFAULT_CONFIG, ...config }

  if (effectiveConfig.debug) {
    console.log(
      '[insightGeneratorNode] Generating insights for host',
      state.hostId
    )
  }

  try {
    // Run trend analysis
    const analysis = await analyzeTrends(state.hostId, effectiveConfig.period)

    if (effectiveConfig.debug) {
      console.log(
        '[insightGeneratorNode] Generated',
        analysis.insights.length,
        'insights'
      )
    }

    // Format insights into response
    const { content, suggestions } = formatInsightsResponse(
      analysis,
      effectiveConfig
    )

    // Build response
    const response = {
      content,
      type: 'explanation' as const,
      data: {
        analysis,
      },
      suggestions,
    }

    // Add system message to history
    const newMessage = {
      id: crypto.randomUUID(),
      role: 'system' as const,
      content: `Generated ${analysis.insights.length} insights for ${effectiveConfig.period} period.`,
      timestamp: Date.now(),
      metadata: {
        node: 'insightGenerator',
        insightCount: analysis.insights.length,
        period: effectiveConfig.period,
      },
    }

    return {
      response,
      messages: [...state.messages, newMessage],
      stepCount: state.stepCount + 1,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (effectiveConfig.debug) {
      console.error('[insightGeneratorNode] Error:', errorMessage)
    }

    // Return a fallback response with error info
    return {
      response: {
        content: `Unable to generate insights at this time. Error: ${errorMessage}`,
        type: 'error',
        suggestions: ['Try again in a moment', 'Check ClickHouse connection'],
      },
      error: {
        message: `Failed to generate insights: ${errorMessage}`,
        node: 'insightGenerator',
        recoverable: true,
      },
      stepCount: state.stepCount + 1,
    }
  }
}

/**
 * Generate insights independently (without agent state)
 * Useful for scheduled jobs or API endpoints
 *
 * @param hostId - ClickHouse host identifier
 * @param config - Optional configuration
 * @returns Trend analysis with insights
 */
export async function generateInsights(
  hostId: number,
  config: InsightGeneratorConfig = {}
): Promise<TrendAnalysis> {
  const effectiveConfig = { ...DEFAULT_CONFIG, ...config }
  return analyzeTrends(hostId, effectiveConfig.period)
}
