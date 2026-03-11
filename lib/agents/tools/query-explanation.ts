/**
 * Query Explanation Tool for ClickHouse AI Agent
 *
 * This tool provides detailed explanations of ClickHouse query execution,
 * including query plan analysis, column usage, and performance characteristics.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * Tool Architecture
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This is a LangGraph tool that can be called by agent nodes to:
 *   1. Parse query structure (SELECT, FROM, WHERE, JOIN, GROUP BY, etc.)
 *   2. Identify columns and tables used
 *   3. Explain ClickHouse-specific syntax
 *   4. Provide execution flow description
 *   5. Highlight potential bottlenecks
 *
 * Usage: Called from agent nodes or directly via API
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { QueryInsights } from '../nodes/query-analyzer'

/**
 * Query clause types for parsing
 */
type QueryClause =
  | 'SELECT'
  | 'FROM'
  | 'WHERE'
  | 'PREWHERE'
  | 'GROUP_BY'
  | 'ORDER_BY'
  | 'HAVING'
  | 'LIMIT'
  | 'JOIN'
  | 'UNION'
  | 'WITH'

/**
 * Parsed query clause
 */
interface ParsedClause {
  readonly type: QueryClause
  readonly content: string
  readonly startPosition: number
  readonly endPosition: number
}

/**
 * Column usage information
 */
interface ColumnUsage {
  readonly name: string
  readonly source: string // table name or 'unknown'
  readonly clause: QueryClause
  readonly usage: 'filter' | 'aggregate' | 'sort' | 'select' | 'join'
}

/**
 * Query explanation result
 */
export interface QueryExplanation {
  /** The original query */
  readonly query: string
  /** Query type classification */
  readonly queryType:
    | 'select'
    | 'insert'
    | 'join'
    | 'aggregate'
    | 'subquery'
    | 'unknown'
  /** Parsed clauses */
  readonly clauses: readonly ParsedClause[]
  /** Tables accessed */
  readonly tables: readonly string[]
  /** Columns used */
  readonly columns: readonly ColumnUsage[]
  /** Execution flow description */
  readonly executionFlow: readonly string[]
  /** ClickHouse-specific features used */
  readonly features: readonly {
    readonly name: string
    readonly description: string
    readonly clause?: string
  }[]
  /** Potential bottlenecks */
  readonly bottlenecks: readonly {
    readonly location: string
    readonly issue: string
    readonly severity: 'low' | 'medium' | 'high'
  }[]
}

/**
 * ClickHouse-specific features with explanations
 */
const CLICKHOUSE_FEATURES: Readonly<
  Record<
    string,
    { readonly description: string; readonly bestPractice: string }
  >
> = {
  PREWHERE: {
    description:
      'Filters rows before reading other columns, reducing I/O for MergeTree tables',
    bestPractice:
      'Use PREWHERE for high-selectivity filters on the first columns',
  },
  FINAL: {
    description:
      'Applies mutations before reading data, but may impact performance',
    bestPractice:
      'Avoid FINAL if possible; use special metadata columns instead',
  },
  SAMPLE: {
    description: 'Enables approximate queries on sample data',
    bestPractice:
      'Use for analytics on large datasets where approximate results are acceptable',
  },
  ARRAY_JOIN: {
    description: 'Unnests arrays to join with parent table',
    bestPractice: 'Can be memory-intensive for large arrays',
  },
  DISTINCT: {
    description: 'Removes duplicate rows using hash aggregation',
    bestPractice: 'Consider GROUP BY for single-column deduplication',
  },
  LIMIT_BY: {
    description: 'Applies LIMIT per group, not globally',
    bestPractice: 'Useful for top-N queries per category',
  },
  WITH: {
    description: 'Defines CTEs (Common Table Expressions)',
    bestPractice: 'Use for query organization; ClickHouse may inline them',
  },
}

/**
 * Parse SQL query into clauses
 */
