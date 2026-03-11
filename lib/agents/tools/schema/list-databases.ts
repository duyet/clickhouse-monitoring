/**
 * LangGraph tool: List all databases on the ClickHouse server.
 *
 * This tool enables LLMs to discover available databases for further exploration.
 * Adapts the MCP tool pattern from lib/mcp/tools/databases.ts for LangGraph.
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod/v3'
import { fetchData } from '@/lib/clickhouse'

/**
 * List all databases on the ClickHouse server
 *
 * Returns a simple array of database names that the LLM can use for
 * subsequent operations like listing tables or exploring schemas.
 */
export const listDatabasesTool = tool(
  async ({ hostId = 0 }) => {
    const result = await fetchData({
      query: 'SELECT name FROM system.databases ORDER BY name',
      hostId,
      format: 'JSONEachRow',
      clickhouse_settings: { readonly: '1' },
    })

    if (result.error) {
      throw new Error(`Failed to list databases: ${result.error.message}`)
    }

    // Type guard: ensure data is an array
    const data = result.data
    if (!Array.isArray(data)) {
      throw new Error('Expected array result from query')
    }

    const databases = data.map((row: any) => row.name as string)

    return {
      databases,
      count: databases.length,
      hostId,
    }
  },
  {
    name: 'list_databases',
    description: `List all databases on the ClickHouse server.

**Use this tool when user asks about:**
- "What databases exist?", "show databases", "list databases"
- "What data is available?", "explore the database"
- Starting database exploration workflow

**Returns:** Array of database names (e.g., ["default", "system", "information_schema"])

**Example:** list_databases() → { databases: ["default", "system", "logs"], count: 3 }`,
    schema: z.object({
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
