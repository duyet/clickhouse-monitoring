/**
 * Query Analyzer Node for ClickHouse AI Agent
 *
 * This LangGraph node analyzes query performance to identify bottlenecks
 * such as full table scans, missing partition key usage, and inefficient joins.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Node Architecture
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Input: AgentState with query result or query string
 * Process:
 *   1. Parse query SQL for analysis patterns
 *   2. Detect full table scans (no WHERE clause, no partition key)
 *   3. Check for partition key usage
 *   4. Analyze join patterns
 *   5. Return QueryInsights with detected issues
 *
 * Output: Partial AgentState with queryInsights field
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { AgentState } from '../state'

/**
 * Query issue severity levels
 */
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

/**
 * Query performance issue detected during analysis
 */
export interface QueryIssue {
  /** Unique identifier for the issue */
  readonly id: string
  /** Issue type category */
  readonly type:
    | 'full_table_scan'
    | 'missing_partition_key'
    | 'inefficient_join'
    | 'large_result_set'
    | 'missing_index'
    | 'suboptimal_aggregation'
    | 'high_memory_usage'
  /** Severity level */
  readonly severity: IssueSeverity
  /** Human-readable description */
  readonly description: string
  /** Location in query (if applicable) */
  readonly location?: {
    readonly line?: number
    readonly column?: number
    readonly excerpt?: string
  }
  /** Performance impact estimate */
  readonly impact: {
    readonly category: 'latency' | 'throughput' | 'memory' | 'disk'
    readonly estimate: 'high' | 'medium' | 'low'
  }
  /** Suggested fix */
  readonly suggestion: string
}

/**
 * Query analysis results
 */
export interface QueryInsights {
  /** The analyzed query SQL */
  readonly query: string
  /** Issues detected during analysis */
  readonly issues: readonly QueryIssue[]
  /** Overall query health score (0-100) */
  readonly healthScore: number
  /** Tables accessed in the query */
  readonly tables: readonly string[]
  /** Query type classification */
  readonly queryType:
    | 'select'
    | 'insert'
    | 'join'
    | 'aggregate'
    | 'subquery'
    | 'unknown'
  /** Estimated resource usage */
  readonly resourceEstimate: {
    readonly cpu: 'low' | 'medium' | 'high'
    readonly memory: 'low' | 'medium' | 'high'
    readonly disk: 'low' | 'medium' | 'high'
  }
}

/**
 * Configuration for query analyzer node
 */
