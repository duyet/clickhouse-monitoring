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
import { getToolProgressCallback } from '../registry'

/**
 * Execute a read-only SQL query on ClickHouse with progress reporting
 *
 * Validates the SQL for security before execution. Only allows SELECT queries
 * and WITH (CTE) clauses. Blocks dangerous operations like DROP, DELETE, etc.
 *
 * Progress events:
 * - { message: 'Validating query...' } - Initial validation phase
 * - { message: 'Executing query...', percent: 50 } - Query execution phase
 * - { message: 'Processing results...', percent: 80 } - Results processing phase
 * - { message: 'Complete', percent: 100 } - Query completion
 */
export const executeSqlTool = tool(
  async ({ sql, hostId = 0 }) => {
    // Get progress callback from context
    const onProgress = getToolProgressCallback()

    // Report starting validation
    await onProgress?.({ message: 'Validating query...' })

    // Validate SQL for security
    try {
      validateSqlQuery(sql)
    } catch (error) {
      throw new Error(
        `SQL validation failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    // Report starting execution
    await onProgress?.({ message: 'Executing query...', percent: 50 })

    const result = await fetchData({
      query: sql,
      hostId,
      format: 'JSONEachRow',
      clickhouse_settings: { readonly: '1' },
    })

    if (result.error) {
      throw new Error(`Query execution failed: ${result.error.message}`)
    }

    // Report processing results
    await onProgress?.({ message: 'Processing results...', percent: 80 })

    const rows = (result.data ?? []) as readonly unknown[]

    // Report completion
    await onProgress?.({ message: 'Complete', percent: 100 })

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
    description: `Execute a read-only SELECT query on ClickHouse with safety validation.

**Use this tool when user asks:**
- Custom SQL queries not covered by specialized tools
- "Run SELECT...", "execute query..."
- Complex aggregations, joins, or filters

**Safety constraints:**
- Only SELECT and WITH (CTE) queries allowed
- Blocks DROP, DELETE, INSERT, UPDATE, ALTER, etc.
- Validates query before execution

**Parameters:**
- sql (required): The SQL SELECT query to execute

**Returns:** Query results as array of rows with metadata (queryId, host, version)

**Example:** execute_sql(sql="SELECT count() FROM system.query_log WHERE type = 'QueryFinish'") → { success: true, rows: [{count(): 12345}], rowCount: 1 }

**Note:** For system metrics like CPU/memory/disk, use get_metrics instead. For schema exploration, use list_tables/get_table_schema.`,
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
