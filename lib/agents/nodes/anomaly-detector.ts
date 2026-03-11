/**
 * Anomaly Detection Node for ClickHouse AI Agent
 *
 * This LangGraph node detects statistical anomalies in ClickHouse metrics
 * by comparing current values against historical baselines.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Node Architecture
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Input: AgentState with hostId
 * Process:
 *   1. Run baseline analysis for multiple metric types
 *   2. Detect anomalies using statistical methods
 *   3. Generate actionable alerts with recommendations
 *   4. Return anomaly findings in state
 *
 * Output: Partial AgentState with anomaly detection results
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { AgentState } from '../state'

import {
  type Anomaly,
  type AnomalyType,
  analyzeBaselines,
  type BaselineAnalysis,
} from '../tools/baseline-analyzer'

/**
 * Configuration for anomaly detector node
 */
export interface AnomalyDetectorConfig {
  /** Maximum number of anomalies to report */
  readonly maxAnomalies?: number
  /** Which anomaly types to check */
  readonly anomalyTypes?: readonly AnomalyType[]
  /** Baseline time window in hours */
  readonly baselineHours?: number
  /** Current time window in hours */
  readonly currentHours?: number
  /** Minimum deviation to trigger alert (percentage) */
  readonly minDeviationPercent?: number
  /** Z-score threshold for outlier detection */
  readonly zScoreThreshold?: number
  /** Debug mode for logging */
  readonly debug?: boolean
}

/** Default configuration */
const DEFAULT_CONFIG: Required<
  Omit<AnomalyDetectorConfig, 'anomalyTypes' | 'debug'>
> = {
  maxAnomalies: 10,
  baselineHours: 24,
  currentHours: 1,
  minDeviationPercent: 50,
  zScoreThreshold: 2.5,
}

/**
 * Format anomalies for user-friendly display
 */
function formatAnomalies(anomalies: readonly Anomaly[]): string {
  if (anomalies.length === 0) {
    return 'No anomalies detected. All metrics are within normal ranges.'
  }

  let output = `**Detected ${anomalies.length} Anomalies:**\n\n`

  for (const anomaly of anomalies) {
    const severityIcon = {
      critical: '',
      high: '',
      medium: '',
      low: '',
    }[anomaly.severity]

    output += `${severityIcon} **${anomaly.title}** (${anomaly.severity.toUpperCase()})\n`
    output += `${anomaly.description}\n`
    output += `- Current: ${anomaly.currentValue.toFixed(2)}\n`
    output += `- Baseline: ${anomaly.baselineValue.toFixed(2)}\n`
    output += `- Deviation: ${anomaly.deviation.toFixed(0)}%\n`
    output += `**Recommended Action:** ${anomaly.recommendedAction}\n\n`
  }

  return output
}

/**
 * Generate follow-up suggestions based on anomalies
 */
function generateSuggestions(anomalies: readonly Anomaly[]): string[] {
  const suggestions: string[] = []

  if (anomalies.length === 0) {
    suggestions.push('Continue monitoring metrics')
    return suggestions
  }

  const types = new Set(anomalies.map((a) => a.type))

  if (types.has('query_spike')) {
    suggestions.push('Show me the top 10 most resource-intensive queries')
    suggestions.push('Which users are running the most queries?')
  }

  if (types.has('memory_anomaly')) {
    suggestions.push('What are the top queries by memory usage?')
    suggestions.push('Show me current memory allocation by user')
  }

  if (types.has('merge_delay')) {
    suggestions.push('Show me active merge operations')
    suggestions.push('Which tables have the most parts?')
  }

  if (types.has('replication_lag')) {
    suggestions.push('Show replication queue status')
    suggestions.push('Which replicas are lagging?')
  }

  if (types.has('error_rate')) {
    suggestions.push('What are the most common error types?')
    suggestions.push('Show failed queries from the last hour')
  }

  return suggestions
}

/**
 * Anomaly Detection LangGraph node
 *
 * Detects statistical anomalies in ClickHouse metrics and generates
 * actionable alerts with recommended remediation steps.
 *
 * @param state - Current agent state
 * @param config - Optional node configuration
 * @returns Partial state update with anomaly detection results
 */
