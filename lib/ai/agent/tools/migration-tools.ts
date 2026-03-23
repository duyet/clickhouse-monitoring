/**
 * Schema Migration Assistant Tools
 *
 * Tools to analyze the impact of schema changes and assess column usage
 * before executing DDL operations on production tables.
 */

import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createMigrationTools(hostId: number) {
  return {
    analyze_schema_change: dynamicTool({
      description:
        'Analyze the impact of a proposed ALTER TABLE before executing it. Returns table state, active parts, running mutations, replication status, and classifies whether the change requires a data rewrite. Use before any DDL operation on production tables.',
      inputSchema: z.object({
        database: z.string().describe('Database name'),
        table: z.string().describe('Table name'),
        alterStatement: z
          .string()
          .describe(
            'The ALTER TABLE statement to analyze (will NOT be executed)'
          ),
        hostId: z.number().int().optional().describe('Host ID override'),
      }),
      execute: async (input: unknown) => {
        const {
          database,
          table,
          alterStatement,
          hostId: toolHostId,
        } = input as {
          database: string
          table: string
          alterStatement: string
          hostId?: number
        }
        const resolved = resolveHostId(toolHostId, hostId)

        const [tableInfo, parts, mutations, replication, columns] =
          await Promise.all([
            readOnlyQuery({
              query: `SELECT engine, sorting_key, primary_key, partition_key, total_rows, total_bytes, formatReadableSize(total_bytes) as readable_size, create_table_query FROM system.tables WHERE database = {db:String} AND name = {tbl:String}`,
              query_params: { db: database, tbl: table },
              hostId: resolved,
            }).catch((e: Error) => ({ error: e.message })),

            readOnlyQuery({
              query: `SELECT count() as active_parts, formatReadableSize(sum(bytes_on_disk)) as total_size, min(modification_time) as oldest_part, max(modification_time) as newest_part FROM system.parts WHERE database = {db:String} AND table = {tbl:String} AND active`,
              query_params: { db: database, tbl: table },
              hostId: resolved,
            }).catch((e: Error) => ({ error: e.message })),

            readOnlyQuery({
              query: `SELECT mutation_id, command, create_time, parts_to_do, is_done FROM system.mutations WHERE database = {db:String} AND table = {tbl:String} ORDER BY create_time DESC LIMIT 5`,
              query_params: { db: database, tbl: table },
              hostId: resolved,
            }).catch((e: Error) => ({ error: e.message })),

            readOnlyQuery({
              query: `SELECT is_leader, is_readonly, absolute_delay, queue_size, inserts_in_queue, merges_in_queue FROM system.replicas WHERE database = {db:String} AND table = {tbl:String}`,
              query_params: { db: database, tbl: table },
              hostId: resolved,
            }).catch((e: Error) => ({ error: e.message })),

            readOnlyQuery({
              query: `SELECT name, type, default_kind, default_expression FROM system.columns WHERE database = {db:String} AND table = {tbl:String} ORDER BY position`,
              query_params: { db: database, tbl: table },
              hostId: resolved,
            }).catch((e: Error) => ({ error: e.message })),
          ])

        // Classify the ALTER type
        const alterLower = alterStatement.toLowerCase()
        const { changeType, requiresRewrite } =
          classifyAlterStatement(alterLower)

        const warnings: string[] = []

        if (requiresRewrite) {
          warnings.push(
            'This change requires rewriting all data parts. Schedule during low-traffic periods.'
          )
        }

        if (
          Array.isArray(mutations) &&
          mutations.some((m: Record<string, unknown>) => !m.is_done)
        ) {
          warnings.push(
            'There are pending mutations on this table. Wait for them to complete before adding more.'
          )
        }

        return {
          table: `${database}.${table}`,
          proposed_change: alterStatement,
          change_classification: {
            type: changeType,
            requires_data_rewrite: requiresRewrite,
            risk_level: requiresRewrite ? 'HIGH' : 'LOW',
          },
          current_state: {
            table_info: tableInfo,
            parts,
            pending_mutations: mutations,
            replication,
            columns,
          },
          warnings,
        }
      },
    }),

    get_column_usage: dynamicTool({
      description:
        'Analyze query_log to find which queries reference a specific column. Helps assess the blast radius of dropping or renaming a column. Returns query count, affected users, and sample queries.',
      inputSchema: z.object({
        database: z.string().describe('Database name'),
        table: z.string().describe('Table name'),
        column: z.string().describe('Column name to search for'),
        lastDays: z
          .number()
          .int()
          .min(1)
          .max(30)
          .optional()
          .default(7)
          .describe('Days of query history to search (default: 7)'),
        hostId: z.number().int().optional().describe('Host ID override'),
      }),
      execute: async (input: unknown) => {
        const {
          database,
          table,
          column,
          lastDays = 7,
          hostId: toolHostId,
        } = input as {
          database: string
          table: string
          column: string
          lastDays?: number
          hostId?: number
        }
        const resolved = resolveHostId(toolHostId, hostId)
        const safeDays = Math.floor(Math.max(1, Math.min(30, lastDays)))

        const [usage, users] = await Promise.all([
          readOnlyQuery({
            query: `
              SELECT
                count() as query_count,
                countDistinct(user) as unique_users,
                min(event_time) as first_seen,
                max(event_time) as last_seen
              FROM system.query_log
              WHERE type = 'QueryFinish'
                AND event_time > now() - INTERVAL {days:UInt32} DAY
                AND query LIKE {pattern:String}
                AND has(tables, {fullTable:String})
            `,
            query_params: {
              days: safeDays.toString(),
              pattern: `%${column}%`,
              fullTable: `${database}.${table}`,
            },
            hostId: resolved,
          }).catch((e: Error) => ({ error: e.message })),

          readOnlyQuery({
            query: `
              SELECT
                user,
                count() as query_count,
                any(substring(query, 1, 300)) as sample_query
              FROM system.query_log
              WHERE type = 'QueryFinish'
                AND event_time > now() - INTERVAL {days:UInt32} DAY
                AND query LIKE {pattern:String}
                AND has(tables, {fullTable:String})
              GROUP BY user
              ORDER BY query_count DESC
              LIMIT 10
            `,
            query_params: {
              days: safeDays.toString(),
              pattern: `%${column}%`,
              fullTable: `${database}.${table}`,
            },
            hostId: resolved,
          }).catch((e: Error) => ({ error: e.message })),
        ])

        return {
          column: `${database}.${table}.${column}`,
          time_window_days: safeDays,
          usage_summary: usage,
          users_affected: users,
          recommendation:
            'Review the users and query patterns before proceeding with schema changes. Contact affected users if dropping the column.',
        }
      },
    }),
  }
}

