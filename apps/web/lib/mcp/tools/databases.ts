import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { z } from 'zod/v3'
import { fetchData } from '@/lib/clickhouse'

export function registerDatabasesTool(server: McpServer) {
  server.tool(
    'list_databases',
    'List all databases on the ClickHouse server with their engines and comments.',
    {
      hostId: z.number().optional().describe('Host index (default: 0)'),
    },
    async ({ hostId }) => {
      const result = await fetchData({
        query:
          'SELECT name, engine, comment FROM system.databases ORDER BY name',
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