function parseClauses(sql: string): readonly ParsedClause[] {
  const clauses: ParsedClause[] = []
  const normalized = sql.replace(/\s+/g, ' ').trim()

  const patterns: ReadonlyArray<{
    readonly type: QueryClause
    readonly regex: RegExp
  }> = [
    { type: 'WITH', regex: /\bWITH\b/i },
    { type: 'SELECT', regex: /\bSELECT\b/i },
    { type: 'FROM', regex: /\bFROM\b/i },
    { type: 'PREWHERE', regex: /\bPREWHERE\b/i },
    {
      type: 'JOIN',
      regex: /\b(?:INNER\s+|LEFT\s+|RIGHT\s+|FULL\s+|CROSS\s+)?JOIN\b/i,
    },
    { type: 'WHERE', regex: /\bWHERE\b/i },
    { type: 'GROUP_BY', regex: /\bGROUP\s+BY\b/i },
    { type: 'HAVING', regex: /\bHAVING\b/i },
    { type: 'ORDER_BY', regex: /\bORDER\s+BY\b/i },
    { type: 'LIMIT', regex: /\bLIMIT\b/i },
    { type: 'UNION', regex: /\bUNION\s+ALL\b/i },
  ]

  const _remaining = normalized
  const _globalPosition = 0

  // Sort by position in query
  const matches: Array<{ type: QueryClause; index: number; length: number }> =
    []

  for (const { type, regex } of patterns) {
    regex.lastIndex = 0
    const match = regex.exec(normalized)
    if (match) {
      matches.push({ type, index: match.index, length: match[0].length })
    }
  }

  matches.sort((a, b) => a.index - b.index)

  // Extract content for each clause
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]
    const next = matches[i + 1]

    const startPosition = current.index
    const endPosition = next ? next.index : normalized.length

    const content = normalized
      .slice(startPosition + current.length, endPosition)
      .trim()
      .replace(/\s+/g, ' ')

    clauses.push({
      type: current.type,
      content,
      startPosition,
      endPosition,
    })
  }

  return clauses
}

/**
 * Extract column usage from query
 */
