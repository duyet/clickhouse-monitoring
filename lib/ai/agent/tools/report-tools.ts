import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createReportTools(hostId: number) {
  return {
    generate_health_report: dynamicTool({
      description:
        'Collect all key ClickHouse metrics for a health report. Gathers server info, disk usage, top tables, slow queries, errors, merge status, and replication in parallel. Returns raw data for synthesis into a readable report.',
      inputSchema: z.object({
        lastHours: z
          .number()
          .int()
          .min(1)
          .max(720)
          .optional()
          .default(24)
          .describe('Time window in hours (default: 24)'),
        hostId: z.number().int().optional().describe('Host ID override'),
      }),
      execute: async (input: unknown) => {
        const { lastHours = 24, hostId: toolHostId } = input as {
          lastHours?: number
          hostId?: number
        }
        const resolved = resolveHostId(toolHostId, hostId)

        const [
          server,
          disks,
          topTables,
          slowQueries,
          errors,
          merges,
          replication,
        ] = await Promise.all([
          readOnlyQuery({
            query: 'SELECT version() as version, uptime() as uptime_seconds',
            hostId: resolved,
          }).catch((e) => ({ error: (e as Error).message })),

          readOnlyQuery({
            query: `SELECT name, path, formatReadableSize(free_space) as free_space, formatReadableSize(total_space) as total_space, round(free_space * 100.0 / nullIf(total_space, 0), 2) as free_pct FROM system.disks`,
            hostId: resolved,
          }).catch((e) => ({ error: (e as Error).message })),

          readOnlyQuery({
            query: `SELECT database, name, engine, formatReadableSize(total_bytes) as size, total_rows, formatReadableQuantity(total_rows) as readable_rows FROM system.tables ORDER BY total_bytes DESC LIMIT 10`,
            hostId: resolved,
          }).catch((e) => ({ error: (e as Error).message })),

          readOnlyQuery({
            query: `SELECT query_id, user, query_duration_ms, read_rows, memory_usage, substring(query, 1, 200) as query FROM system.query_log WHERE type = 'QueryFinish' AND is_initial_query = 1 AND event_time > now() - INTERVAL {hours:UInt32} HOUR ORDER BY query_duration_ms DESC LIMIT 5`,
            query_params: { hours: lastHours.toString() },
            hostId: resolved,
          }).catch((e) => ({ error: (e as Error).message })),

          readOnlyQuery({
            query: `SELECT name, code, value as count, last_error_time, substring(last_error_message, 1, 200) as message FROM system.errors WHERE value > 0 ORDER BY last_error_time DESC LIMIT 10`,
            hostId: resolved,
          }).catch((e) => ({ error: (e as Error).message })),

          readOnlyQuery({
            query: `SELECT count() as active_merges, formatReadableSize(sum(total_size_bytes_compressed)) as total_size FROM system.merges`,
            hostId: resolved,
          }).catch((e) => ({ error: (e as Error).message })),

          readOnlyQuery({
            query: `SELECT database, table, is_leader, absolute_delay, queue_size, inserts_in_queue, merges_in_queue FROM system.replicas WHERE absolute_delay > 0 OR queue_size > 0 ORDER BY absolute_delay DESC`,
            hostId: resolved,
          }).catch((e) => ({ error: (e as Error).message })),
        ])

        return {
          collected_at: new Date().toISOString(),
          time_window_hours: lastHours,
          server,
          disks,
          top_tables: topTables,
          slow_queries: slowQueries,
          errors,
          merge_status: merges,
          replication_issues: replication,
          instructions:
            'Synthesize this data into a formatted health report with these sections: Server Overview, Storage & Disk Health, Top Tables, Query Performance, Errors & Issues, Merge Operations, Replication Status. Use severity indicators (OK/WARNING/CRITICAL) for each section.',
        }
      },
    }),
  }
}
