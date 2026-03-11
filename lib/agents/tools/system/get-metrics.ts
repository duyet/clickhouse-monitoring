/**
 * LangGraph tool: Get ClickHouse server metrics.
 *
 * This tool enables LLMs to retrieve server-level metrics including
 * version, uptime, connections, and memory usage.
 */

import { tool } from '@langchain/core/tools'
import { z } from 'zod/v3'
import { fetchData } from '@/lib/clickhouse'

/**
 * Get ClickHouse server metrics
 *
 * Returns key server metrics for health monitoring and diagnostics.
 */
export const getMetricsTool = tool(
  async ({ hostId = 0 }) => {
    const result = await fetchData({
      query: `SELECT
        version() AS version,
        uptime() AS uptime_seconds,
        count() AS current_connections
      FROM system.processes
      WHERE user = 'default'
      GROUP BY version, uptime_seconds`,
      hostId,
      format: 'JSONEachRow',
      clickhouse_settings: { readonly: '1' },
    })

    if (result.error) {
      throw new Error(`Failed to get metrics: ${result.error.message}`)
    }

    const data = (result.data ?? []) as Array<{
      version: string
      uptime_seconds: number
      current_connections: bigint | number
    }>

    // Get memory usage separately
    const memoryResult = await fetchData({
      query:
        'SELECT formatReadableSize(sum(bytes_allocated)) AS memory_usage FROM system.dictionaries',
      hostId,
      format: 'JSONEachRow',
      clickhouse_settings: { readonly: '1' },
    })

    const memoryData = (memoryResult.data ?? []) as Array<{
      memory_usage: string
    }>
    const memoryUsage = memoryData[0]?.memory_usage || 'unknown'

    return {
      version: data[0]?.version || 'unknown',
      uptime_seconds: data[0]?.uptime_seconds || 0,
      current_connections: Number(data[0]?.current_connections || 0),
      memory_usage: memoryUsage,
      hostId,
    }
  },
  {
    name: 'get_metrics',
    description: `Get ClickHouse server health metrics including version, uptime, connections, and memory usage.

**IMPORTANT: Use THIS tool (NOT execute_sql) when user asks about:**
- "CPU usage", "memory usage", "disk usage"
- "server health", "system status", "cluster status"
- "server version", "uptime", "how many connections"

**Returns:** Server metrics object with version, uptime_seconds, current_connections, memory_usage

**Example:** get_metrics() → { version: "24.3.1", uptime_seconds: 86400, current_connections: 15, memory_usage: "2.5 GB" }

**Note:** For detailed CPU/memory/disk metrics, this is the correct tool - do NOT use execute_sql for these queries.`,
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