function extractColumns(
  _sql: string,
  clauses: readonly ParsedClause[]
): readonly ColumnUsage[] {
  const columns: ColumnUsage[] = []

  // Extract FROM clause for default table source
  const fromClause = clauses.find((c) => c.type === 'FROM')
  const defaultTable =
    fromClause?.content.split(/\s+AS\s+/i)[0]?.trim() ?? 'unknown'

  for (const clause of clauses) {
    // Match column references (simple identifiers, not function calls)
    const columnPattern = /\b([a-z_][a-z0-9_]*)\b/gi
    const keywords = new Set([
      'SELECT',
      'FROM',
      'WHERE',
      'PREWHERE',
      'GROUP',
      'BY',
      'ORDER',
      'HAVING',
      'LIMIT',
      'AND',
      'OR',
      'NOT',
      'IN',
      'AS',
      'ASC',
      'DESC',
      'NULL',
      'IS',
      'BETWEEN',
      'LIKE',
      'DISTINCT',
      'ALL',
      'ANY',
      'SOME',
      'EXISTS',
      'CASE',
      'WHEN',
      'THEN',
      'ELSE',
      'END',
      'JOIN',
      'INNER',
      'LEFT',
      'RIGHT',
      'FULL',
      'CROSS',
      'ON',
      'USING',
      'WITH',
      'FINAL',
      'SAMPLE',
      'PREWHERE',
      'ARRAY',
      'JOIN',
      'UNION',
      'LIMIT',
      'OFFSET',
    ])

    let match
    while ((match = columnPattern.exec(clause.content)) !== null) {
      const name = match[1]

      // Skip SQL keywords
      if (keywords.has(name.toUpperCase())) {
        continue
      }

      // Skip function names (followed by parenthesis)
      if (
        clause.content
          .slice(match.index + name.length)
          .trimStart()
          .startsWith('(')
      ) {
        continue
      }

      // Determine usage type
      let usage: ColumnUsage['usage'] = 'select'
      if (clause.type === 'WHERE' || clause.type === 'PREWHERE') {
        usage = 'filter'
      } else if (clause.type === 'GROUP_BY') {
        usage = 'aggregate'
      } else if (clause.type === 'ORDER_BY') {
        usage = 'sort'
      } else if (clause.type === 'JOIN') {
        usage = 'join'
      }

      columns.push({
        name,
        source: defaultTable,
        clause: clause.type,
        usage,
      })
    }
  }

  // Deduplicate
  const seen = new Set<string>()
  return columns.filter((c) => {
    const key = `${c.name}.${c.clause}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Identify ClickHouse-specific features used
 */
function identifyFeatures(
  clauses: readonly ParsedClause[]
): QueryExplanation['features'] {
  const features: { name: string; description: string; clause?: string }[] = []

  const featureClauses = clauses.filter(
    (c) => c.type === 'SELECT' || c.type === 'FROM'
  )

  for (const clause of featureClauses) {
    const content = clause.content.toUpperCase()

    for (const [name, info] of Object.entries(CLICKHOUSE_FEATURES)) {
      if (content.includes(name)) {
        features.push({
          name,
          description: info.description,
        })
      }
    }
  }

  return features
}

/**
 * Generate execution flow description
 */
function generateExecutionFlow(
  _queryType: QueryExplanation['queryType'],
  clauses: readonly ParsedClause[]
): readonly string[] {
  const flow: string[] = []

  flow.push('1. Query parsing and validation')

  if (clauses.some((c) => c.type === 'WITH')) {
    flow.push('2. CTE (WITH clause) evaluation or inlining')
  }

  if (clauses.some((c) => c.type === 'FROM')) {
    flow.push('3. FROM clause: identify source tables')
  }

  if (clauses.some((c) => c.type === 'JOIN')) {
    flow.push('4. JOIN operations: combine data from multiple tables')
  }

  if (clauses.some((c) => c.type === 'PREWHERE')) {
    flow.push('5. PREWHERE filter: early row filtering before reading columns')
  }

  if (clauses.some((c) => c.type === 'WHERE')) {
    flow.push('6. WHERE filter: apply row-level predicates')
  }

  if (clauses.some((c) => c.type === 'GROUP_BY')) {
    flow.push('7. GROUP BY aggregation: group and aggregate data')
  }

  if (clauses.some((c) => c.type === 'HAVING')) {
    flow.push('8. HAVING filter: apply group-level predicates')
  }

  if (clauses.some((c) => c.type === 'ORDER_BY')) {
    flow.push('9. ORDER BY sort: sort results')
  }

  if (clauses.some((c) => c.type === 'LIMIT')) {
    flow.push('10. LIMIT/OFFSET: apply pagination')
  }

  flow.push('11. Return results to client')

  return flow
}

/**
 * Identify potential bottlenecks
 */
function identifyBottlenecks(
  sql: string,
  clauses: readonly ParsedClause[]
): QueryExplanation['bottlenecks'] {
  const bottlenecks: {
    location: string
    issue: string
    severity: 'low' | 'medium' | 'high'
  }[] = []

  // Check for SELECT *
  if (/SELECT\s+\*/i.test(sql)) {
    bottlenecks.push({
      location: 'SELECT clause',
      issue: 'SELECT * reads all columns, increasing I/O',
      severity: 'medium',
    })
  }

  // Check for missing WHERE clause
  const hasFilter =
    clauses.some((c) => c.type === 'WHERE') ||
    clauses.some((c) => c.type === 'PREWHERE')
  if (!hasFilter) {
    bottlenecks.push({
      location: 'WHERE clause',
      issue: 'No WHERE clause may result in full table scan',
      severity: 'high',
    })
  }

  // Check for CROSS JOIN
  if (/\bCROSS\s+JOIN\b/i.test(sql)) {
    bottlenecks.push({
      location: 'JOIN clause',
      issue: 'CROSS JOIN produces Cartesian product (exponential row growth)',
      severity: 'high',
    })
  }

  // Check for DISTINCT without LIMIT
  if (/\bSELECT\s+DISTINCT\b/i.test(sql) && !/\bLIMIT\b/i.test(sql)) {
    bottlenecks.push({
      location: 'SELECT DISTINCT',
      issue: 'DISTINCT without LIMIT may process many rows',
      severity: 'low',
    })
  }

  // Check for ORDER BY without LIMIT
  if (/\bORDER\s+BY\b/i.test(sql) && !/\bLIMIT\b/i.test(sql)) {
    bottlenecks.push({
      location: 'ORDER BY clause',
      issue: 'ORDER BY without LIMIT sorts all rows (memory intensive)',
      severity: 'medium',
    })
  }

  return bottlenecks
}

/**
 * Main query explanation function
 */
export function explainQuery(sql: string): QueryExplanation {
  const trimmed = sql.trim()
  const upper = trimmed.toUpperCase()

  // Classify query type
  let queryType: QueryExplanation['queryType'] = 'unknown'
  if (upper.startsWith('SELECT')) {
    if (/\bJOIN\b/i.test(trimmed)) queryType = 'join'
    else if (/\bGROUP\s+BY\b/i.test(trimmed)) queryType = 'aggregate'
    else if (/\bSELECT.*SELECT\b/i.test(trimmed)) queryType = 'subquery'
    else queryType = 'select'
  } else if (upper.startsWith('INSERT')) {
    queryType = 'insert'
  }

  // Parse query structure
  const clauses = parseClauses(trimmed)

  // Extract tables
  const tables: string[] = []
  for (const clause of clauses) {
    if (clause.type === 'FROM') {
      const tableMatch = clause.content.match(/^(\w+|\w+\.\w+)/)
      if (tableMatch) {
        tables.push(tableMatch[1])
      }
    }
    if (clause.type === 'JOIN') {
      const tableMatch = clause.content.match(/^(\w+|\w+\.\w+)/)
      if (tableMatch) {
        tables.push(tableMatch[1])
      }
    }
  }

  // Extract columns
  const columns = extractColumns(trimmed, clauses)

  // Identify ClickHouse features
  const features = identifyFeatures(clauses)

  // Generate execution flow
  const executionFlow = generateExecutionFlow(queryType, clauses)

  // Identify bottlenecks
  const bottlenecks = identifyBottlenecks(trimmed, clauses)

  return {
    query: trimmed,
    queryType,
    clauses,
    tables,
    columns,
    executionFlow,
    features,
    bottlenecks,
  }
}

/**
 * Format explanation as markdown for display
 */
export function formatExplanationAsMarkdown(
  explanation: QueryExplanation
): string {
  const lines: string[] = []

  lines.push(`# Query Explanation\n`)
  lines.push(`**Query Type:** ${explanation.queryType}\n`)

  // Tables
  if (explanation.tables.length > 0) {
    lines.push(`## Tables Accessed`)
    for (const table of explanation.tables) {
      lines.push(`- \`${table}\``)
    }
    lines.push('')
  }

  // Clauses
  lines.push(`## Query Structure`)
  for (const clause of explanation.clauses) {
    lines.push(
      `- **${clause.type.replace('_', ' ')}**: ${clause.content.slice(0, 100)}${clause.content.length > 100 ? '...' : ''}`
    )
  }
  lines.push('')

  // ClickHouse features
  if (explanation.features.length > 0) {
    lines.push(`## ClickHouse Features`)
    for (const feature of explanation.features) {
      lines.push(`- **${feature.name}**: ${feature.description}`)
      const bestPractice = CLICKHOUSE_FEATURES[feature.name]?.bestPractice
      if (bestPractice) {
        lines.push(`  *Best Practice:* ${bestPractice}`)
      }
    }
    lines.push('')
  }

  // Execution flow
  lines.push(`## Execution Flow`)
  for (const step of explanation.executionFlow) {
    lines.push(`- ${step}`)
  }
  lines.push('')

  // Bottlenecks
  if (explanation.bottlenecks.length > 0) {
    lines.push(`## Potential Bottlenecks`)
    for (const bottleneck of explanation.bottlenecks) {
      const severityIcon =
        bottleneck.severity === 'high'
          ? '🔴'
          : bottleneck.severity === 'medium'
            ? '🟡'
            : '🟢'
      lines.push(
        `- ${severityIcon} **${bottleneck.location}**: ${bottleneck.issue}`
      )
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Combine query explanation with insights for comprehensive analysis
 */
export function explainQueryWithInsights(
  sql: string,
  insights?: QueryInsights
): QueryExplanation & { readonly healthScore?: number } {
  const explanation = explainQuery(sql)

  return {
    ...explanation,
    healthScore: insights?.healthScore,
  }
}
