/**
 * Query Optimizer Node for ClickHouse AI Agent
 *
 * This LangGraph node generates optimization suggestions for ClickHouse queries
 * based on detected issues and ClickHouse-specific best practices.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Node Architecture
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Input: AgentState with queryInsights from queryAnalyzerNode
 * Process:
 *   1. Review detected issues
 *   2. Generate ClickHouse-specific optimization suggestions
 *   3. Create rewritten query examples where applicable
 *   4. Return optimization recommendations
 *
 * Output: Partial AgentState with optimizationSuggestions field
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { AgentState } from '../state'
import type { QueryIssue } from './query-analyzer'

/**
 * Optimization suggestion types
 */
export type SuggestionCategory =
  | 'schema'
  | 'query_rewrite'
  | 'configuration'
  | 'index'
  | 'partitioning'
  | 'materialized_view'

/**
 * Specific optimization suggestion
 */
export interface OptimizationSuggestion {
  /** Unique identifier */
  readonly id: string
  /** Related issue ID */
  readonly issueId?: string
  /** Suggestion category */
  readonly category: SuggestionCategory
  /** Priority level */
  readonly priority: 'critical' | 'high' | 'medium' | 'low'
  /** Title of the suggestion */
  readonly title: string
  /** Detailed explanation */
  readonly description: string
  /** Before/after code examples */
  readonly example?: {
    readonly before: string
    readonly after: string
    readonly explanation: string
  }
  /** Expected improvement */
  readonly expectedImpact: {
    readonly metric: 'latency' | 'throughput' | 'memory' | 'disk'
    readonly improvement: 'significant' | 'moderate' | 'slight'
    readonly estimatedPercent?: number
  }
  /** Implementation difficulty */
  readonly difficulty: 'easy' | 'moderate' | 'complex'
  /** ClickHouse documentation reference */
  readonly docLink?: string
}

/**
 * Complete optimization recommendations
 */
export interface OptimizationRecommendations {
  /** The query being optimized */
  readonly query: string
  /** All optimization suggestions */
  readonly suggestions: readonly OptimizationSuggestion[]
  /** Estimated total improvement if all applied */
  readonly estimatedImprovement: {
    readonly latency: number // percentage
    readonly memory: number // percentage
  }
  /** Quick wins (easy + high priority) */
  readonly quickWins: readonly OptimizationSuggestion[]
  /** Suggested execution order */
  readonly executionOrder: readonly string[]
}

/**
 * Configuration for query optimizer node
 */
