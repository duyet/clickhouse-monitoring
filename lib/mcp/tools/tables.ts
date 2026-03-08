import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { z } from 'zod/v3'
import { fetchData } from '@/lib/clickhouse'

export function registerTableTools(server: McpServer) {
  server.tool(
    'list_tables',
    'List tables in a ClickHouse database with row counts and sizes, ordered by size descending.',
    {
      database: z.string().describe('Database name'),
      hostId: z.number().optional().describe('Host index (default: 0)'),
    },
    async ({ database, hostId }) => {
      const result = await fetchData({
        query:
          'SELECT name, engine, total_rows, formatReadableSize(total_bytes) AS size FROM system.tables WHERE database = {database:String} ORDER BY total_bytes DESC',
        query_params: { database },
        hostId: hostId ?? 0,
        format: 'JSONEachRow',
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

  server.tool(
    'get_table_schema',
    'Get column definitions for a specific ClickHouse table including types, defaults, and comments.',
    {
      database: z.string().describe('Database name'),
      table: z.string().describe('Table name'),
      hostId: z.number().optional().describe('Host index (default: 0)'),
    },
    async ({ database, table, hostId }) => {
      const result = await fetchData({
        query:
          'SELECT name, type, default_kind, default_expression, comment FROM system.columns WHERE database = {database:String} AND table = {table:String} ORDER BY position',
        query_params: { database, table },
        hostId: hostId ?? 0,
        format: 'JSONEachRow',
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