export async function anomalyDetectorNode(
  state: AgentState,
  config: AnomalyDetectorConfig = {}
): Promise<Partial<AgentState>> {
  const effectiveConfig = { ...DEFAULT_CONFIG, ...config }
  const debug = config.debug ?? process.env.NODE_ENV === 'development'

  if (debug) {
    console.log(
      '[anomalyDetectorNode] Starting anomaly detection for host',
      state.hostId
    )
  }

  try {
    // Run baseline analysis
    const analysis: BaselineAnalysis = await analyzeBaselines({
      hostId: state.hostId,
      baselineHours: effectiveConfig.baselineHours,
      currentHours: effectiveConfig.currentHours,
      minDeviationPercent: effectiveConfig.minDeviationPercent,
      zScoreThreshold: effectiveConfig.zScoreThreshold,
      anomalyTypes: config.anomalyTypes,
    })

    // Limit to max anomalies
    const limitedAnomalies = analysis.anomalies.slice(
      0,
      effectiveConfig.maxAnomalies
    )

    if (debug) {
      console.log(
        '[anomalyDetectorNode] Detected',
        analysis.anomalies.length,
        'anomalies'
      )
      console.log(
        '[anomalyDetectorNode] Analysis duration:',
        analysis.metadata.analysisDuration,
        'ms'
      )
    }

    // Build response message
    const content = formatAnomalies(limitedAnomalies)

    // Generate suggestions
    const suggestions = generateSuggestions(limitedAnomalies)

    // Create system message for anomaly results
    const anomalyMessage = {
      id: crypto.randomUUID(),
      role: 'system' as const,
      content,
      timestamp: Date.now(),
      metadata: {
        node: 'anomalyDetector',
        anomalyCount: limitedAnomalies.length,
        analysisDuration: analysis.metadata.analysisDuration,
        anomalies: limitedAnomalies.map((a) => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          title: a.title,
          deviation: a.deviation,
        })),
      },
    }

    // Build response
    const response = {
      content,
      type: 'explanation' as const,
      data: {
        anomalies: limitedAnomalies,
        metadata: analysis.metadata,
      },
      suggestions,
    }

    return {
      response,
      messages: [...state.messages, anomalyMessage],
      stepCount: state.stepCount + 1,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (debug) {
      console.error('[anomalyDetectorNode] Error:', errorMessage)
    }

    // Return a friendly error response
    return {
      response: {
        content: `**Anomaly Detection Error:** ${errorMessage}\n\nNote: Anomaly detection requires historical data in system.query_log and system.part_log. Ensure these system tables are enabled and have sufficient data.`,
        type: 'error',
        suggestions: [
          "Check if query_log is enabled: SELECT * FROM system.settings WHERE name = 'query_log_enabled'",
          'Verify part_log is enabled for merge analysis',
          'Try again in a few minutes after collecting more data',
        ],
      },
      stepCount: state.stepCount + 1,
    }
  }
}

/**
 * Quick anomaly check for background monitoring
 *
 * Faster version that only checks for critical anomalies.
 * Useful for dashboard widgets and periodic health checks.
 */
export async function quickAnomalyCheck(
  hostId: number,
  config?: Pick<AnomalyDetectorConfig, 'anomalyTypes' | 'debug'>
): Promise<{
  readonly hasCriticalAnomalies: boolean
  readonly anomalies: readonly Anomaly[]
}> {
  const debug = config?.debug ?? false

  try {
    const { analyzeBaselines } = await import('../tools/baseline-analyzer')

    const analysis = await analyzeBaselines({
      hostId,
      baselineHours: 6, // Shorter baseline
      currentHours: 0.25, // Last 15 minutes
      minDeviationPercent: 100, // 2x threshold
      zScoreThreshold: 3, // Strict threshold
      anomalyTypes: config?.anomalyTypes ?? [
        'query_spike',
        'memory_anomaly',
        'error_rate',
      ],
    })

    const criticalAnomalies = analysis.anomalies.filter(
      (a) => a.severity === 'critical'
    )

    if (debug) {
      console.log(
        '[quickAnomalyCheck] Found',
        criticalAnomalies.length,
        'critical anomalies'
      )
    }

    return {
      hasCriticalAnomalies: criticalAnomalies.length > 0,
      anomalies: criticalAnomalies,
    }
  } catch (error) {
    if (debug) {
      console.error('[quickAnomalyCheck] Error:', error)
    }
    return { hasCriticalAnomalies: false, anomalies: [] }
  }
}
