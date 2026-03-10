/**
 * LangGraph tool: Execute SQL query with security validation.
 *
 * This tool enables LLMs to execute read-only SELECT queries against ClickHouse.
 * Includes SQL validation to prevent dangerous operations.
 * Adapts patterns from lib/mcp/tools/query.ts and lib/api/shared/validators/sql.ts.
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod/v3'
import { validateSqlQuery } from '@/lib/api/shared/validators/sql'
import { fetchData } from '@/lib/clickhouse'

/**
 * Execute a read-only SQL query on ClickHouse
 *
 * Validates the SQL for security before execution. Only allows SELECT queries
 * and WITH (CTE) clauses. Blocks dangerous operations like DROP, DELETE, etc.
 */
export const executeSqlTool = tool(
  async ({ sql, hostId = 0 }) => {
    // Validate SQL for security
    try {
      validateSqlQuery(sql)
    } catch (error) {
      throw new Error(
        `SQL validation failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    const result = await fetchData({
      query: sql,
      hostId,
      format: 'JSONEachRow',
      clickhouse_settings: { readonly: '1' },
    })

    if (result.error) {
      throw new Error(`Query execution failed: ${result.error.message}`)
    }

    const rows = (result.data ?? []) as readonly unknown[]

    return {
      success: true,
      rows,
      rowCount: rows.length,
      sql,
      hostId,
      metadata: {
        queryId: result.metadata.queryId as string | undefined,
        host: result.metadata.host as string | undefined,
        clickhouseVersion: result.metadata.clickhouseVersion as
          | string
          | undefined,
      },
    }
  },
  {
    name: 'execute_sql',
    description:
      'Execute a read-only SELECT query on ClickHouse. Only allows SELECT queries and WITH (CTE) clauses. Returns query results as an array of rows.',
    schema: z.object({
      sql: z.string().describe('The SQL SELECT query to execute'),
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
