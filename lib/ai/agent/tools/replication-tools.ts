import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createReplicationTools(hostId: number) {
  return {
    get_replication_status: dynamicTool({
      description:
        'Get per-table replication status including delay, queue size, and replica counts.',
      inputSchema: z.object({
        database: z
          .string()
          .optional()
          .default('')
          .describe('Filter by database name, or empty for all databases.'),
        hostId: z
          .number()
          .optional()
          .describe('Override the default ClickHouse host index.'),
      }),
      execute: async (input: unknown) => {
        const { database = '', hostId: toolHostId } = input as {
          database?: string
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)
        return readOnlyQuery({
          query: `SELECT
            database,
            table,
            is_leader,
            is_readonly,
            absolute_delay,
            queue_size,
            inserts_in_queue,
            merges_in_queue,
            log_pointer,
            total_replicas,
            active_replicas
          FROM system.replicas
          WHERE ({database:String} = '' OR database = {database:String})
          ORDER BY absolute_delay DESC`,
          query_params: { database },
          hostId: resolvedHostId,
        })
      },
    }),

    get_replication_queue: dynamicTool({
      description:
        'Get pending replication tasks from the replication queue, optionally filtered by database and table.',
      inputSchema: z.object({
        database: z
          .string()
          .optional()
          .default('')
          .describe('Filter by database name, or empty for all databases.'),
        table: z
          .string()
          .optional()
          .default('')
          .describe('Filter by table name, or empty for all tables.'),
        limit: z
          .number()
          .optional()
          .default(50)
          .describe('Maximum number of rows to return.'),
        hostId: z
          .number()
          .optional()
          .describe('Override the default ClickHouse host index.'),
      }),
      execute: async (input: unknown) => {
        const {
          database = '',
          table = '',
          limit = 50,
          hostId: toolHostId,
        } = input as {
          database?: string
          table?: string
          limit?: number
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)
        return readOnlyQuery({
          query: `SELECT
            database,
            table,
            type,
            create_time,
            required_quorum,
            source_replica,
            new_part_name,
            num_tries,
            last_attempt_time,
            substring(last_exception, 1, 300) AS last_error,
            postpone_reason
          FROM system.replication_queue
          WHERE ({database:String} = '' OR database = {database:String})
            AND ({table:String} = '' OR table = {table:String})
          ORDER BY create_time ASC
          LIMIT {limit:UInt32}`,
          query_params: { database, table, limit },
          hostId: resolvedHostId,
        })
      },
    }),
  }
}