export interface QueryOptimizerConfig {
  /** Whether to include code examples */
  readonly includeExamples?: boolean
  /** Maximum number of suggestions */
  readonly maxSuggestions?: number
  /** Debug mode */
  readonly debug?: boolean
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<QueryOptimizerConfig> = {
  includeExamples: true,
  maxSuggestions: 10,
  debug: process.env.NODE_ENV === 'development',
}

/**
 * ClickHouse optimization patterns based on issue type
 */
const OPTIMIZATION_PATTERNS: Readonly<
  Record<
    QueryIssue['type'],
    readonly ((issue: QueryIssue, query: string) => OptimizationSuggestion)[]
  >
> = {
  full_table_scan: [
    (issue, query) => ({
      id: crypto.randomUUID(),
      issueId: issue.id,
      category: 'query_rewrite' as const,
      priority: 'high' as const,
      title: 'Add Partition Key Filter',
      description:
        'Add a WHERE clause filtering on the partition key to enable partition pruning and dramatically reduce scanned data',
      example: {
        before: query,
        after: query.replace(
          /FROM\s+(\w+)/i,
          (match) => `${match} WHERE event_date >= today() - INTERVAL 7 DAY`
        ),
        explanation:
          'Filtering on the partition key (typically a date column) allows ClickHouse to skip entire partitions during query execution',
      },
      expectedImpact: {
        metric: 'latency' as const,
        improvement: 'significant' as const,
        estimatedPercent: 80,
      },
      difficulty: 'easy' as const,
      docLink:
        'https://clickhouse.com/docs/en/sql-reference/statements/select/where',
    }),
    (issue, query) => ({
      id: crypto.randomUUID(),
      issueId: issue.id,
      category: 'query_rewrite' as const,
      priority: 'high' as const,
      title: 'Use PREWHERE for Column Pruning',
      description:
        'PREWHERE filters rows before reading all columns, significantly reducing I/O for MergeTree tables',
      example: {
        before: query.replace(/PREWHERE/gi, 'WHERE'),
        after: query.replace(/WHERE\s+(\w+)\s*=/i, 'PREWHERE $1 ='),
        explanation:
          'PREWHERE is executed before reading other columns, making it ideal for filtering on high-selectivity columns',
      },
      expectedImpact: {
        metric: 'latency' as const,
        improvement: 'moderate' as const,
        estimatedPercent: 30,
      },
      difficulty: 'easy' as const,
      docLink:
        'https://clickhouse.com/docs/en/sql-reference/statements/select/prewhere',
    }),
  ],

  missing_partition_key: [
    (issue, _query) => ({
      id: crypto.randomUUID(),
      issueId: issue.id,
      category: 'partitioning' as const,
      priority: 'high' as const,
      title: 'Add Partition Key to Table',
      description:
        'Configure an appropriate partition key on the table to enable efficient partition pruning',
      expectedImpact: {
        metric: 'latency' as const,
        improvement: 'significant' as const,
        estimatedPercent: 70,
      },
      difficulty: 'moderate' as const,
      docLink:
        'https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/partition-key',
    }),
  ],

  inefficient_join: [
    (issue, query) => ({
      id: crypto.randomUUID(),
      issueId: issue.id,
      category: 'configuration' as const,
      priority: 'critical' as const,
      title: 'Use Appropriate Join Algorithm',
      description:
        'ClickHouse supports multiple join algorithms. Configure settings for optimal join performance',
      example: {
        before: query,
        after: `-- Add before query\nSET join_algorithm = 'partial_merge';\n\n${query}`,
        explanation:
          'The partial_merge join algorithm is efficient for equijoins on sorted keys. Other options: hash, grace_hash, full_sorting',
      },
      expectedImpact: {
        metric: 'latency' as const,
        improvement: 'significant' as const,
        estimatedPercent: 60,
      },
      difficulty: 'easy' as const,
    }),
    (issue, _query) => ({
      id: crypto.randomUUID(),
      issueId: issue.id,
      category: 'schema' as const,
      priority: 'high' as const,
      title: 'Consider Join Tables with Ordering Key',
      description:
        'Ensure join columns match the ORDER BY key of right table for optimal join performance',
      expectedImpact: {
        metric: 'latency' as const,
        improvement: 'moderate' as const,
        estimatedPercent: 40,
      },
      difficulty: 'complex' as const,
    }),
  ],

  large_result_set: [
    (issue, query) => ({
      id: crypto.randomUUID(),
      issueId: issue.id,
      category: 'query_rewrite' as const,
      priority: 'medium' as const,
      title: 'Implement Pagination',
      description:
        'Use LIMIT with OFFSET for pagination or consider cursor-based pagination for large result sets',
      example: {
        before: query,
        after: query.replace(/\bLIMIT\s+(\d+)/i, 'LIMIT 100 OFFSET $1'),
        explanation:
          'Pagination reduces response time and memory usage by limiting result size per request',
      },
      expectedImpact: {
        metric: 'throughput' as const,
        improvement: 'moderate' as const,
        estimatedPercent: 50,
      },
      difficulty: 'easy' as const,
    }),
  ],

  missing_index: [
    (issue, query) => ({
      id: crypto.randomUUID(),
      issueId: issue.id,
      category: 'index' as const,
      priority: 'high' as const,
      title: 'Add Skipping Index',
      description:
        'Create a skipping index on filter columns to enable ClickHouse to skip data blocks during scans',
      example: {
        before: query,
        after:
          '-- Create index:\nALTER TABLE table_name ADD INDEX idx_column_name column_name TYPE minmax GRANULARITY 4;\n\n-- Then enable:\nALTER TABLE table_name MATERIALIZE INDEX idx_column_name;\n\n' +
          query,
        explanation:
          'Skipping indexes allow ClickHouse to skip reading entire data blocks that cannot contain matching rows',
      },
      expectedImpact: {
        metric: 'latency' as const,
        improvement: 'moderate' as const,
        estimatedPercent: 40,
      },
      difficulty: 'moderate' as const,
      docLink:
        'https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/mergetree-table-engine/#skipping-indexes',
    }),
  ],

  suboptimal_aggregation: [
    (issue, query) => ({
      id: crypto.randomUUID(),
      issueId: issue.id,
      category: 'configuration' as const,
      priority: 'medium' as const,
      title: 'Optimize Aggregation Memory',
      description:
        'Configure aggregation settings to balance memory usage and performance',
      example: {
        before: query,
        after: `-- Add before query\nSET max_bytes_before_external_sort = 10000000000;\nSET max_bytes_before_external_group_by = 10000000000;\n\n${query}`,
        explanation:
          'These settings allow aggregations to spill to disk when memory limits are reached, preventing OOM errors',
      },
      expectedImpact: {
        metric: 'memory' as const,
        improvement: 'moderate' as const,
        estimatedPercent: 30,
      },
      difficulty: 'easy' as const,
    }),
  ],

  high_memory_usage: [
    (issue, query) => ({
      id: crypto.randomUUID(),
      issueId: issue.id,
      category: 'query_rewrite' as const,
      priority: 'high' as const,
      title: 'Reduce Memory Footprint',
      description:
        'Modify query to use less memory by selecting fewer columns or using memory-efficient data types',
      example: {
        before: query,
        after: query
          .replace('SELECT *', 'SELECT id, name, timestamp')
          .replace('String', 'LowCardinality(String)'),
        explanation:
          'Selecting specific columns and using LowCardinality for string columns reduces memory usage significantly',
      },
      expectedImpact: {
        metric: 'memory' as const,
        improvement: 'moderate' as const,
        estimatedPercent: 40,
      },
      difficulty: 'easy' as const,
    }),
  ],
}

/**
 * Generate suggestions for a specific issue
 */
function generateSuggestionsForIssue(
  issue: QueryIssue,
  query: string,
  _config: Required<QueryOptimizerConfig>
): OptimizationSuggestion[] {
  const generators = OPTIMIZATION_PATTERNS[issue.type]

  if (!generators || generators.length === 0) {
    // Fallback suggestion
    return [
      {
        id: crypto.randomUUID(),
        issueId: issue.id,
        category: 'query_rewrite',
        priority:
          issue.severity === 'critical' || issue.severity === 'high'
            ? 'high'
            : 'medium',
        title: 'Optimize Query Pattern',
        description: issue.suggestion,
        expectedImpact: {
          metric: issue.impact.category,
          improvement:
            issue.impact.estimate === 'high' ? 'significant' : 'moderate',
        },
        difficulty: 'moderate',
      },
    ]
  }

  return generators.map((gen) => gen(issue, query))
}

/**
 * Calculate total estimated improvement
 */
function calculateTotalImprovement(
  suggestions: readonly OptimizationSuggestion[]
): OptimizationRecommendations['estimatedImprovement'] {
  let latencyImprovement = 0
  let memoryImprovement = 0

  for (const suggestion of suggestions) {
    const percent = suggestion.expectedImpact.estimatedPercent ?? 30
    const multiplier =
      suggestion.expectedImpact.improvement === 'significant'
        ? 1
        : suggestion.expectedImpact.improvement === 'moderate'
          ? 0.6
          : 0.3

    if (suggestion.expectedImpact.metric === 'latency') {
      latencyImprovement += percent * multiplier
    } else if (suggestion.expectedImpact.metric === 'memory') {
      memoryImprovement += percent * multiplier
    }
  }

  // Cap at 90% (diminishing returns)
  return {
    latency: Math.min(90, Math.round(latencyImprovement)),
    memory: Math.min(90, Math.round(memoryImprovement)),
  }
}

/**
 * Identify quick wins (easy + high priority)
 */
function identifyQuickWins(
  suggestions: readonly OptimizationSuggestion[]
): readonly OptimizationSuggestion[] {
  return suggestions.filter(
    (s) =>
      s.difficulty === 'easy' &&
      (s.priority === 'high' || s.priority === 'critical')
  )
}

/**
 * Determine execution order
 */
function determineExecutionOrder(
  suggestions: readonly OptimizationSuggestion[]
): readonly string[] {
  // Order by: priority (critical first) -> difficulty (easy first) -> category
  const sorted = [...suggestions].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const difficultyOrder = { easy: 0, moderate: 1, complex: 2 }

    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff

    const difficultyDiff =
      difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
    if (difficultyDiff !== 0) return difficultyDiff

    return a.title.localeCompare(b.title)
  })

  return sorted.map((s) => s.id)
}

