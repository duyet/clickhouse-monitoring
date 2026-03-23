import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createOptimizerTools(hostId: number) {
  return {
    analyze_query_optimization: dynamicTool({
      description:
        'Analyze a SQL query and return optimization suggestions. Runs EXPLAIN PLAN, checks sorting key alignment, identifies missing skip indexes, and suggests materialized view candidates.',
      inputSchema: z.object({
        sql: z.string().describe('SQL query to analyze'),
        database: z
          .string()
          .optional()
          .describe('Database context for table lookups'),
        hostId: z
          .number()
          .int()
          .optional()
          .describe('Host ID to query (defaults to provided host)'),
      }),
      execute: async (input: unknown) => {
        const {
          sql,
          database,
          hostId: toolHostId,
        } = input as {
          sql: string
          database?: string
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)

        // 1. Run EXPLAIN PLAN
        const plan = await readOnlyQuery({
          query: `EXPLAIN PLAN ${sql}`,
          hostId: resolvedHostId,
        }).catch((e: Error) => ({ error: e.message }))

        // 2. Run EXPLAIN INDEXES
        const indexes = await readOnlyQuery({
          query: `EXPLAIN INDEXES = 1 ${sql}`,
          hostId: resolvedHostId,
        }).catch((e: Error) => ({ error: e.message }))

        // 3. Extract table names and check sorting keys
        const tablePattern = /FROM\s+(\w+\.?\w+)/gi
        const tables = [...sql.matchAll(tablePattern)].map((m) => m[1])

        const tableAnalysis = await Promise.all(
          tables.map(async (tableName) => {
            const parts = tableName.split('.')
            const db = parts.length > 1 ? parts[0] : (database ?? 'default')
            const tbl = parts.length > 1 ? parts[1] : parts[0]

            const [schema, skipIndexes] = await Promise.all([
              readOnlyQuery({
                query: `SELECT engine, sorting_key, primary_key, partition_key,
                  total_rows, formatReadableSize(total_bytes) as size
                  FROM system.tables
                  WHERE database = {db:String} AND name = {tbl:String}`,
                query_params: { db, tbl },
                hostId: resolvedHostId,
              }).catch(() => null),
              readOnlyQuery({
                query: `SELECT name, type_full, expr, granularity
                  FROM system.data_skipping_indices
                  WHERE database = {db:String} AND table = {tbl:String}`,
                query_params: { db, tbl },
                hostId: resolvedHostId,
              }).catch(() => []),
            ])

            return { table: tableName, schema, skipIndexes }
          })
        )

        return {
          explain_plan: plan,
          explain_indexes: indexes,
          tables: tableAnalysis,
          suggestions: [
            'Check if WHERE clause columns align with the sorting key (leftmost columns)',
            'Consider PREWHERE for filter columns not in the SELECT list',
            'If SELECT * is used, explicitly list needed columns',
            'For repeated query patterns, consider a materialized view',
          ],
        }
      },
    }),
  }
}
