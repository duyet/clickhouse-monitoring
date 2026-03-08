import type { DataFormat } from '@clickhouse/client'

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { z } from 'zod/v3'
import { validateSqlQuery } from '@/lib/api/shared/validators/sql'
import { fetchData } from '@/lib/clickhouse'

export function registerQueryTool(server: McpServer) {
  server.tool(
    'query',
    'Execute a read-only SQL query against ClickHouse. Only SELECT and WITH (CTE) queries are allowed.',
    {
      sql: z.string().describe('SQL query to execute (SELECT only)'),
      hostId: z.number().optional().describe('Host index (default: 0)'),
      format: z
        .string()
        .optional()
        .describe('ClickHouse output format (default: JSONEachRow)'),
    },
    async ({ sql, hostId, format }) => {
      try {
        validateSqlQuery(sql)
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Validation error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        }
      }

      const result = await fetchData({
        query: sql,
        hostId: hostId ?? 0,
        format: (format ?? 'JSONEachRow') as DataFormat,
        clickhouse_settings: { readonly: '1' },
      })

      if (result.error) {
        return {
          content: [
            { type: 'text' as const, text: `Error: ${result.error.message}` },
          ],
          isError: true,
        }
      }

      return {
        content: [
          { type: 'text' as const, text: JSON.stringify(result.data, null, 2) },
        ],
      }
    }
  )
}
