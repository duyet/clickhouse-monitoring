import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { z } from 'zod/v3'
import { fetchData } from '@/lib/clickhouse'

export function registerMergesTool(server: McpServer) {
  server.tool(
    'get_merge_status',
    'Get currently running merge operations with progress, size, and elapsed time.',
    {
      hostId: z.number().optional().describe('Host index (default: 0)'),
    },
    async ({ hostId }) => {
      const result = await fetchData({
        query:
          'SELECT database, table, round(progress * 100, 2) AS progress_pct, formatReadableSize(total_size_bytes_compressed) AS size, elapsed FROM system.merges ORDER BY elapsed DESC',
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
