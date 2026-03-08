import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { z } from 'zod/v3'
import { fetchData } from '@/lib/clickhouse'

export function registerMetricsTool(server: McpServer) {
  server.tool(
    'get_metrics',
    'Get key ClickHouse server metrics: version, uptime, active connections, and memory usage.',
    {
      hostId: z.number().optional().describe('Host index (default: 0)'),
    },
    async ({ hostId }) => {
      const effectiveHostId = hostId ?? 0

      const [versionResult, uptimeResult, metricsResult] = await Promise.all([
        fetchData({
          query: 'SELECT version() AS version',
          hostId: effectiveHostId,
          format: 'JSONEachRow',
          clickhouse_settings: { readonly: '1' },
        }),
        fetchData({
          query: 'SELECT uptime() AS uptime_seconds',
          hostId: effectiveHostId,
          format: 'JSONEachRow',
          clickhouse_settings: { readonly: '1' },
        }),
        fetchData({
          query:
            "SELECT metric, value FROM system.metrics WHERE metric IN ('TCPConnection', 'HTTPConnection', 'MemoryTracking') ORDER BY metric",
          hostId: effectiveHostId,
          format: 'JSONEachRow',
          clickhouse_settings: { readonly: '1' },
        }),
      ])

      const errors = [versionResult, uptimeResult, metricsResult]
        .filter((r) => r.error)
        .map((r) => r.error!.message)

      if (errors.length > 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Errors: ${errors.join('; ')}`,
            },
          ],
          isError: true,
        }
      }

      const versionRow = (
        Array.isArray(versionResult.data)
          ? versionResult.data[0]
          : versionResult.data
      ) as Record<string, unknown>
      const uptimeRow = (
        Array.isArray(uptimeResult.data)
          ? uptimeResult.data[0]
          : uptimeResult.data
      ) as Record<string, unknown>

      const combined = {
        version: versionRow?.['version'],
        uptime_seconds: uptimeRow?.['uptime_seconds'],
        metrics: metricsResult.data,
      }

      return {
        content: [
          { type: 'text' as const, text: JSON.stringify(combined, null, 2) },
        ],
      }
    }
  )
}
