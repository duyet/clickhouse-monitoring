import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createHealthTools(hostId: number) {
  return {
    get_metrics: dynamicTool({
      description:
        'Get server health metrics including version, uptime, and connection counts.',
      inputSchema: z.object({
        hostId: z.number().optional().describe('Override host ID'),
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

    get_system_resources: dynamicTool({
      description:
        'Get CPU, memory, disk, and thread usage from system metrics.',
      inputSchema: z.object({
        hostId: z.number().optional().describe('Override host ID'),
      }),
      execute: async (input: unknown) => {
        const { hostId: toolHostId } = input as { hostId?: number }
        const resolvedHostId = resolveHostId(toolHostId, hostId)

        const [metricsResult, asyncMetricsResult] = await Promise.all([
          readOnlyQuery({
            query: `SELECT metric, value, description FROM system.metrics WHERE metric IN ('MemoryTracking', 'MemoryResident', 'TCPConnection', 'HTTPConnection', 'InterserverConnection', 'OpenFileForRead', 'OpenFileForWrite', 'BackgroundMergesAndMutationsPoolTask', 'BackgroundSchedulePoolTask') ORDER BY metric`,
            hostId: resolvedHostId,
          }),
          readOnlyQuery({
            query: `SELECT metric, value FROM system.asynchronous_metrics WHERE metric IN ('OSMemoryTotal', 'OSMemoryAvailable', 'LoadAverage1', 'LoadAverage5', 'LoadAverage15', 'MaxPartCountForPartition', 'NumberOfDatabases', 'NumberOfTables', 'TotalRowsOfMergeTreeTables', 'TotalBytesOfMergeTreeTables') ORDER BY metric`,
            hostId: resolvedHostId,
          }),
        ])

        return {
          metrics: metricsResult,
          async_metrics: asyncMetricsResult,
        }
      },
    }),

    get_disk_usage: dynamicTool({
      description: 'Get per-disk space usage including free and total space.',
      inputSchema: z.object({
        hostId: z.number().optional().describe('Override host ID'),
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

    get_errors: dynamicTool({
      description: 'Get recent system errors with error codes and messages.',
      inputSchema: z.object({
        limit: z
          .number()
          .optional()
          .default(20)
          .describe('Maximum number of errors to return'),
        hostId: z.number().optional().describe('Override host ID'),
      }),
      execute: async (input: unknown) => {
        const { limit = 20, hostId: toolHostId } = input as {
          limit?: number
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)

        return readOnlyQuery({
          query: `SELECT name, code, value AS count, last_error_time, substring(last_error_message, 1, 300) AS last_message FROM system.errors ORDER BY last_error_time DESC LIMIT {limit:UInt32}`,
          query_params: { limit },
          hostId: resolvedHostId,
        })
      },
    }),

    get_crash_log: dynamicTool({
      description: 'Get crash history from system.crash_log.',
      inputSchema: z.object({
        limit: z
          .number()
          .optional()
          .default(10)
          .describe('Maximum number of crash entries to return'),
        hostId: z.number().optional().describe('Override host ID'),
      }),
      execute: async (input: unknown) => {
        const { limit = 10, hostId: toolHostId } = input as {
          limit?: number
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)

        return readOnlyQuery({
          query: `SELECT event_time, signal, thread_id, query_id, substring(trace_full, 1, 500) AS trace FROM system.crash_log ORDER BY event_time DESC LIMIT {limit:UInt32}`,
          query_params: { limit },
          hostId: resolvedHostId,
        })
      },
    }),
  }
}
