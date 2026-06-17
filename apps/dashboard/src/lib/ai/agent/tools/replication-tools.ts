import { z } from 'zod'

import { hostIdSchema, readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'

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
        hostId: hostIdSchema,
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
  }
}
