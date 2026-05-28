import 'server-only'

import { readOnlyQuery, resolveHostId } from './helpers'
import {
  extractReferencedTables,
  extractWhereColumns,
  formatQualifiedTable,
  hasAggregation,
  isLikelyExploratorySelect,
  quoteIdentifier,
  scoreOrderByCandidate,
  validateAgentSql,
} from './sql-analysis'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

type Severity = 'info' | 'warning' | 'critical'
type Confidence = 'confirmed' | 'suspected'

interface AgentIssue {
  id: string
  severity: Severity
  category: string
  title: string
  evidence: string
  recommendation: string
  confidence: Confidence
  rule?: string
  sampleSql?: string
}

interface DesignRecommendation {
  priority: Severity
  category: string
  title: string
  rationale: string
  confidence: Confidence
  rule: string
  proposedSql?: string
}

interface ColumnInfo {
  name: string
  type: string
  default_kind?: string
  default_expression?: string
}

interface QueryPattern {
  sample_query?: string
  count?: number
  avg_duration_ms?: number
  max_duration_ms?: number
  avg_read_rows?: number
  avg_result_rows?: number
}

function firstRows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function firstRow<T>(value: unknown): T | null {
  const rows = firstRows<T>(value)
  return rows.length > 0 ? rows[0] : null
}

function asNumber(value: unknown): number {
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function asText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

function getCheckErrors(
  checks: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const [key, value] of Object.entries(checks)) {
    if (
      value &&
      typeof value === 'object' &&
      'error' in value &&
      typeof value.error === 'string'
    ) {
      errors[key] = value.error
    }
  }
  return errors
}

function addIssue(issues: AgentIssue[], issue: AgentIssue) {
  issues.push(issue)
}

function classifyPartSeverity(parts: number): Severity {
  if (parts >= 3000) return 'critical'
  if (parts >= 300) return 'warning'
  return 'info'
}

function inferLowCardinalityCandidate(column: ColumnInfo): boolean {
  if (column.type !== 'String') return false
  return /(status|type|kind|level|country|region|env|browser|device|service|source|category)/i.test(
    column.name
  )
}

function inferRightSizedNumericCandidate(column: ColumnInfo): boolean {
  if (!/^(U?Int64|Nullable\(U?Int64\))/.test(column.type)) return false
  return /(status|code|year|month|day|hour|minute|count|flag|age)$/i.test(
    column.name
  )
}

function isFilterColumnInSortingKey(
  column: string,
  sortingKey: string
): boolean {
  if (!sortingKey) return false
  const normalizedKey = sortingKey.toLowerCase()
  return normalizedKey.includes(column.toLowerCase())
}

function buildSuggestedOrderBy(
  columns: ColumnInfo[],
  patterns: QueryPattern[]
): string[] {
  const knownColumns = new Set(columns.map((column) => column.name))
  const counts = new Map<string, number>()

  for (const pattern of patterns) {
    for (const column of extractWhereColumns(asText(pattern.sample_query))) {
      if (!knownColumns.has(column.name)) continue
      counts.set(column.name, (counts.get(column.name) ?? 0) + column.count)
    }
  }

  return [...counts.entries()]
    .sort((a, b) => {
      const scoreDiff =
        scoreOrderByCandidate(a[0]) - scoreOrderByCandidate(b[0])
      if (scoreDiff !== 0) return scoreDiff
      return b[1] - a[1]
    })
    .slice(0, 5)
    .map(([name]) => name)
}

function applySimpleQueryRepairs(sql: string): {
  repairedSql: string
  changes: string[]
} {
  let repairedSql = sql
  const changes: string[] = []

  const countFixed = repairedSql.replace(/\bcount\s*\(\s*\*\s*\)/gi, 'count()')
  if (countFixed !== repairedSql) {
    repairedSql = countFixed
    changes.push('Replaced count(*) with ClickHouse-preferred count().')
  }

  const skipIndexFixed = repairedSql.replace(
    /\bsystem\.data_skipping_indexes\b/gi,
    'system.data_skipping_indices'
  )
  if (skipIndexFixed !== repairedSql) {
    repairedSql = skipIndexFixed
    changes.push(
      'Replaced system.data_skipping_indexes with system.data_skipping_indices.'
    )
  }

  if (isLikelyExploratorySelect(repairedSql)) {
    repairedSql = `${repairedSql} LIMIT 1000`
    changes.push('Added LIMIT 1000 to cap exploratory result size.')
  }

  return { repairedSql, changes }
}

