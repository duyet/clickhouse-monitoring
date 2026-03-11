/**
 * LangGraph tool: List tables in a ClickHouse database.
 *
 * This tool enables LLMs to discover tables within a specific database,
 * including metadata like row counts and disk usage.
 * Adapts the MCP tool pattern from lib/mcp/tools/tables.ts for LangGraph.
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod/v3'
import { fetchData } from '@/lib/clickhouse'

/**
 * List tables in a ClickHouse database with metadata
 *
 * Returns table information including engine type, row counts, and disk usage.
 * Ordered by size descending to help identify the largest tables.
 */
export const listTablesTool = tool(
  async ({ database, hostId = 0 }) => {
    const result = await fetchData({
      query: `SELECT
        name,
        engine,
        total_rows,
        formatReadableSize(total_bytes) AS size
      FROM system.tables
      WHERE database = {database:String}
      ORDER BY total_bytes DESC`,
      query_params: { database },
      hostId,
      format: 'JSONEachRow',
      clickhouse_settings: { readonly: '1' },
    })

    if (result.error) {
      throw new Error(`Failed to list tables: ${result.error.message}`)
    }

    const tables = (result.data ?? []) as Array<{
      name: string
      engine: string
      total_rows: bigint | number
      size: string
    }>

    return {
      database,
      tables: tables.map((t) => ({
        name: t.name,
        engine: t.engine,
        rows: Number(t.total_rows),
        size: t.size,
      })),
      count: tables.length,
      hostId,
    }
  },
  {
    name: 'list_tables',
    description:
      'List tables in a ClickHouse database with row counts and sizes. Returns table name, engine type, row count, and disk size.',
    schema: z.object({
      database: z.string().describe('Database name to list tables from'),
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
