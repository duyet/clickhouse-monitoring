/**
 * LangGraph tool: Search tables by name pattern.
 *
 * This tool enables LLMs to discover tables using pattern matching.
 * Useful for finding tables when the exact name is not known.
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod/v3'
import { fetchData } from '@/lib/clickhouse'

/**
 * Search tables by name pattern
 *
 * Returns tables matching the given pattern. Supports both LIKE
 * and regex patterns for flexible searching.
 */
export const searchTablesTool = tool(
  async ({ pattern, database, searchType = 'like', hostId = 0 }) => {
    // Build query conditionally based on whether database is provided
    const databaseCondition = database
      ? 'database = {database:String} AND '
      : ''
    const queryParams: Record<string, string | undefined> = {}

    if (database) {
      queryParams.database = database
    }
    queryParams.pattern = pattern

    let query = ''

    if (searchType === 'like') {
      // Use LIKE pattern matching
      query = `SELECT
        database,
        name,
        engine,
        total_rows,
        formatReadableSize(total_bytes) AS size
      FROM system.tables
      WHERE ${databaseCondition}name LIKE {pattern:String}
      ORDER BY total_bytes DESC`
    } else {
      // Use regex pattern matching
      query = `SELECT
        database,
        name,
        engine,
        total_rows,
        formatReadableSize(total_bytes) AS size
      FROM system.tables
      WHERE ${databaseCondition}match(name, {pattern:String})
      ORDER BY total_bytes DESC`
    }

    const result = await fetchData({
      query,
      query_params: queryParams,
      hostId,
      format: 'JSONEachRow',
      clickhouse_settings: { readonly: '1' },
    })

    if (result.error) {
      throw new Error(`Failed to search tables: ${result.error.message}`)
    }

    // Type guard: ensure data is an array
    const data = result.data
    if (!Array.isArray(data)) {
      throw new Error('Expected array result from query')
    }

    const tables = data as Array<{
      database: string
      name: string
      engine: string
      total_rows: bigint | number
      size: string
    }>

    return {
      database: database ?? 'all',
      pattern,
      searchType,
      tables: tables.map((t) => ({
        database: t.database,
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
    name: 'search_tables',
    description:
      'Search for tables by name pattern. Supports LIKE (simple wildcards) or regex patterns. Returns matching tables with metadata.',
    schema: z.object({
      database: z
        .string()
        .optional()
        .describe(
          'Database to search (optional - searches all databases if not specified)'
        ),
      pattern: z
        .string()
        .describe(
          'Pattern to search for (e.g., "query%", "log.*", "metrics_")'
        ),
      searchType: z
        .enum(['like', 'regex'])
        .optional()
        .default('like')
        .describe(
          'Search type: "like" for simple wildcards, "regex" for regular expressions'
        ),
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
