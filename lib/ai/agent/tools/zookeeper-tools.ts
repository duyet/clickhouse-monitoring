import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createZookeeperTools(hostId: number) {
  return {
    get_zookeeper_info: dynamicTool({
      description:
        'Retrieve ZooKeeper/ClickHouse Keeper node information. Note: system.zookeeper is an optional table only available when ZooKeeper or ClickHouse Keeper is configured.',
      inputSchema: z.object({
        path: z
          .string()
          .optional()
          .default('/')
          .describe('ZooKeeper path to inspect (default: root path "/")'),
        hostId: z.number().optional().describe('Host index override'),
      }),
      execute: async (input: unknown) => {
        const { path = '/', hostId: hostIdOverride } = input as {
          path?: string
          hostId?: number
        }
        const resolvedHostId = resolveHostId(hostIdOverride, hostId)
        return readOnlyQuery({
          query: `SELECT name, value, path FROM system.zookeeper WHERE path = {path:String}`,
          query_params: { path },
          hostId: resolvedHostId,
        })
      },
    }),
  }
}
