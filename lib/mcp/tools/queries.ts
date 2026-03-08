import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { z } from 'zod/v3'
import { fetchData } from '@/lib/clickhouse'

export function registerQueryTools(server: McpServer) {
  server.tool(
    'get_running_queries',
    'List currently running queries on the ClickHouse server, ordered by elapsed time.',
    {
      hostId: z.number().optional().describe('Host index (default: 0)'),
    },
    async ({ hostId }) => {
      const result = await fetchData({
        query:
          'SELECT query_id, user, elapsed, read_rows, memory_usage, substring(query, 1, 200) AS query FROM system.processes ORDER BY elapsed DESC',
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
    'get_slow_queries',
    'Get the slowest completed queries from the query log, ordered by duration.',
    {
      limit: z
        .number()
        .optional()
        .describe('Max number of queries to return (default: 10)'),
      hostId: z.number().optional().describe('Host index (default: 0)'),
    },
    async ({ limit, hostId }) => {
      const effectiveLimit = limit ?? 10

      const result = await fetchData({
        query:
          "SELECT query_id, user, query_duration_ms, read_rows, memory_usage, substring(query, 1, 200) AS query, event_time FROM system.query_log WHERE type = 'QueryFinish' AND is_initial_query = 1 ORDER BY query_duration_ms DESC LIMIT {limit:UInt32}",
        query_params: { limit: effectiveLimit },
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
