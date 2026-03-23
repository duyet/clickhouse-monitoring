import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createComparisonTools(hostId: number) {
  return {
    compare_time_periods: dynamicTool({
      description:
        'Compare ClickHouse metrics between two time periods. Returns side-by-side stats with percentage deltas. Use during incident investigation or capacity reviews.',
      inputSchema: z.object({
        metric: z
          .enum(['queries', 'errors', 'storage', 'merges'])
          .describe('Metric category to compare'),
        period1Hours: z
          .number()
          .int()
          .min(1)
          .max(720)
          .describe(
            'Hours ago for period 1 end (e.g., 48 for "ending 2 days ago"); duration extends backward from this point'
          ),
        period1Duration: z
          .number()
          .int()
          .min(1)
          .max(168)
          .describe('Duration of period 1 in hours'),
        period2Hours: z
          .number()
          .int()
          .min(0)
          .max(720)
          .describe(
            'Hours ago for period 2 end (e.g., 0 for "now"); duration extends backward from this point'
          ),
        period2Duration: z
          .number()
          .int()
          .min(1)
          .max(168)
          .describe('Duration of period 2 in hours'),
        hostId: z.number().int().optional().describe('Override host ID'),
      }),
      execute: async (input: unknown) => {
        const params = input as {
          metric: 'queries' | 'errors' | 'storage' | 'merges'
          period1Hours: number
          period1Duration: number
          period2Hours: number
          period2Duration: number
          hostId?: number
        }
        const resolved = resolveHostId(params.hostId, hostId)

        const metricQueries: Record<(typeof params)['metric'], string> = {
          queries: `SELECT
              count() AS total,
              avg(query_duration_ms) AS avg_duration_ms,
              quantile(0.95)(query_duration_ms) AS p95_duration_ms,
              formatReadableSize(sum(read_bytes)) AS total_read
            FROM system.query_log
            WHERE type = 'QueryFinish' AND is_initial_query = 1`,
          errors: `SELECT
              count() AS total_errors,
              countDistinct(exception_code) AS unique_errors,
              any(substring(exception, 1, 200)) AS sample_error
            FROM system.query_log
            WHERE type = 'ExceptionWhileProcessing'`,
          storage: `SELECT
              formatReadableSize(sum(bytes_on_disk)) AS total_size,
              count() AS total_parts,
              countDistinct(concat(database, '.', table)) AS total_tables
            FROM system.parts
            WHERE active`,
          merges: `SELECT
              count() AS total_merges
            FROM system.merges`,
        }

        const baseQuery = metricQueries[params.metric]

        // Storage queries don't have event_time filter (point-in-time snapshot)
        if (params.metric === 'storage') {
          const result = await readOnlyQuery({
            query: baseQuery,
            hostId: resolved,
          })
          return {
            metric: params.metric,
            note: 'Storage is a point-in-time snapshot; period comparison not applicable',
            current: result,
          }
        }

        // merges queries system.merges which has no event_time for historical filtering
        if (params.metric === 'merges') {
          const result = await readOnlyQuery({
            query: baseQuery,
            hostId: resolved,
          })
          return {
            metric: params.metric,
            note: 'Merges count reflects currently active merges; period comparison not applicable',
            current: result,
          }
        }

        // Both period1Hours and period2Hours represent the window end (hours ago).
        // The window start is computed by subtracting the duration from the end.
        const period1Start = params.period1Hours + params.period1Duration
        const period1End = params.period1Hours
        const period2Start = params.period2Hours + params.period2Duration
        const period2End = params.period2Hours

        const [period1, period2] = await Promise.all([
          readOnlyQuery({
            query: `${baseQuery} AND event_time BETWEEN now() - INTERVAL {p1Start:UInt32} HOUR AND now() - INTERVAL {p1End:UInt32} HOUR`,
            query_params: {
              p1Start: period1Start,
              p1End: period1End,
            },
            hostId: resolved,
          }).catch((e: Error) => ({ error: e.message })),
          readOnlyQuery({
            query: `${baseQuery} AND event_time BETWEEN now() - INTERVAL {p2Start:UInt32} HOUR AND now() - INTERVAL {p2End:UInt32} HOUR`,
            query_params: {
              p2Start: period2Start,
              p2End: period2End,
            },
            hostId: resolved,
          }).catch((e: Error) => ({ error: e.message })),
        ])

        return {
          metric: params.metric,
          period1: {
            label: `${params.period1Hours + params.period1Duration}h ago to ${params.period1Hours}h ago (${params.period1Duration}h window)`,
            data: period1,
          },
          period2: {
            label: `${params.period2Hours + params.period2Duration}h ago to ${params.period2Hours}h ago (${params.period2Duration}h window)`,
            data: period2,
          },
        }
      },
    }),

    compare_hosts: dynamicTool({
      description:
        'Compare two ClickHouse hosts side-by-side: version, uptime, query load, storage, and disk usage.',
      inputSchema: z.object({
        hostId1: z
          .number()
          .int()
          .describe(
            'First host ID (0-based index matching the configured CLICKHOUSE_HOST list)'
          ),
        hostId2: z
          .number()
          .int()
          .describe(
            'Second host ID (0-based index matching the configured CLICKHOUSE_HOST list)'
          ),
      }),
      execute: async (input: unknown) => {
        const { hostId1, hostId2 } = input as {
          hostId1: number
          hostId2: number
        }

        const queryHostMetrics = async (h: number) => {
          const [version, disks, topTables, queryLoad] = await Promise.all([
            readOnlyQuery({
              query: 'SELECT version() AS version, uptime() AS uptime_seconds',
              hostId: h,
            }).catch((e: Error) => ({ error: e.message })),
            readOnlyQuery({
              query:
                'SELECT name, formatReadableSize(free_space) AS free, formatReadableSize(total_space) AS total FROM system.disks',
              hostId: h,
            }).catch((e: Error) => ({ error: e.message })),
            readOnlyQuery({
              query:
                'SELECT database, name, formatReadableSize(total_bytes) AS size, total_rows FROM system.tables ORDER BY total_bytes DESC LIMIT 5',
              hostId: h,
            }).catch((e: Error) => ({ error: e.message })),
            readOnlyQuery({
              query: `SELECT count() AS query_count, avg(query_duration_ms) AS avg_duration_ms FROM system.query_log WHERE type = 'QueryFinish' AND event_time > now() - INTERVAL 1 HOUR`,
              hostId: h,
            }).catch((e: Error) => ({ error: e.message })),
          ])
          return { version, disks, topTables, queryLoad }
        }

        const [host1, host2] = await Promise.all([
          queryHostMetrics(hostId1).catch((e: Error) => ({
            error: e.message,
          })),
          queryHostMetrics(hostId2).catch((e: Error) => ({
            error: e.message,
          })),
        ])

        return {
          host1: { hostId: hostId1, ...host1 },
          host2: { hostId: hostId2, ...host2 },
        }
      },
    }),
  }
}