export function createDiagnosticsTools(hostId: number) {
  return {
    spot_issues: dynamicTool({
      description:
        'Spot likely ClickHouse issues from live metadata and recent query history. Returns ranked findings with evidence and recommended next actions.',
      inputSchema: z.object({
        lastHours: z
          .number()
          .int()
          .min(1)
          .max(720)
          .optional()
          .default(24)
          .describe('Lookback window for query-log based checks'),
        hostId: z.coerce.number().int().optional().describe('Override host ID'),
      }),
      execute: async (input: unknown) => {
        const { lastHours = 24, hostId: toolHostId } = input as {
          lastHours?: number
          hostId?: number
        }
        const resolved = resolveHostId(toolHostId, hostId)
        const hours = Math.floor(Math.max(1, Math.min(720, lastHours)))

        const [patterns, failures, parts, compression, mutations, replication] =
          await Promise.all([
            readOnlyQuery({
              hostId: resolved,
              query: `
                SELECT
                  normalized_query_hash,
                  any(substring(query, 1, 500)) AS sample_query,
                  count() AS count,
                  avg(query_duration_ms) AS avg_duration_ms,
                  max(query_duration_ms) AS max_duration_ms,
                  avg(read_rows) AS avg_read_rows,
                  avg(result_rows) AS avg_result_rows,
                  sum(read_bytes) AS total_read_bytes
                FROM system.query_log
                WHERE type = 'QueryFinish'
                  AND is_initial_query = 1
                  AND event_time > now() - INTERVAL {hours:UInt32} HOUR
                GROUP BY normalized_query_hash
                HAVING count >= 2
                ORDER BY total_read_bytes DESC
                LIMIT 10
              `,
              query_params: { hours },
            }).catch((error: Error) => ({ error: error.message })),
            readOnlyQuery({
              hostId: resolved,
              query: `
                SELECT
                  exception_code,
                  count() AS count,
                  any(substring(exception, 1, 300)) AS sample_error,
                  any(substring(query, 1, 300)) AS sample_query
                FROM system.query_log
                WHERE type = 'ExceptionWhileProcessing'
                  AND event_time > now() - INTERVAL {hours:UInt32} HOUR
                GROUP BY exception_code
                ORDER BY count DESC
                LIMIT 5
              `,
              query_params: { hours },
            }).catch((error: Error) => ({ error: error.message })),
            readOnlyQuery({
              hostId: resolved,
              query: `
                SELECT
                  database,
                  table,
                  count() AS parts,
                  formatReadableSize(sum(bytes_on_disk)) AS size
                FROM system.parts
                WHERE active
                GROUP BY database, table
                HAVING parts >= 300
                ORDER BY parts DESC
                LIMIT 10
              `,
            }).catch((error: Error) => ({ error: error.message })),
            readOnlyQuery({
              hostId: resolved,
              query: `
                SELECT
                  database,
                  table,
                  round(sum(data_compressed_bytes) / nullIf(sum(data_uncompressed_bytes), 0), 3) AS compression_ratio,
                  formatReadableSize(sum(data_uncompressed_bytes)) AS uncompressed
                FROM system.parts
                WHERE active
                GROUP BY database, table
                HAVING sum(data_uncompressed_bytes) > 104857600
                   AND compression_ratio > 0.7
                ORDER BY compression_ratio DESC
                LIMIT 10
              `,
            }).catch((error: Error) => ({ error: error.message })),
            readOnlyQuery({
              hostId: resolved,
              query: `
                SELECT database, table, mutation_id, command, parts_to_do
                FROM system.mutations
                WHERE is_done = 0
                ORDER BY create_time
                LIMIT 10
              `,
            }).catch((error: Error) => ({ error: error.message })),
            readOnlyQuery({
              hostId: resolved,
              query: `
                SELECT database, table, absolute_delay, queue_size, is_readonly
                FROM system.replicas
                WHERE absolute_delay > 60 OR queue_size > 100 OR is_readonly
                ORDER BY absolute_delay DESC, queue_size DESC
                LIMIT 10
              `,
            }).catch((error: Error) => ({ error: error.message })),
          ])

        const issues: AgentIssue[] = []

        for (const row of firstRows<Record<string, unknown>>(patterns)) {
          const avgReadRows = asNumber(row.avg_read_rows)
          const avgResultRows = Math.max(asNumber(row.avg_result_rows), 1)
          const scanRatio = avgReadRows / avgResultRows
          if (scanRatio < 1000 && asNumber(row.avg_duration_ms) < 5000) {
            continue
          }

          addIssue(issues, {
            id: `query-pattern-${asText(row.normalized_query_hash)}`,
            severity: scanRatio > 100_000 ? 'critical' : 'warning',
            category: 'query',
            title: 'Expensive repeated query pattern',
            evidence: `${asNumber(row.count).toLocaleString()} executions, avg ${Math.round(asNumber(row.avg_duration_ms))}ms, scan/result ratio ${Math.round(scanRatio).toLocaleString()}:1`,
            recommendation:
              'Run analyze_query_optimization or repair_query for the sample SQL. Check ORDER BY alignment, SELECT column list, and whether repeated aggregation should become a materialized view.',
            confidence: 'confirmed',
            rule: hasAggregation(asText(row.sample_query))
              ? 'query-mv-incremental'
              : 'schema-pk-prioritize-filters',
            sampleSql: asText(row.sample_query),
          })
        }

        for (const row of firstRows<Record<string, unknown>>(failures)) {
          addIssue(issues, {
            id: `failed-query-${asText(row.exception_code)}`,
            severity: asNumber(row.count) >= 10 ? 'critical' : 'warning',
            category: 'query',
            title: `Repeated query failures: ${asText(row.exception_code)}`,
            evidence: `${asNumber(row.count).toLocaleString()} failures in the last ${hours}h. Sample: ${asText(row.sample_error)}`,
            recommendation:
              'Use repair_query with the sample SQL and error text, then verify schema columns before retrying.',
            confidence: 'confirmed',
            sampleSql: asText(row.sample_query),
          })
        }

        for (const row of firstRows<Record<string, unknown>>(parts)) {
          const partCount = asNumber(row.parts)
          addIssue(issues, {
            id: `parts-${asText(row.database)}-${asText(row.table)}`,
            severity: classifyPartSeverity(partCount),
            category: 'storage',
            title: 'High active part count',
            evidence: `${asText(row.database)}.${asText(row.table)} has ${partCount.toLocaleString()} active parts (${asText(row.size)}).`,
            recommendation:
              'Inspect insert batch size, merge backlog, partition cardinality, and active mutations before forcing OPTIMIZE.',
            confidence: 'confirmed',
            rule: 'insert-batch-size',
          })
        }

        for (const row of firstRows<Record<string, unknown>>(compression)) {
          addIssue(issues, {
            id: `compression-${asText(row.database)}-${asText(row.table)}`,
            severity: 'warning',
            category: 'schema',
            title: 'Weak compression ratio',
            evidence: `${asText(row.database)}.${asText(row.table)} compression ratio is ${asText(row.compression_ratio)} over ${asText(row.uncompressed)} uncompressed.`,
            recommendation:
              'Review String, Nullable, and oversized numeric columns. LowCardinality and native types often improve compression.',
            confidence: 'confirmed',
            rule: 'schema-types-native-types',
          })
        }

        for (const row of firstRows<Record<string, unknown>>(mutations)) {
          addIssue(issues, {
            id: `mutation-${asText(row.database)}-${asText(row.table)}-${asText(row.mutation_id)}`,
            severity: asNumber(row.parts_to_do) > 100 ? 'critical' : 'warning',
            category: 'mutation',
            title: 'Pending mutation',
            evidence: `${asText(row.database)}.${asText(row.table)} mutation ${asText(row.mutation_id)} has ${asNumber(row.parts_to_do).toLocaleString()} parts left.`,
            recommendation:
              'Avoid stacking more mutations. Check whether future updates should use an insert-only ReplacingMergeTree or CollapsingMergeTree pattern.',
            confidence: 'confirmed',
            rule: 'insert-mutation-avoid-update',
          })
        }

        for (const row of firstRows<Record<string, unknown>>(replication)) {
          addIssue(issues, {
            id: `replication-${asText(row.database)}-${asText(row.table)}`,
            severity:
              asNumber(row.absolute_delay) > 300 || row.is_readonly
                ? 'critical'
                : 'warning',
            category: 'replication',
            title: 'Replication lag or readonly replica',
            evidence: `${asText(row.database)}.${asText(row.table)} delay=${asText(row.absolute_delay)}s queue=${asText(row.queue_size)} readonly=${asText(row.is_readonly)}.`,
            recommendation:
              'Inspect replication_queue and Keeper health before changing table layout.',
            confidence: 'confirmed',
          })
        }

        return {
          type: 'agent_issues' as const,
          checkedAt: new Date().toISOString(),
          hostId: resolved,
          lastHours: hours,
          issueCount: issues.length,
          issues: issues.sort((a, b) => {
            const weight = { critical: 0, warning: 1, info: 2 }
            return weight[a.severity] - weight[b.severity]
          }),
          checkErrors: getCheckErrors({
            patterns,
            failures,
            parts,
            compression,
            mutations,
            replication,
          }),
        }
      },
    }),

    repair_query: dynamicTool({
      description:
        'Self-fix a read-only ClickHouse query. Validates safety, runs EXPLAIN checks, applies deterministic repairs, and returns a corrected candidate plus evidence.',
      inputSchema: z.object({
        sql: z.string().describe('Read-only SQL query to repair'),
        error: z.string().optional().describe('Optional ClickHouse error text'),
        database: z
          .string()
          .optional()
          .describe('Default database for table metadata lookup'),
        hostId: z.coerce.number().int().optional().describe('Override host ID'),
      }),
      execute: async (input: unknown) => {
        const {
          sql,
          error,
          database,
          hostId: toolHostId,
        } = input as {
          sql: string
          error?: string
          database?: string
          hostId?: number
        }
        const resolved = resolveHostId(toolHostId, hostId)

        let safeSql: string
        try {
          safeSql = validateAgentSql(sql)
        } catch (err) {
          return {
            type: 'query_repair' as const,
            status: 'blocked' as const,
            originalSql: sql,
            error: err instanceof Error ? err.message : String(err),
            fixedSql: null,
            confidence: 'confirmed' as Confidence,
            changes: [],
            recommendations: [
              'Only SELECT, WITH, DESCRIBE, and EXPLAIN statements can be repaired or analyzed by the agent.',
            ],
          }
        }

        const { repairedSql, changes } = applySimpleQueryRepairs(safeSql)
        const tables = extractReferencedTables(safeSql, database ?? 'default')

        const [syntax, plan, tableInfo] = await Promise.all([
          readOnlyQuery({
            hostId: resolved,
            query: `EXPLAIN SYNTAX ${repairedSql}`,
          }).catch((err: Error) => ({ error: err.message })),
          readOnlyQuery({
            hostId: resolved,
            query: `EXPLAIN PLAN ${repairedSql}`,
          }).catch((err: Error) => ({ error: err.message })),
          Promise.all(
            tables.map((tableRef) =>
              readOnlyQuery({
                hostId: resolved,
                query: `
                  SELECT engine, sorting_key, primary_key, partition_key, total_rows, total_bytes
                  FROM system.tables
                  WHERE database = {database:String} AND name = {table:String}
                `,
                query_params: {
                  database: tableRef.database,
                  table: tableRef.table,
                },
              })
                .then((rows) => ({
                  table: tableRef.qualifiedName,
                  rows,
                }))
                .catch((err: Error) => ({
                  table: tableRef.qualifiedName,
                  error: err.message,
                }))
            )
          ),
        ])

        const recommendations: string[] = []
        if (/\bSELECT\s+\*/i.test(safeSql)) {
          recommendations.push(
            'Replace SELECT * with the specific columns needed; ClickHouse reads every selected column.'
          )
        }
        if (/\bFINAL\b/i.test(safeSql)) {
          recommendations.push(
            'Avoid FINAL on large MergeTree tables unless exact merged state is required.'
          )
        }
        if (hasAggregation(safeSql)) {
          recommendations.push(
            'For repeated aggregations over large windows, consider an incremental materialized view.'
          )
        }
        if (error) {
          recommendations.push(`Original error context: ${error}`)
        }

        return {
          type: 'query_repair' as const,
          status:
            changes.length > 0 ? ('repaired' as const) : ('checked' as const),
          originalSql: safeSql,
          fixedSql: repairedSql !== safeSql ? repairedSql : null,
          changes,
          recommendations,
          confidence: changes.length > 0 ? 'confirmed' : 'suspected',
          explainSyntax: syntax,
          explainPlan: plan,
          tables: tableInfo,
        }
      },
    }),

    recommend_table_design: dynamicTool({
      description:
        'Recommend ClickHouse table structure improvements from table metadata and query history. Suggests ORDER BY, data types, LowCardinality, skip indexes, and materialized views without executing DDL.',
      inputSchema: z.object({
        database: z.string().describe('Database name'),
        table: z.string().describe('Table name'),
        lastDays: z
          .number()
          .int()
          .min(1)
          .max(30)
          .optional()
          .default(7)
          .describe('Lookback window for query pattern analysis'),
        hostId: z.coerce.number().int().optional().describe('Override host ID'),
      }),
      execute: async (input: unknown) => {
        const {
          database,
          table,
          lastDays = 7,
          hostId: toolHostId,
        } = input as {
          database: string
          table: string
          lastDays?: number
          hostId?: number
        }
        const resolved = resolveHostId(toolHostId, hostId)
        const days = Math.floor(Math.max(1, Math.min(30, lastDays)))
        const fullTable = `${database}.${table}`

        const [tableInfoRows, columnRows, partStatsRows, patternRows] =
          await Promise.all([
            readOnlyQuery({
              hostId: resolved,
              query: `
                SELECT engine, sorting_key, primary_key, partition_key, total_rows, total_bytes, create_table_query
                FROM system.tables
                WHERE database = {database:String} AND name = {table:String}
              `,
              query_params: { database, table },
            }).catch((err: Error) => ({ error: err.message })),
            readOnlyQuery({
              hostId: resolved,
              query: `
                SELECT name, type, default_kind, default_expression
                FROM system.columns
                WHERE database = {database:String} AND table = {table:String}
                ORDER BY position
              `,
              query_params: { database, table },
            }).catch((err: Error) => ({ error: err.message })),
            readOnlyQuery({
              hostId: resolved,
              query: `
                SELECT
                  count() AS parts,
                  formatReadableSize(sum(bytes_on_disk)) AS size,
                  round(sum(data_compressed_bytes) / nullIf(sum(data_uncompressed_bytes), 0), 3) AS compression_ratio
                FROM system.parts
                WHERE active AND database = {database:String} AND table = {table:String}
              `,
              query_params: { database, table },
            }).catch((err: Error) => ({ error: err.message })),
            readOnlyQuery({
              hostId: resolved,
              query: `
                SELECT
                  any(substring(query, 1, 700)) AS sample_query,
                  count() AS count,
                  avg(query_duration_ms) AS avg_duration_ms,
                  max(query_duration_ms) AS max_duration_ms,
                  avg(read_rows) AS avg_read_rows,
                  avg(result_rows) AS avg_result_rows
                FROM system.query_log
                WHERE type = 'QueryFinish'
                  AND is_initial_query = 1
                  AND event_time > now() - INTERVAL {days:UInt32} DAY
                  AND has(tables, {fullTable:String})
                GROUP BY normalized_query_hash
                ORDER BY count DESC
                LIMIT 20
              `,
              query_params: { days, fullTable },
            }).catch((err: Error) => ({ error: err.message })),
          ])

        const tableInfo = firstRow<Record<string, unknown>>(tableInfoRows)
        const columns = firstRows<ColumnInfo>(columnRows)
        const partStats = firstRow<Record<string, unknown>>(partStatsRows)
        const patterns = firstRows<QueryPattern>(patternRows)
        const recommendations: DesignRecommendation[] = []

        const sortingKey = asText(tableInfo?.sorting_key)
        const engine = asText(tableInfo?.engine)

        if (
          engine.includes('MergeTree') &&
          (!sortingKey || sortingKey === 'tuple()')
        ) {
          recommendations.push({
            priority: 'critical',
            category: 'primary-key',
            title: 'Define an ORDER BY from query patterns',
            rationale:
              'MergeTree physical ordering is the main sparse index. An arbitrary or empty sorting key causes avoidable scans and is expensive to fix later.',
            confidence: patterns.length > 0 ? 'confirmed' : 'suspected',
            rule: 'schema-pk-plan-before-creation',
          })
        }

        const suggestedOrderBy = buildSuggestedOrderBy(columns, patterns)
        if (suggestedOrderBy.length > 0) {
          const missingFilterColumns = suggestedOrderBy.filter(
            (column) => !isFilterColumnInSortingKey(column, sortingKey)
          )
          if (missingFilterColumns.length > 0) {
            recommendations.push({
              priority: 'warning',
              category: 'primary-key',
              title: 'Align ORDER BY with frequent filters',
              rationale: `Frequent query filters include ${missingFilterColumns.join(', ')}, but the current sorting key is ${sortingKey || 'empty'}.`,
              confidence: 'confirmed',
              rule: 'schema-pk-prioritize-filters',
              proposedSql: `-- For a new table or migration target, evaluate:\nORDER BY (${suggestedOrderBy.join(', ')})`,
            })
          }
        }

        for (const column of columns) {
          if (inferLowCardinalityCandidate(column)) {
            recommendations.push({
              priority: 'warning',
              category: 'data-type',
              title: `Consider LowCardinality for ${column.name}`,
              rationale:
                'The column name suggests repeated categorical values. Confirm uniq() is below 10,000 before changing the type.',
              confidence: 'suspected',
              rule: 'schema-types-lowcardinality',
              proposedSql: `-- Candidate after validating cardinality and defaults\nALTER TABLE ${formatQualifiedTable(database, table)} MODIFY COLUMN ${quoteIdentifier(column.name)} LowCardinality(String)`,
            })
          }

          if (column.type.startsWith('Nullable(')) {
            recommendations.push({
              priority: 'info',
              category: 'data-type',
              title: `Review Nullable usage for ${column.name}`,
              rationale:
                'Nullable adds a null-map column and can slow reads. Keep it only when NULL has distinct meaning.',
              confidence: 'suspected',
              rule: 'schema-types-avoid-nullable',
            })
          }

          if (inferRightSizedNumericCandidate(column)) {
            recommendations.push({
              priority: 'info',
              category: 'data-type',
              title: `Check numeric width for ${column.name}`,
              rationale:
                'The column appears to use a 64-bit integer for values that may fit in a smaller unsigned type.',
              confidence: 'suspected',
              rule: 'schema-types-minimize-bitwidth',
            })
          }
        }

        const parts = asNumber(partStats?.parts)
        if (parts >= 300) {
          recommendations.push({
            priority: classifyPartSeverity(parts),
            category: 'storage',
            title: 'Reduce active part pressure',
            rationale: `${fullTable} has ${parts.toLocaleString()} active parts. This often points to small inserts, high-cardinality partitions, or stalled merges.`,
            confidence: 'confirmed',
            rule: 'insert-batch-size',
          })
        }

        if (
          patterns.some((pattern) =>
            hasAggregation(asText(pattern.sample_query))
          )
        ) {
          recommendations.push({
            priority: 'warning',
            category: 'query-pattern',
            title: 'Consider an incremental materialized view',
            rationale:
              'Recent query history includes repeated aggregations over this table. Pre-aggregating can reduce repeated large scans.',
            confidence: 'confirmed',
            rule: 'query-mv-incremental',
          })
        }

        return {
          type: 'table_design_recommendation' as const,
          hostId: resolved,
          table: fullTable,
          lastDays: days,
          evidence: {
            tableInfo: tableInfoRows,
            columns: columnRows,
            partStats: partStatsRows,
            queryPatterns: patternRows,
          },
          suggestedOrderBy,
          recommendations,
        }
      },
    }),
  }
}
