import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createClusterTools(hostId: number) {
  return {
    get_clusters: dynamicTool({
      description:
        'Get cluster topology including shards, replicas, and host addresses.',
      inputSchema: z.object({
        hostId: z
          .number()
          .optional()
          .describe('Override the default ClickHouse host index.'),
      }),
      execute: async (input: unknown) => {
        const { hostId: toolHostId } = input as { hostId?: number }
        const resolvedHostId = resolveHostId(toolHostId, hostId)
        return readOnlyQuery({
          query: `SELECT
            cluster,
            shard_num,
            replica_num,
            host_name,
            host_address,
            port,
            is_local
          FROM system.clusters
          ORDER BY cluster, shard_num, replica_num`,
          hostId: resolvedHostId,
        })
      },
    }),

    get_distributed_ddl_queue: dynamicTool({
      description:
        'Get pending or failed distributed DDL operations from the DDL queue.',
      inputSchema: z.object({
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
        const { limit = 50, hostId: toolHostId } = input as {
          limit?: number
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)
        return readOnlyQuery({
          query: `SELECT
            entry,
            host_name,
            host_address,
            status,
            cluster,
            initiator,
            query,
            exception_code,
            substring(exception, 1, 300) AS exception_text
          FROM system.distributed_ddl_queue
          ORDER BY entry DESC
          LIMIT {limit:UInt32}`,
          query_params: { limit },
          hostId: resolvedHostId,
        })
      },
    }),
  }
}