export interface QueryAnalyzerConfig {
  /** Whether to enable advanced analysis */
  readonly enableAdvanced?: boolean
  /** Custom partition key detection patterns */
  readonly partitionKeyPatterns?: readonly RegExp[]
  /** Debug mode for logging */
  readonly debug?: boolean
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<QueryAnalyzerConfig> = {
  enableAdvanced: true,
  partitionKeyPatterns: [
    /WHERE\s+[\w.]+\s*(?:=|IN|>=|<=|>|<)\s*[\w'"]+/i,
    /PREWHERE\s+[\w.]+\s*(?:=|IN)\s*[\w'"]+/i,
  ],
  debug: process.env.NODE_ENV === 'development',
}

/**
 * Extract table names from SQL query
 */
function extractTables(sql: string): string[] {
  const tables: string[] = []
  const normalized = sql.replace(/\s+/g, ' ').trim()

  // Match FROM and JOIN clauses
  const patterns = [
    /FROM\s+([`"']?[\w.]+[`"']?)(?:\s+AS\s+[`"']?[\w]+[`"']?)?\s*/gi,
    /JOIN\s+([`"']?[\w.]+[`"']?)(?:\s+AS\s+[`"']?[\w]+[`"']?)?\s*/gi,
  ]

  for (const pattern of patterns) {
    const matches = normalized.matchAll(pattern)
    for (const match of matches) {
      const table = match[1]?.replace(/[`"']/g, '')
      if (
        table &&
        !table.match(/^(SELECT|WHERE|AND|OR|GROUP|ORDER|HAVING|LIMIT|JOIN)$/i)
      ) {
        tables.push(table)
      }
    }
  }

  return [...new Set(tables)]
}

/**
 * Detect full table scan patterns
 */
function detectFullTableScans(
  sql: string,
  tables: readonly string[]
): QueryIssue[] {
  const issues: QueryIssue[] = []
  const normalized = sql.replace(/\s+/g, ' ').trim().toUpperCase()

  // Check for SELECT without WHERE clause (for non-aggregate queries)
  const hasWhere = normalized.includes(' WHERE ')
  const hasPrewhere = normalized.includes(' PREWHERE ')
  const hasLimit = /\bLIMIT\s+\d+/i.test(sql)
  const isAggregate = /\bGROUP\s+BY\b/i.test(sql)
  const hasJoin = /\bJOIN\b/i.test(normalized)

  // Full table scan if: no WHERE/PREWHERE, not a simple LIMIT query, not a join with conditions
  if (!hasWhere && !hasPrewhere && !hasLimit && !isAggregate && !hasJoin) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'full_table_scan',
      severity: 'high',
      description:
        'Query may perform a full table scan without WHERE or PREWHERE clause',
      location: {
        excerpt: sql.slice(0, 100),
      },
      impact: {
        category: 'latency',
        estimate:
          tables.length > 0 && tables.some((t) => t.includes('.'))
            ? 'high'
            : 'medium',
      },
      suggestion:
        'Add a WHERE clause filtering on the partition key or a high-selectivity column. Consider using PREWHERE for MergeTree tables to skip column data before filtering.',
    })
  }

  // Check for SELECT * (reads all columns)
  if (/SELECT\s+\*\s+FROM/i.test(sql)) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'full_table_scan',
      severity: 'medium',
      description:
        'SELECT * reads all columns, increasing I/O and memory usage',
      location: {
        excerpt: 'SELECT *',
      },
      impact: {
        category: 'memory',
        estimate: 'medium',
      },
      suggestion:
        'Specify only required columns to reduce data transfer and memory usage',
    })
  }

  return issues
}

/**
 * Detect missing partition key usage
 */
function detectMissingPartitionKey(
  sql: string,
  tables: readonly string[],
  _config: Required<QueryAnalyzerConfig>
): QueryIssue[] {
  const issues: QueryIssue[] = []

  // Check if query has WHERE/PREWHERE clauses
  const hasWhereClause = /\b(?:WHERE|PREWHERE)\b/i.test(sql)

  if (tables.length > 0 && !hasWhereClause) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'missing_partition_key',
      severity: 'high',
      description: `Query does not filter on partition key, requiring partition pruning optimization`,
      location: {
        excerpt: sql.slice(0, 100),
      },
      impact: {
        category: 'latency',
        estimate: 'high',
      },
      suggestion:
        'Add a WHERE clause filtering on the table partition key to enable partition pruning and reduce scan scope',
    })
  }

  // Check for OR conditions that prevent partition pruning
  const orPattern = /\bWHERE\s+.+?\bOR\b/i
  if (orPattern.test(sql)) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'missing_partition_key',
      severity: 'medium',
      description:
        'OR conditions in WHERE clause may prevent effective partition pruning',
      location: {
        excerpt: 'WHERE ... OR ...',
      },
      impact: {
        category: 'latency',
        estimate: 'medium',
      },
      suggestion:
        'Consider using IN clause or UNION ALL instead of OR for better partition pruning',
    })
  }

  return issues
}

/**
 * Analyze join efficiency
 */
function analyzeJoinEfficiency(sql: string): QueryIssue[] {
  const issues: QueryIssue[] = []
  const _normalized = sql.replace(/\s+/g, ' ').toUpperCase()

  // Check for CROSS JOIN (Cartesian product)
  if (/\bCROSS\s+JOIN\b/i.test(sql)) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'inefficient_join',
      severity: 'critical',
      description:
        'CROSS JOIN produces a Cartesian product, exponentially increasing row count',
      location: {
        excerpt: 'CROSS JOIN',
      },
      impact: {
        category: 'latency',
        estimate: 'high',
      },
      suggestion:
        'Replace with INNER JOIN on specific keys or verify CROSS JOIN is intentional',
    })
  }

  // Check for JOIN without ON/USING clause
  if (/\bJOIN\s+\w+\s+(?!ON|USING)/i.test(sql)) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'inefficient_join',
      severity: 'high',
      description:
        'JOIN without explicit join condition may produce unexpected cross join',
      location: {
        excerpt: sql.match(/JOIN\s+\w+\s+(?!ON|USING)/i)?.[0],
      },
      impact: {
        category: 'latency',
        estimate: 'high',
      },
      suggestion: 'Always specify join conditions with ON or USING clause',
    })
  }

  // Check for suboptimal join order (large table joined first)
  const joinMatches = sql.matchAll(
    /\b(?:INNER|LEFT|RIGHT|FULL)?\s*JOIN\s+(\w+)/gi
  )
  const joinCount = Array.from(joinMatches).length

  if (joinCount > 3) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'inefficient_join',
      severity: 'medium',
      description: `Query joins ${joinCount} tables, which may impact performance`,
      impact: {
        category: 'latency',
        estimate: 'medium',
      },
      suggestion:
        'Consider breaking into multiple queries or ensuring join order starts with smallest tables',
    })
  }

  return issues
}

/**
 * Detect large result sets
 */
function detectLargeResultSets(sql: string): QueryIssue[] {
  const issues: QueryIssue[] = []

  // Check for missing or very high LIMIT
  const limitMatch = sql.match(/\bLIMIT\s+(\d+)/i)
  const limit = limitMatch ? parseInt(limitMatch[1], 10) : null

  if (limit === null) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'large_result_set',
      severity: 'medium',
      description:
        'Query has no LIMIT clause, potentially returning millions of rows',
      location: {
        excerpt: 'No LIMIT clause',
      },
      impact: {
        category: 'throughput',
        estimate: 'medium',
      },
      suggestion:
        'Add a LIMIT clause to cap result size or use pagination with OFFSET',
    })
  } else if (limit > 10000) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'large_result_set',
      severity: 'low',
      description: `Query LIMIT is ${limit.toLocaleString()}, which may return more data than needed`,
      impact: {
        category: 'throughput',
        estimate: 'low',
      },
      suggestion:
        'Consider reducing LIMIT or implementing pagination for better user experience',
    })
  }

  return issues
}

/**
 * Detect suboptimal aggregation patterns
 */
function detectSuboptimalAggregation(sql: string): QueryIssue[] {
  const issues: QueryIssue[] = []
  const _normalized = sql.replace(/\s+/g, ' ').toUpperCase()

  // Check for DISTINCT instead of GROUP BY (for single column)
  if (/\bSELECT\s+DISTINCT\b/i.test(sql)) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'suboptimal_aggregation',
      severity: 'low',
      description: 'DISTINCT may be slower than GROUP BY for some use cases',
      impact: {
        category: 'memory',
        estimate: 'low',
      },
      suggestion:
        'Consider using GROUP BY for better performance with single-column deduplication',
    })
  }

  // Check for aggregations without ORDER BY on the grouped columns
  const hasGroupBy = /\bGROUP\s+BY\b/i.test(sql)
  const hasOrderBy = /\bORDER\s+BY\b/i.test(sql)

  if (hasGroupBy && !hasOrderBy) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'suboptimal_aggregation',
      severity: 'info',
      description: 'Aggregation query lacks ORDER BY for deterministic results',
      impact: {
        category: 'latency',
        estimate: 'low',
      },
      suggestion:
        'Add ORDER BY on grouped columns for consistent result ordering',
    })
  }

  return issues
}

/**
 * Calculate health score from issues
 */
function calculateHealthScore(issues: readonly QueryIssue[]): number {
  if (issues.length === 0) return 100

  let score = 100

  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical':
        score -= 30
        break
      case 'high':
        score -= 20
        break
      case 'medium':
        score -= 10
        break
      case 'low':
        score -= 5
        break
      case 'info':
        score -= 1
        break
    }
  }

  return Math.max(0, score)
}

/**
 * Estimate resource usage based on query patterns
 */
function estimateResourceUsage(
  sql: string,
  issues: readonly QueryIssue[]
): QueryInsights['resourceEstimate'] {
  let cpu: 'low' | 'medium' | 'high' = 'low'
  let memory: 'low' | 'medium' | 'high' = 'low'
  let disk: 'low' | 'medium' | 'high' = 'low'

  const normalized = sql.toUpperCase()

  // CPU estimation
  if (/\b(CROSS\s+JOIN|DISTINCT|GROUP\s+BY|ORDER\s+BY)\b/i.test(sql)) {
    cpu = 'medium'
  }
  if (
    issues.some(
      (i) => i.type === 'inefficient_join' || i.type === 'full_table_scan'
    )
  ) {
    cpu = 'high'
  }

  // Memory estimation
  if (/\b(GROUP\s+BY|ORDER\s+BY|DISTINCT|ARRAY JOIN)\b/i.test(sql)) {
    memory = 'medium'
  }
  if (/\bJOIN\b/i.test(normalized)) {
    memory = 'medium'
  }
  if (
    issues.some(
      (i) => i.impact.category === 'memory' && i.impact.estimate !== 'low'
    )
  ) {
    memory = 'high'
  }

  // Disk estimation
  if (
    issues.some(
      (i) => i.type === 'full_table_scan' || i.type === 'missing_partition_key'
    )
  ) {
    disk = 'high'
  } else if (extractTables(sql).length > 2) {
    disk = 'medium'
  }

  return { cpu, memory, disk }
}

/**
 * Classify query type
 */
function classifyQueryType(sql: string): QueryInsights['queryType'] {
  const normalized = sql.trim().toUpperCase()

  if (normalized.startsWith('SELECT')) {
    if (/\bJOIN\b/i.test(sql)) return 'join'
    if (/\bGROUP\s+BY\b/i.test(sql)) return 'aggregate'
    if (/\bSELECT.*\(SELECT/i.test(sql)) return 'subquery'
    return 'select'
  }

  if (normalized.startsWith('INSERT')) return 'insert'

  return 'unknown'
}

/**
 * Query analyzer LangGraph node
 *
 * Analyzes query SQL to detect performance bottlenecks and optimization opportunities.
 *
 * @param state - Current agent state
 * @param config - Optional node configuration
 * @returns Partial state update with queryInsights
 */
export async function queryAnalyzerNode(
  state: AgentState,
  config: QueryAnalyzerConfig = {}
): Promise<Partial<AgentState>> {
  const effectiveConfig = { ...DEFAULT_CONFIG, ...config }

  if (effectiveConfig.debug) {
    console.log('[queryAnalyzerNode] Analyzing query')
  }

  // Get the query to analyze (from generatedQuery or from query result)
  const queryToAnalyze = state.generatedQuery?.sql
  if (!queryToAnalyze) {
    if (effectiveConfig.debug) {
      console.log('[queryAnalyzerNode] No query to analyze')
    }
    return {
      stepCount: state.stepCount + 1,
    }
  }

  try {
    // Extract tables
    const tables = extractTables(queryToAnalyze)

    // Run all analysis checks
    const allIssues: QueryIssue[] = [
      ...detectFullTableScans(queryToAnalyze, tables),
      ...detectMissingPartitionKey(queryToAnalyze, tables, effectiveConfig),
      ...analyzeJoinEfficiency(queryToAnalyze),
      ...detectLargeResultSets(queryToAnalyze),
      ...detectSuboptimalAggregation(queryToAnalyze),
    ]

    // Calculate health score
    const healthScore = calculateHealthScore(allIssues)

    // Classify query type
    const queryType = classifyQueryType(queryToAnalyze)

    // Estimate resource usage
    const resourceEstimate = estimateResourceUsage(queryToAnalyze, allIssues)

    const insights: QueryInsights = {
      query: queryToAnalyze,
      issues: allIssues,
      healthScore,
      tables,
      queryType,
      resourceEstimate,
    }

    if (effectiveConfig.debug) {
      console.log('[queryAnalyzerNode] Analysis complete:', {
        issueCount: allIssues.length,
        healthScore,
        queryType,
      })
    }

    // Add system message
    const newMessage = {
      id: crypto.randomUUID(),
      role: 'system' as const,
      content: `Query analysis complete. Health score: ${healthScore}/100. Issues found: ${allIssues.length}`,
      timestamp: Date.now(),
      metadata: {
        node: 'queryAnalyzer',
        insights,
      },
    }

    return {
      queryInsights: insights,
      messages: [...state.messages, newMessage],
      stepCount: state.stepCount + 1,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (effectiveConfig.debug) {
      console.error('[queryAnalyzerNode] Error:', errorMessage)
    }

    return {
      error: {
        message: `Query analysis failed: ${errorMessage}`,
        node: 'queryAnalyzer',
        recoverable: true,
      },
      stepCount: state.stepCount + 1,
    }
  }
}
