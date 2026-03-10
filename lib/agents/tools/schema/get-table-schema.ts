/**
 * LangGraph tool: Get column definitions for a specific ClickHouse table.
 *
 * This tool enables LLMs to explore table structure including column types,
 * default values, and comments. Essential for understanding data before
 * writing queries.
 * Adapts the MCP tool pattern from lib/mcp/tools/tables.ts for LangGraph.
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod/v3'
import { fetchData } from '@/lib/clickhouse'

/**
 * Get column definitions for a specific ClickHouse table
 *
 * Returns detailed column information including types, defaults, and comments.
 * Ordered by column position to match the table structure.
 */
export const getTableSchemaTool = tool(
  async ({ database, table, hostId = 0 }) => {
    const result = await fetchData({
      query: `SELECT
        name,
        type,
        default_kind,
        default_expression,
        comment
      FROM system.columns
      WHERE database = {database:String}
        AND table = {table:String}
      ORDER BY position`,
      query_params: { database, table },
      hostId,
      format: 'JSONEachRow',
      clickhouse_settings: { readonly: '1' },
    })

    if (result.error) {
      throw new Error(`Failed to get table schema: ${result.error.message}`)
    }

    const columns = (result.data ?? []) as Array<{
      name: string
      type: string
      default_kind: string | null
      default_expression: string | null
      comment: string | null
    }>

    return {
      database,
      table,
      columns: columns.map((col) => ({
        name: col.name,
        type: col.type,
        default: col.default_kind
          ? { kind: col.default_kind, expression: col.default_expression }
          : null,
        comment: col.comment,
      })),
      columnCount: columns.length,
      hostId,
    }
  },
  {
    name: 'get_table_schema',
    description:
      'Get column definitions for a specific ClickHouse table including types, defaults, and comments. Returns detailed schema information.',
    schema: z.object({
      database: z.string().describe('Database name'),
      table: z.string().describe('Table name'),
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
