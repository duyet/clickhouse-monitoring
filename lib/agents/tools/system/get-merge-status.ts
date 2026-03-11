/**
 * LangGraph tool: Get merge operation status.
 *
 * This tool enables LLMs to check on active merge operations in ClickHouse.
 * Merges are important for table maintenance and performance.
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod/v3'
import { fetchData } from '@/lib/clickhouse'

/**
 * Get active merge operations on ClickHouse
 *
 * Returns currently running merge operations with progress information.
 * Useful for monitoring table maintenance status.
 */
export const getMergeStatusTool = tool(
  async ({ hostId = 0, limit = 20 }) => {
    const result = await fetchData({
      query: `SELECT
        database,
        table,
        elapsed,
        progress,
        rows_read,
        bytes_read_uncompressed,
        rows_written,
        bytes_written_uncompressed,
        memory_usage,
        thread_id
      FROM system.merges
      ORDER BY elapsed DESC
      LIMIT {limit:UInt64}`,
      query_params: { limit: limit.toString() },
      hostId,
      format: 'JSONEachRow',
      clickhouse_settings: { readonly: '1' },
    })

    if (result.error) {
      throw new Error(`Failed to get merge status: ${result.error.message}`)
    }

    const merges = (result.data ?? []) as Array<{
      database: string
      table: string
      elapsed: number
      progress: number
      rows_read: bigint | number
      bytes_read_uncompressed: bigint | number
      rows_written: bigint | number
      bytes_written_uncompressed: bigint | number
      memory_usage: bigint | number
      thread_id: bigint | number
    }>

    return {
      merges: merges.map((m) => ({
        database: m.database,
        table: m.table,
        elapsedSeconds: m.elapsed,
        progress: m.progress,
        rowsRead: Number(m.rows_read),
        rowsWritten: Number(m.rows_written),
        memoryUsage: Number(m.memory_usage),
        threadId: Number(m.thread_id),
      })),
      count: merges.length,
      limit,
      hostId,
    }
  },
  {
    name: 'get_merge_status',
    description: `Get active merge operations on the ClickHouse server.

**Use this tool when user asks about:**
- "Merge status", "what merges are running?"
- "Table maintenance", "merge operations"
- "Background merges", "merge progress"

**Parameters:**
- limit (optional): Maximum merges to return (1-100, default: 20)

**Returns:** Array of active merges with database, table, elapsedSeconds, progress (0-1), rowsRead, rowsWritten, memoryUsage

**Example:** get_merge_status(limit=10) → { merges: [{database: "default", table: "events", elapsedSeconds: 120, progress: 0.75, rowsRead: 1000000, rowsWritten: 750000}], count: 5 }`,
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
        .describe('Maximum number of merges to return (1-100, default 20)'),
    }),
  }
)
