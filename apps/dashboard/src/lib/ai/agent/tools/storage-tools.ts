import { z } from 'zod'

import { hostIdSchema, readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'

export function createStorageTools(hostId: number) {
  return {
    get_table_parts: dynamicTool({
      description:
        'Get part-level information for a specific table including compression ratios.',
      inputSchema: z.object({
        database: z.string().describe('Database name'),
        table: z.string().describe('Table name'),
        active: z
          .boolean()
          .optional()
          .describe('Filter by active status (omit for all parts)'),
        limit: z
          .number()
          .optional()
          .default(100)
          .describe('Maximum number of parts to return'),
        hostId: hostIdSchema,
      }),
      execute: async (input: unknown) => {
        const {
          database,
          table,
          active,
          limit = 100,
          hostId: toolHostId,
        } = input as {
          database: string
          table: string
          active?: boolean
          limit?: number
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)

        let whereClause =
          'WHERE database = {database:String} AND table = {table:String}'
        const params: Record<string, unknown> = { database, table, limit }

        if (active !== undefined) {
          whereClause += ' AND active = {active:UInt8}'
          params.active = active ? 1 : 0
        }

        return readOnlyQuery({
          query: `SELECT name, partition, rows, formatReadableSize(bytes_on_disk) AS size_on_disk, formatReadableSize(data_uncompressed_bytes) AS uncompressed_size, round(data_compressed_bytes * 1.0 / nullIf(data_uncompressed_bytes, 0), 3) AS compression_ratio, modification_time, level FROM system.parts ${whereClause} ORDER BY modification_time DESC LIMIT {limit:UInt32}`,
          query_params: params,
          hostId: resolvedHostId,
        })
      },
    }),
  }
}
