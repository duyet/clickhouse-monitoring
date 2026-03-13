/**
 * MCP-to-AI-SDK Tool Adapter
 *
 * Converts MCP server tools to AI SDK tool format.
 * Uses dynamicTool for simplified tool definitions.
 */

import type { DataFormat } from '@clickhouse/client'

import { getSkillsMetadata, loadSkillContent } from './skills/registry'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'
import { validateSqlQuery } from '@/lib/api/shared/validators/sql'
import { fetchData } from '@/lib/clickhouse'

/**
 * Create AI SDK tools from MCP tool definitions
 */
export function createMcpTools(hostId: number) {
  const effectiveHostId = hostId ?? 0

  return {
    query: dynamicTool({
      description: `Execute a read-only SQL query against ClickHouse (SELECT and WITH/CTE only).

When to use:
- Ad-hoc data analysis and exploration
- Custom aggregations and joins
- Filtering and sorting results
- Calculating statistics and metrics

Best practices:
- Use LIMIT with large result sets
- Prefer formatReadableSize() for bytes, formatReadableQuantity() for counts
- Filter by time columns (event_time, query_start_time) for query_log
- Use SAMPLE clause for very large tables

Use list_databases/list_tables/get_table_schema first to understand structure.`,
      inputSchema: z.object({
        sql: z.string().describe('SQL query to execute (SELECT only)'),
        hostId: z.number().optional().describe('Host index (default: 0)'),
        format: z
          .string()
          .optional()
          .describe('ClickHouse output format (default: JSONEachRow)'),
      }),
      execute: async (input: unknown) => {
        const {
          sql,
          hostId: toolHostId,
          format,
        } = input as {
          sql: string
          hostId?: number
          format?: string
        }
        try {
          validateSqlQuery(sql)
        } catch (err) {
          throw new Error(
            `Validation error: ${err instanceof Error ? err.message : String(err)}`
          )
        }

        const result = await fetchData({
          query: sql,
          hostId: toolHostId ?? effectiveHostId,
          format: (format ?? 'JSONEachRow') as DataFormat,
          clickhouse_settings: { readonly: '1' },
        })

        if (result.error) {
          throw new Error(result.error.message)
        }

        return result.data
      },
    }),

    list_databases: dynamicTool({
      description: `List all databases on the ClickHouse server with their engines and comments.

When to use:
- Starting point for database exploration
- Understanding database structure
- Finding available databases to query

Returns: Array of databases with name, engine, and comment fields.`,
      inputSchema: z.object({
        hostId: z.number().optional().describe('Host index (default: 0)'),
      }),
      execute: async (input: unknown) => {
        const { hostId: toolHostId } = input as { hostId?: number }
        const result = await fetchData({
          query:
            'SELECT name, engine, comment FROM system.databases ORDER BY name',
          hostId: toolHostId ?? effectiveHostId,
          format: 'JSONEachRow',
          clickhouse_settings: { readonly: '1' },
        })

        if (result.error) {
          throw new Error(result.error.message)
        }

        return result.data
      },
    }),

    list_tables: dynamicTool({
      description: `List tables in a ClickHouse database with row counts and sizes, ordered by size descending.

When to use:
- Finding the largest tables in a database
- Understanding table distribution
- Identifying targets for optimization
- Exploring database structure

Returns: Tables with name, engine, total_rows, and size (formatted).`,
      inputSchema: z.object({
        database: z.string().describe('Database name'),
        hostId: z.number().optional().describe('Host index (default: 0)'),
      }),
      execute: async (input: unknown) => {
        const { database, hostId: toolHostId } = input as {
          database: string
          hostId?: number
        }
        const result = await fetchData({
          query:
            'SELECT name, engine, total_rows, formatReadableSize(total_bytes) AS size FROM system.tables WHERE database = {database:String} ORDER BY total_bytes DESC',
          query_params: { database },
          hostId: toolHostId ?? effectiveHostId,
          format: 'JSONEachRow',
          clickhouse_settings: { readonly: '1' },
        })

        if (result.error) {
          throw new Error(result.error.message)
        }

        return result.data
      },
    }),

    get_table_schema: dynamicTool({
      description: `Get column definitions for a specific ClickHouse table including types, defaults, and comments.

When to use:
- Before writing complex queries
- Understanding table structure
- Checking column types for joins
- Finding available columns for filtering

Returns: Array of columns with name, type, default_kind, default_expression, and comment.`,
      inputSchema: z.object({
        database: z.string().describe('Database name'),
        table: z.string().describe('Table name'),
        hostId: z.number().optional().describe('Host index (default: 0)'),
      }),
      execute: async (input: unknown) => {
        const {
          database,
          table,
          hostId: toolHostId,
        } = input as {
          database: string
          table: string
          hostId?: number
        }
        const result = await fetchData({
          query:
            'SELECT name, type, default_kind, default_expression, comment FROM system.columns WHERE database = {database:String} AND table = {table:String} ORDER BY position',
          query_params: { database, table },
          hostId: toolHostId ?? effectiveHostId,
          format: 'JSONEachRow',
          clickhouse_settings: { readonly: '1' },
        })

        if (result.error) {
          throw new Error(result.error.message)
        }

        return result.data
      },
    }),

    get_metrics: dynamicTool({
      description: `Get key ClickHouse server metrics: version, uptime, active connections, and memory usage.

When to use:
- Checking server health and status
- Understanding cluster configuration
- Diagnosing connection issues
- Verifying server version for feature compatibility

Returns: Object with version, uptime_seconds, and metrics array (TCPConnection, HTTPConnection, MemoryTracking).`,
      inputSchema: z.object({
        hostId: z.number().optional().describe('Host index (default: 0)'),
      }),
      execute: async (input: unknown) => {
        const { hostId: toolHostId } = input as { hostId?: number }
        const targetHostId = toolHostId ?? effectiveHostId

        const [versionResult, uptimeResult, metricsResult] = await Promise.all([
          fetchData({
            query: 'SELECT version() AS version',
            hostId: targetHostId,
            format: 'JSONEachRow',
            clickhouse_settings: { readonly: '1' },
          }),
          fetchData({
            query: 'SELECT uptime() AS uptime_seconds',
            hostId: targetHostId,
            format: 'JSONEachRow',
            clickhouse_settings: { readonly: '1' },
          }),
          fetchData({
            query:
              "SELECT metric, value FROM system.metrics WHERE metric IN ('TCPConnection', 'HTTPConnection', 'MemoryTracking') ORDER BY metric",
            hostId: targetHostId,
            format: 'JSONEachRow',
            clickhouse_settings: { readonly: '1' },
          }),
        ])

        const errors = [versionResult, uptimeResult, metricsResult]
          .filter((r) => r.error)
          .map((r) => r.error!.message)

        if (errors.length > 0) {
          throw new Error(`Errors: ${errors.join('; ')}`)
        }

        const versionRow = Array.isArray(versionResult.data)
          ? versionResult.data[0]
          : versionResult.data
        const uptimeRow = Array.isArray(uptimeResult.data)
          ? uptimeResult.data[0]
          : uptimeResult.data

        return {
          version: (versionRow as Record<string, unknown>)?.version,
          uptime_seconds: (uptimeRow as Record<string, unknown>)
            ?.uptime_seconds,
          metrics: metricsResult.data,
        }
      },
    }),

    get_running_queries: dynamicTool({
      description: `List currently running queries on the ClickHouse server, ordered by elapsed time.

When to use:
- Identifying long-running queries
- Finding queries that may be blocking others
- Real-time performance monitoring
- Investigating system load

Returns: Array with query_id, user, elapsed (seconds), read_rows, memory_usage, and truncated query text.`,
      inputSchema: z.object({
        hostId: z.number().optional().describe('Host index (default: 0)'),
      }),
      execute: async (input: unknown) => {
        const { hostId: toolHostId } = input as { hostId?: number }
        const result = await fetchData({
          query:
            'SELECT query_id, user, elapsed, read_rows, memory_usage, substring(query, 1, 200) AS query FROM system.processes ORDER BY elapsed DESC',
          hostId: toolHostId ?? effectiveHostId,
          format: 'JSONEachRow',
          clickhouse_settings: { readonly: '1' },
        })

        if (result.error) {
          throw new Error(result.error.message)
        }

        return result.data
      },
    }),

    get_slow_queries: dynamicTool({
      description: `Get the slowest completed queries from the query log, ordered by duration.

When to use:
- Performance analysis and optimization
- Finding queries that need tuning
- Identifying resource-intensive operations
- Historical performance review

Returns: Array with query_id, user, query_duration_ms, read_rows, memory_usage, truncated query, and event_time.`,
      inputSchema: z.object({
        limit: z
          .number()
          .optional()
          .describe('Max number of queries to return (default: 10)'),
        hostId: z.number().optional().describe('Host index (default: 0)'),
      }),
      execute: async (input: unknown) => {
        const { limit, hostId: toolHostId } = input as {
          limit?: number
          hostId?: number
        }
        const effectiveLimit = limit ?? 10

        const result = await fetchData({
          query:
            "SELECT query_id, user, query_duration_ms, read_rows, memory_usage, substring(query, 1, 200) AS query, event_time FROM system.query_log WHERE type = 'QueryFinish' AND is_initial_query = 1 ORDER BY query_duration_ms DESC LIMIT {limit:UInt32}",
          query_params: { limit: effectiveLimit },
          hostId: toolHostId ?? effectiveHostId,
          format: 'JSONEachRow',
          clickhouse_settings: { readonly: '1' },
        })

        if (result.error) {
          throw new Error(result.error.message)
        }

        return result.data
      },
    }),

    get_merge_status: dynamicTool({
      description: `Get currently running merge operations with progress, size, and elapsed time.

When to use:
- Monitoring background merge activity
- Understanding write amplification
- Identifying stuck or long-running merges
- Analyzing partition maintenance

Returns: Array with database, table, progress_pct, size (formatted), and elapsed (seconds).`,
      inputSchema: z.object({
        hostId: z.number().optional().describe('Host index (default: 0)'),
      }),
      execute: async (input: unknown) => {
        const { hostId: toolHostId } = input as { hostId?: number }
        const result = await fetchData({
          query:
            'SELECT database, table, round(progress * 100, 2) AS progress_pct, formatReadableSize(total_size_bytes_compressed) AS size, elapsed FROM system.merges ORDER BY elapsed DESC',
          hostId: toolHostId ?? effectiveHostId,
          format: 'JSONEachRow',
          clickhouse_settings: { readonly: '1' },
        })

        if (result.error) {
          throw new Error(result.error.message)
        }

        return result.data
      },
    }),

    load_skill: dynamicTool({
      description: `Load specialized knowledge to provide expert-level guidance on specific topics.

Available skills:
${getSkillsMetadata()
  .map((s) => `- ${s.name}: ${s.description}`)
  .join('\n')}

When to use:
- User asks about best practices, design patterns, or optimization strategies
- You need expert-level knowledge beyond your built-in instructions
- User asks "how should I design..." or "what's the best way to..."

The skill content will be returned as text that you should follow as expert guidance.`,
      inputSchema: z.object({
        name: z.string().describe('Name of the skill to load'),
      }),
      execute: async (input: unknown) => {
        const { name } = input as { name: string }
        const skill = loadSkillContent(name)
        if (!skill) {
          const available = getSkillsMetadata()
            .map((s) => s.name)
            .join(', ')
          throw new Error(
            `Skill '${name}' not found. Available skills: ${available}`
          )
        }
        return {
          skill: skill.name,
          description: skill.description,
          content: skill.content,
        }
      },
    }),

    explore_table_schema: dynamicTool({
      description: `Comprehensive schema exploration with relationship discovery.

Three modes based on parameters:
1. No params: List all databases (same as list_databases)
2. database only: Summary of all tables with keys, engine, and sizes
3. database + table: Full metadata with columns, keys, and upstream/downstream dependencies

When to use:
- Understanding table structure and relationships
- Finding what tables depend on each other
- Analyzing key definitions (partition, sorting, primary keys)
- Discovering potential foreign key relationships
- Checking engine types and table metadata

Returns for database+table mode:
- Table info: engine, keys (partition/sorting/primary/sampling), rows, bytes, create_table_query
- Columns: with flags for is_in_primary_key, is_in_sorting_key, is_in_partition_key
- Upstream dependencies: tables this table depends on
- Downstream dependencies: tables that depend on this table
- Potential foreign keys: pattern-based detection (_id columns)`,
      inputSchema: z.object({
        database: z
          .string()
          .optional()
          .describe(
            'Database name (optional - if omitted, lists all databases)'
          ),
        table: z
          .string()
          .optional()
          .describe(
            'Table name (requires database. If provided, returns full schema with relationships)'
          ),
        hostId: z.number().optional().describe('Host index (default: 0)'),
      }),
      execute: async (input: unknown) => {
        const {
          database,
          table,
          hostId: toolHostId,
        } = input as {
          database?: string
          table?: string
          hostId?: number
        }
        const targetHostId = toolHostId ?? effectiveHostId

        // Mode 1: No database - list all databases
        if (!database) {
          const result = await fetchData({
            query:
              'SELECT name, engine, comment FROM system.databases ORDER BY name',
            hostId: targetHostId,
            format: 'JSONEachRow',
            clickhouse_settings: { readonly: '1' },
          })

          if (result.error) {
            throw new Error(result.error.message)
          }

          return result.data
        }

        // Mode 2: Database only - summary of all tables
        if (!table) {
          const result = await fetchData({
            query:
              "SELECT name, engine, partition_key, sorting_key, primary_key, sampling_key, total_rows, formatReadableSize(total_bytes) AS readable_size FROM system.tables WHERE database = {database:String} AND is_temporary = 0 AND name NOT LIKE '.inner.%' ORDER BY total_bytes DESC",
            query_params: { database },
            hostId: targetHostId,
            format: 'JSONEachRow',
            clickhouse_settings: { readonly: '1' },
          })

          if (result.error) {
            throw new Error(result.error.message)
          }

          return result.data
        }

        // Mode 3: Database + table - full schema with relationships
        const [tableResult, columnsResult, upstreamResult, downstreamResult] =
          await Promise.all([
            // Table metadata
            fetchData({
              query:
                'SELECT database, name, engine, engine_full, partition_key, sorting_key, primary_key, sampling_key, total_rows, total_bytes, formatReadableSize(total_bytes) AS readable_size, create_table_query FROM system.tables WHERE database = {database:String} AND name = {table:String}',
              query_params: { database, table },
              hostId: targetHostId,
              format: 'JSONEachRow',
              clickhouse_settings: { readonly: '1' },
            }),
            // Columns with key flags
            fetchData({
              query:
                'SELECT name, type, default_kind, default_expression, comment, is_in_primary_key, is_in_sorting_key, is_in_partition_key FROM system.columns WHERE database = {database:String} AND table = {table:String} ORDER BY position',
              query_params: { database, table },
              hostId: targetHostId,
              format: 'JSONEachRow',
              clickhouse_settings: { readonly: '1' },
            }),
            // Upstream dependencies (tables this table depends on)
            fetchData({
              query:
                "SELECT dep_database, dep_table, t.engine FROM (SELECT arrayJoin(dependencies_database) AS dep_database, arrayJoin(dependencies_table) AS dep_table FROM system.tables WHERE database = {database:String} AND name = {table:String}) AS deps LEFT JOIN system.tables AS t ON t.database = deps.dep_database AND t.name = deps.dep_table WHERE dep_database != '' AND dep_table != ''",
              query_params: { database, table },
              hostId: targetHostId,
              format: 'JSONEachRow',
              clickhouse_settings: { readonly: '1' },
            }),
            // Downstream dependencies (tables that depend on this table)
            fetchData({
              query:
                'SELECT database AS dependent_database, name AS dependent_table, engine FROM system.tables WHERE has(dependencies_database, {database:String}) AND has(dependencies_table, {table:String}) ORDER BY database, name',
              query_params: { database, table },
              hostId: targetHostId,
              format: 'JSONEachRow',
              clickhouse_settings: { readonly: '1' },
            }),
          ])

        const errors = [
          tableResult,
          columnsResult,
          upstreamResult,
          downstreamResult,
        ]
          .filter((r) => r.error)
          .map((r) => r.error!.message)

        if (errors.length > 0) {
          throw new Error(`Errors: ${errors.join('; ')}`)
        }

        const tableRow = Array.isArray(tableResult.data)
          ? tableResult.data[0]
          : tableResult.data

        // Detect potential foreign keys from column names ending with _id
        const columns = Array.isArray(columnsResult.data)
          ? columnsResult.data
          : []
        const potentialForeignKeys = (columns as Record<string, unknown>[])
          .filter((col) => {
            const name = col.name as string
            return name.endsWith('_id') && name !== 'id'
          })
          .map((col) => {
            const name = col.name as string
            const tableName = name.endsWith('_id')
              ? `${name.slice(0, -3)}s` // user_id -> users
              : name
            return { column: name, potential_table: tableName }
          })

        return {
          table: tableRow,
          columns: columnsResult.data,
          upstream_dependencies: upstreamResult.data,
          downstream_dependencies: downstreamResult.data,
          potential_foreign_keys: potentialForeignKeys,
        }
      },
    }),
  }
}
