/**
 * LangGraph tool: Get currently running queries.
 *
 * This tool enables LLMs to see what queries are currently executing
 * on the ClickHouse server.
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod/v3'
import { fetchData } from '@/lib/clickhouse'

/**
 * Get currently running queries on ClickHouse
 *
 * Returns active queries with execution time and memory usage.
 * Ordered by elapsed time descending.
 */
export const getRunningQueriesTool = tool(
  async ({ hostId = 0, limit = 20 }) => {
    const result = await fetchData({
      query: `SELECT
        query_id,
        user,
        query,
        elapsed,
        memory_usage,
        row_count,
        bytes_read_uncompressed
      FROM system.processes
      WHERE type = 'Query'
      ORDER BY elapsed DESC
      LIMIT {limit:UInt64}`,
      query_params: { limit: limit.toString() },
      hostId,
      format: 'JSONEachRow',
      clickhouse_settings: { readonly: '1' },
    })

    if (result.error) {
      throw new Error(`Failed to get running queries: ${result.error.message}`)
    }

    const queries = (result.data ?? []) as Array<{
      query_id: string
      user: string
      query: string
      elapsed: number
      memory_usage: bigint | number
      row_count: bigint | number
      bytes_read_uncompressed: bigint | number
    }>

    return {
      queries: queries.map((q) => ({
        queryId: q.query_id,
        user: q.user,
        query: q.query,
        elapsedSeconds: q.elapsed,
        memoryUsage: Number(q.memory_usage),
        rowCount: Number(q.row_count),
        bytesRead: Number(q.bytes_read_uncompressed),
      })),
      count: queries.length,
      limit,
      hostId,
    }
  },
  {
    name: 'get_running_queries',
    description: `Get currently running queries on the ClickHouse server.

**Use this tool when user asks about:**
- "What queries are running?", "show active queries"
- "Current query status", "what's executing now?"
- "Long-running queries", "query performance"

**Parameters:**
- limit (optional): Maximum queries to return (1-100, default: 20)

**Returns:** Array of running queries with queryId, user, query, elapsedSeconds, memoryUsage, rowCount, bytesRead

**Example:** get_running_queries(limit=10) → { queries: [{queryId: "abc-123", user: "default", query: "SELECT count() FROM...", elapsedSeconds: 5.2, memoryUsage: 1048576}], count: 10 }`,
    schema: z.object({
      hostId: z
        .number()
        .int()
        .min(0)
        .optional()
        .default(0)
        .describe('Host index (default: 0)'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(20)
        .describe('Maximum number of queries to return (1-100, default 20)'),
    }),
  }
)
