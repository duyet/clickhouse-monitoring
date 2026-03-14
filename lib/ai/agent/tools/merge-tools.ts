import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createMergeTools(hostId: number) {
  return {
    get_merge_status: dynamicTool({
      description:
        'Get currently active merges with progress and elapsed time.',
      inputSchema: z.object({
        hostId: z.number().optional().describe('Override host ID'),
      }),
      execute: async (input: unknown) => {
        const { hostId: toolHostId } = input as { hostId?: number }
        const resolvedHostId = resolveHostId(toolHostId, hostId)

        return readOnlyQuery({
          query: `SELECT database, table, round(progress * 100, 2) AS progress_pct, formatReadableSize(total_size_bytes_compressed) AS size, elapsed FROM system.merges ORDER BY elapsed DESC`,
          hostId: resolvedHostId,
        })
      },
    }),

    get_mutations: dynamicTool({
      description:
        'Get pending or stuck mutations, optionally filtered by database or completion status.',
      inputSchema: z.object({
        database: z.string().optional().describe('Filter by database name'),
        isDone: z.boolean().optional().describe('Filter by completion status'),
        limit: z
          .number()
          .optional()
          .default(50)
          .describe('Maximum number of mutations to return'),
        hostId: z.number().optional().describe('Override host ID'),
      }),
      execute: async (input: unknown) => {
        const {
          database,
          isDone,
          limit = 50,
          hostId: toolHostId,
        } = input as {
          database?: string
          isDone?: boolean
          limit?: number
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)

        let whereClause = 'WHERE 1=1'
        const params: Record<string, unknown> = { limit }

        if (database) {
          whereClause += ' AND database = {database:String}'
          params.database = database
        }

        if (isDone !== undefined) {
          whereClause += ' AND is_done = {isDone:UInt8}'
          params.isDone = isDone ? 1 : 0
        }

        return readOnlyQuery({
          query: `SELECT database, table, mutation_id, command, create_time, is_done, parts_to_do, substring(latest_fail_reason, 1, 300) AS fail_reason FROM system.mutations ${whereClause} ORDER BY create_time DESC LIMIT {limit:UInt32}`,
          query_params: params,
          hostId: resolvedHostId,
        })
      },
    }),

    get_merge_performance: dynamicTool({
      description: 'Get historical merge throughput statistics from part_log.',
      inputSchema: z.object({
        lastHours: z
          .number()
          .optional()
          .default(24)
          .describe('Number of hours to look back'),
        hostId: z.number().optional().describe('Override host ID'),
      }),
      execute: async (input: unknown) => {
        const { lastHours = 24, hostId: toolHostId } = input as {
          lastHours?: number
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)

        return readOnlyQuery({
          query: `SELECT toStartOfHour(event_time) AS hour, count() AS merge_count, sum(rows_read) AS total_rows, formatReadableSize(sum(bytes_read_uncompressed)) AS total_uncompressed, round(avg(duration_ms) / 1000, 2) AS avg_duration_sec FROM system.part_log WHERE event_type = 'MergeParts' AND event_time > now() - INTERVAL {lastHours:UInt32} HOUR GROUP BY hour ORDER BY hour DESC`,
          query_params: { lastHours },
          hostId: resolvedHostId,
        })
      },
    }),
  }
}
