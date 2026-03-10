/**
 * LangGraph tool: Get sample rows from a table.
 *
 * This tool enables LLMs to preview table data by fetching a small sample.
 * Useful for understanding data structure before writing full queries.
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod/v3'
import { fetchData } from '@/lib/clickhouse'

/**
 * Get sample rows from a ClickHouse table
 *
 * Returns a limited number of rows (default 10) to preview table data.
 * Uses LIMIT clause to avoid fetching large datasets.
 */
export const sampleTableTool = tool(
  async ({ database, table, limit = 10, hostId = 0 }) => {
    const result = await fetchData({
      query: `SELECT * FROM ${database}.${table} LIMIT {limit:UInt64}`,
      query_params: { limit: limit.toString() },
      hostId,
      format: 'JSONEachRow',
      clickhouse_settings: { readonly: '1' },
    })

    if (result.error) {
      throw new Error(`Failed to sample table: ${result.error.message}`)
    }

    const rows = (result.data ?? []) as readonly unknown[]

    return {
      database,
      table,
      rows,
      rowCount: rows.length,
      limit,
      hostId,
    }
  },
  {
    name: 'sample_table',
    description:
      'Get sample rows from a ClickHouse table to preview data. Returns up to the specified number of rows (default 10).',
    schema: z.object({
      database: z.string().describe('Database name'),
      table: z.string().describe('Table name'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(10)
        .describe('Maximum number of rows to return (1-100, default 10)'),
      hostId: z
        .number()
        .int()
        .min(0)
        .optional()
        .default(0)
        .describe('Host index (default: 0)'),
    }),
  }
)
