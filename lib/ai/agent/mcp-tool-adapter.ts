/**
 * MCP-to-AI-SDK Tool Adapter
 *
 * Converts MCP server tools to AI SDK tool format.
 * Uses dynamicTool for simplified tool definitions.
 */

import type { DataFormat } from '@clickhouse/client'

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
      description:
        'Execute a read-only SQL query against ClickHouse. Only SELECT and WITH (CTE) queries are allowed.',
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
      description:
        'List all databases on the ClickHouse server with their engines and comments.',
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
      description:
        'List tables in a ClickHouse database with row counts and sizes, ordered by size descending.',
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
      description:
        'Get column definitions for a specific ClickHouse table including types, defaults, and comments.',
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
      description:
        'Get key ClickHouse server metrics: version, uptime, active connections, and memory usage.',
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
      description:
        'List currently running queries on the ClickHouse server, ordered by elapsed time.',
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
      description:
        'Get the slowest completed queries from the query log, ordered by duration.',
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
      description:
        'Get currently running merge operations with progress, size, and elapsed time.',
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
  }
}