/**
 * Query optimizer LangGraph node
 *
 * Generates ClickHouse-specific optimization suggestions based on query analysis.
 *
 * @param state - Current agent state (should have queryInsights)
 * @param config - Optional node configuration
 * @returns Partial state update with optimizationSuggestions
 */
export async function queryOptimizerNode(
  state: AgentState,
  config: QueryOptimizerConfig = {}
): Promise<Partial<AgentState>> {
  const effectiveConfig = { ...DEFAULT_CONFIG, ...config }

  if (effectiveConfig.debug) {
    console.log('[queryOptimizerNode] Generating optimization suggestions')
  }

  // Get query insights from previous node
  const insights = state.queryInsights
  if (!insights) {
    if (effectiveConfig.debug) {
      console.log('[queryOptimizerNode] No query insights to optimize')
    }
    return {
      stepCount: state.stepCount + 1,
    }
  }

  try {
    // Generate suggestions for each issue
    const allSuggestions: OptimizationSuggestion[] = []

    for (const issue of insights.issues) {
      const suggestions = generateSuggestionsForIssue(
        issue,
        insights.query,
        effectiveConfig
      )
      allSuggestions.push(...suggestions)
    }

    // Deduplicate by title and limit
    const uniqueSuggestions = Array.from(
      new Map(allSuggestions.map((s) => [s.title, s])).values()
    ).slice(0, effectiveConfig.maxSuggestions)

    // Calculate total improvement
    const estimatedImprovement = calculateTotalImprovement(uniqueSuggestions)

    // Identify quick wins
    const quickWins = identifyQuickWins(uniqueSuggestions)

    // Determine execution order
    const executionOrder = determineExecutionOrder(uniqueSuggestions)

    const recommendations: OptimizationRecommendations = {
      query: insights.query,
      suggestions: uniqueSuggestions,
      estimatedImprovement,
      quickWins,
      executionOrder,
    }

    if (effectiveConfig.debug) {
      console.log('[queryOptimizerNode] Recommendations generated:', {
        suggestionCount: uniqueSuggestions.length,
        quickWinCount: quickWins.length,
        estimatedImprovement,
      })
    }

    // Add system message
    const newMessage = {
      id: crypto.randomUUID(),
      role: 'system' as const,
      content: `Generated ${uniqueSuggestions.length} optimization suggestions. Quick wins: ${quickWins.length}. Estimated improvement: ${estimatedImprovement.latency}% latency, ${estimatedImprovement.memory}% memory`,
      timestamp: Date.now(),
      metadata: {
        node: 'queryOptimizer',
        recommendations,
      },
    }

    return {
      optimizationSuggestions: recommendations,
      messages: [...state.messages, newMessage],
      stepCount: state.stepCount + 1,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (effectiveConfig.debug) {
      console.error('[queryOptimizerNode] Error:', errorMessage)
    }

    return {
      error: {
        message: `Query optimization failed: ${errorMessage}`,
        node: 'queryOptimizer',
        recoverable: true,
      },
      stepCount: state.stepCount + 1,
    }
  }
}

/**
 * Helper function to generate human-readable optimization summary
 */
export function formatOptimizationSummary(
  recommendations: OptimizationRecommendations
): string {
  const lines: string[] = []

  lines.push(`# Query Optimization Summary\n`)
  lines.push(
    `**Health Impact:** ${recommendations.estimatedImprovement.latency}% estimated latency improvement\n`
  )
  lines.push(`**Suggestions:** ${recommendations.suggestions.length}\n`)

  if (recommendations.quickWins.length > 0) {
    lines.push(`## Quick Wins (${recommendations.quickWins.length})\n`)
    for (const win of recommendations.quickWins) {
      lines.push(`- **${win.title}** (${win.priority}): ${win.description}`)
    }
    lines.push('')
  }

  lines.push(`## All Recommendations\n`)

  for (let i = 0; i < recommendations.suggestions.length; i++) {
    const suggestion = recommendations.suggestions[i]
    lines.push(
      `${i + 1}. **${suggestion.title}** [${suggestion.priority}, ${suggestion.difficulty}]`
    )
    lines.push(`   ${suggestion.description}`)
    if (suggestion.example) {
      lines.push(
        `   Expected impact: ${suggestion.expectedImpact.improvement} ${suggestion.expectedImpact.metric} improvement`
      )
    }
    lines.push('')
  }

  return lines.join('\n')
}