/**
 * Classify an ALTER TABLE statement to determine its type and whether
 * it requires a data rewrite.
 */
function classifyAlterStatement(alterLower: string): {
  changeType: string
  requiresRewrite: boolean
} {
  if (alterLower.includes('add column')) {
    return { changeType: 'add_column', requiresRewrite: false }
  }
  if (alterLower.includes('drop column')) {
    return { changeType: 'drop_column', requiresRewrite: false }
  }
  if (
    alterLower.includes('modify column') ||
    alterLower.includes('alter column')
  ) {
    return { changeType: 'modify_column', requiresRewrite: true }
  }
  if (alterLower.includes('rename column')) {
    return { changeType: 'rename_column', requiresRewrite: false }
  }
  if (alterLower.includes('drop index')) {
    return { changeType: 'index_change', requiresRewrite: false }
  }
  if (alterLower.includes('add index')) {
    return { changeType: 'index_change', requiresRewrite: true }
  }
  if (
    alterLower.includes('modify order by') ||
    alterLower.includes('modify sorting key')
  ) {
    return { changeType: 'sorting_key_change', requiresRewrite: true }
  }
  if (alterLower.includes('drop projection')) {
    return { changeType: 'projection_change', requiresRewrite: false }
  }
  if (alterLower.includes('add projection')) {
    return { changeType: 'projection_change', requiresRewrite: true }
  }
  if (alterLower.includes('modify ttl')) {
    return { changeType: 'ttl_change', requiresRewrite: false }
  }
  return { changeType: 'unknown', requiresRewrite: false }
}
