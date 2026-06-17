import { z } from 'zod'

import { hostIdSchema, readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'

export function createHealthTools(hostId: number) {
  return {
    get_metrics: dynamicTool({
      description:
        'Get server health metrics including version, uptime, and connection counts.',
      inputSchema: z.object({
        hostId: hostIdSchema,
      }),
      execute: async (input: unknown) => {
        const { hostId: toolHostId } = input as { hostId?: number }
        const resolvedHostId = resolveHostId(toolHostId, hostId)

        const [versionResult, uptimeResult, metricsResult] = await Promise.all([
          readOnlyQuery({
            query: 'SELECT version() AS version',
            hostId: resolvedHostId,
          }),
          readOnlyQuery({
            query: 'SELECT uptime() AS uptime_seconds',
            hostId: resolvedHostId,
          }),
          readOnlyQuery({
            query: `SELECT metric, value FROM system.metrics WHERE metric IN ('TCPConnection', 'HTTPConnection', 'MemoryTracking') ORDER BY metric`,
            hostId: resolvedHostId,
          }),
        ])

        const versionRows = versionResult as Array<{ version: unknown }>
        const uptimeRows = uptimeResult as Array<{ uptime_seconds: unknown }>
        const metricsRows = metricsResult as Array<{
          metric: string
          value: unknown
        }>

        const metrics: Record<string, unknown> = {
          version: versionRows[0]?.version,
          uptime_seconds: uptimeRows[0]?.uptime_seconds,
        }

        for (const row of metricsRows) {
          metrics[String(row.metric)] = row.value
        }

        return metrics
      },
    }),

    get_disk_usage: dynamicTool({
      description: 'Get per-disk space usage including free and total space.',
      inputSchema: z.object({
        hostId: hostIdSchema,
      }),
      execute: async (input: unknown) => {
        const { hostId: toolHostId } = input as { hostId?: number }
        const resolvedHostId = resolveHostId(toolHostId, hostId)

        return readOnlyQuery({
          query: `SELECT name, path, formatReadableSize(free_space) AS free, formatReadableSize(total_space) AS total, round(free_space * 100.0 / nullIf(total_space, 0), 2) AS free_pct FROM system.disks ORDER BY name`,
          hostId: resolvedHostId,
        })
      },
    }),
  }
}
