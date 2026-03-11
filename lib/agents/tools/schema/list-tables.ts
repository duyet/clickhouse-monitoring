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
import { getToolProgressCallback } from '../registry'

/**
 * List tables in a ClickHouse database with progress reporting
 *
 * Returns table information including engine type, row counts, and disk usage.
 * Ordered by size descending to help identify the largest tables.
 *
 * Progress events:
 * - { message: 'Querying system.tables...' } - Query execution phase
 * - { message: 'Processing table metadata...', percent: 66 } - Results processing phase
 * - { message: 'Complete', percent: 100 } - Query completion
 */
export const listTablesTool = tool(
  async ({ database, hostId = 0 }) => {
    const onProgress = getToolProgressCallback()

    // Report starting query
    await onProgress?.({ message: 'Querying system.tables...', percent: 33 })

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

    // Report processing results
    await onProgress?.({ message: 'Processing table metadata...', percent: 66 })

    const tables = (result.data ?? []) as Array<{
      name: string
      engine: string
      total_rows: bigint | number
      size: string
    }>

    // Report completion
    await onProgress?.({ message: 'Complete', percent: 100 })

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
    description: `List tables in a ClickHouse database with row counts and disk sizes.

**Use this tool when user asks about:**
- "What tables in <database>?", "show tables"
- "List tables with sizes", "which tables are largest?"
- Database/table discovery

**Parameters:**
- database (required): Database name to list tables from

**Returns:** Table objects with name, engine, rows, size (ordered by size descending)

**Example:** list_tables(database="system") → { tables: [{name: "query_log", engine: "MergeTree", rows: 1000000, size: "1.2 GB"}], count: 25 }`,
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
