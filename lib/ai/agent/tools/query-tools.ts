'use client'

import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createQueryTools(hostId: number) {
  return {
    get_running_queries: dynamicTool({
      description:
        'Get currently running queries. Useful for identifying long-running queries and monitoring active workloads.',
      inputSchema: z.object({
        hostId: z
          .number()
          .int()
          .optional()
          .describe('Host ID to query (defaults to provided host)'),
      }),
      execute: async (input: unknown) => {
        const { hostId: toolHostId } = input as { hostId?: number }
        const resolvedHostId = resolveHostId(toolHostId, hostId)
        const result = await readOnlyQuery({
          query: `
            SELECT
              query_id,
              user,
              elapsed,
              read_rows,
              memory_usage,
              substring(query, 1, 200) AS query
            FROM system.processes
            ORDER BY elapsed DESC
          `,
          hostId: resolvedHostId,
        })
        return result
      },
    }),

    get_slow_queries: dynamicTool({
      description:
        'Get the slowest completed queries. Useful for identifying performance bottlenecks and slow query patterns.',
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .default(10)
          .describe('Number of queries to return'),
        hostId: z
          .number()
          .int()
          .optional()
          .describe('Host ID to query (defaults to provided host)'),
      }),
      execute: async (input: unknown) => {
        const { limit = 10, hostId: toolHostId } = input as {
          limit?: number
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)
        const result = await readOnlyQuery({
          query: `
            SELECT
              query_id,
              user,
              query_duration_ms,
              read_rows,
              memory_usage,
              substring(query, 1, 200) AS query,
              event_time
            FROM system.query_log
            WHERE type = 'QueryFinish' AND is_initial_query = 1
            ORDER BY query_duration_ms DESC
            LIMIT {limit:UInt32}
          `,
          query_params: { limit: limit.toString() },
          hostId: resolvedHostId,
        })
        return result
      },
    }),

    get_failed_queries: dynamicTool({
      description:
        'Get recent failed queries. Useful for troubleshooting errors and understanding query failures.',
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .default(20)
          .describe('Number of failed queries to return'),
        lastHours: z
          .number()
          .int()
          .min(1)
          .max(720)
          .optional()
          .default(24)
          .describe('Time window in hours'),
        hostId: z
          .number()
          .int()
          .optional()
          .describe('Host ID to query (defaults to provided host)'),
      }),
      execute: async (input: unknown) => {
        const {
          limit = 20,
          lastHours = 24,
          hostId: toolHostId,
        } = input as {
          limit?: number
          lastHours?: number
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)
        const result = await readOnlyQuery({
          query: `
            SELECT
              query_id,
              user,
              exception_code,
              substring(exception, 1, 300) AS error,
              query_duration_ms,
              event_time,
              substring(query, 1, 200) AS query
            FROM system.query_log
            WHERE type = 'ExceptionWhileProcessing' AND event_time > now() - INTERVAL {lastHours:UInt32} HOUR
            ORDER BY event_time DESC
            LIMIT {limit:UInt32}
          `,
          query_params: {
            limit: limit.toString(),
            lastHours: lastHours.toString(),
          },
          hostId: resolvedHostId,
        })
        return result
      },
    }),

    get_expensive_queries: dynamicTool({
      description:
        'Get top queries by resource usage. Useful for identifying resource-intensive queries affecting system performance.',
      inputSchema: z.object({
        sortBy: z
          .enum(['memory', 'read_bytes', 'duration'])
          .describe('Sort by memory usage, bytes read, or query duration'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .default(10)
          .describe('Number of queries to return'),
        lastHours: z
          .number()
          .int()
          .min(1)
          .max(720)
          .optional()
          .default(24)
          .describe('Time window in hours'),
        hostId: z
          .number()
          .int()
          .optional()
          .describe('Host ID to query (defaults to provided host)'),
      }),
      execute: async (input: unknown) => {
        const {
          sortBy,
          limit = 10,
          lastHours = 24,
          hostId: toolHostId,
        } = input as {
          sortBy: 'memory' | 'read_bytes' | 'duration'
          limit?: number
          lastHours?: number
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)

        // Map sortBy to ClickHouse column name
        const sortColumnMap: Record<string, string> = {
          memory: 'memory_usage',
          read_bytes: 'read_bytes',
          duration: 'query_duration_ms',
        }
        const sortColumn = sortColumnMap[sortBy]

        const result = await readOnlyQuery({
          query: `
            SELECT
              query_id,
              user,
              query_duration_ms,
              read_rows,
              read_bytes,
              memory_usage,
              substring(query, 1, 200) AS query,
              event_time
            FROM system.query_log
            WHERE type = 'QueryFinish' AND is_initial_query = 1 AND event_time > now() - INTERVAL {lastHours:UInt32} HOUR
            ORDER BY ${sortColumn} DESC
            LIMIT {limit:UInt32}
          `,
          query_params: {
            limit: limit.toString(),
            lastHours: lastHours.toString(),
          },
          hostId: resolvedHostId,
        })
        return result
      },
    }),

    get_query_patterns: dynamicTool({
      description:
        'Get aggregated query fingerprints and patterns. Useful for identifying common query patterns and their performance characteristics.',
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .default(20)
          .describe('Number of patterns to return'),
        lastHours: z
          .number()
          .int()
          .min(1)
          .max(720)
          .optional()
          .default(24)
          .describe('Time window in hours'),
        minCount: z
          .number()
          .int()
          .min(1)
          .optional()
          .default(2)
          .describe('Minimum occurrence count'),
        hostId: z
          .number()
          .int()
          .optional()
          .describe('Host ID to query (defaults to provided host)'),
      }),
      execute: async (input: unknown) => {
        const {
          limit = 20,
          lastHours = 24,
          minCount = 2,
          hostId: toolHostId,
        } = input as {
          limit?: number
          lastHours?: number
          minCount?: number
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)
        const result = await readOnlyQuery({
          query: `
            SELECT
              normalized_query_hash,
              any(substring(query, 1, 200)) AS sample_query,
              count() AS count,
              avg(query_duration_ms) AS avg_duration_ms,
              max(query_duration_ms) AS max_duration_ms,
              sum(read_rows) AS total_read_rows,
              sum(read_bytes) AS total_read_bytes
            FROM system.query_log
            WHERE type = 'QueryFinish' AND is_initial_query = 1 AND event_time > now() - INTERVAL {lastHours:UInt32} HOUR
            GROUP BY normalized_query_hash
            HAVING count >= {minCount:UInt32}
            ORDER BY count DESC
            LIMIT {limit:UInt32}
          `,
          query_params: {
            limit: limit.toString(),
            lastHours: lastHours.toString(),
            minCount: minCount.toString(),
          },
          hostId: resolvedHostId,
        })
        return result
      },
    }),

    explain_query: dynamicTool({
      description:
        'Get the execution plan for a query. Useful for understanding query optimization and identifying performance issues.',
      inputSchema: z.object({
        sql: z.string().describe('SQL query to explain'),
        type: z
          .enum(['plan', 'pipeline', 'indexes'])
          .optional()
          .default('plan')
          .describe('Type of explanation'),
        hostId: z
          .number()
          .int()
          .optional()
          .describe('Host ID to query (defaults to provided host)'),
      }),
      execute: async (input: unknown) => {
        const {
          sql,
          type = 'plan',
          hostId: toolHostId,
        } = input as {
          sql: string
          type?: 'plan' | 'pipeline' | 'indexes'
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)

        // Map type to ClickHouse EXPLAIN type
        const typeMap: Record<string, string> = {
          plan: 'PLAN',
          pipeline: 'PIPELINE',
          indexes: 'INDEXES',
        }
        const explainType = typeMap[type]

        // Build EXPLAIN query - EXPLAIN is read-only, no validation needed
        const explainQuery = `EXPLAIN ${explainType} ${sql}`

        const result = await readOnlyQuery({
          query: explainQuery,
          hostId: resolvedHostId,
        })
        return result
      },
    }),
  }
}
