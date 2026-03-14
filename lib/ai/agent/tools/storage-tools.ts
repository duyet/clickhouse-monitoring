import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

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
        hostId: z.number().optional().describe('Override host ID'),
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

    get_detached_parts: dynamicTool({
      description: 'Get detached parts, optionally filtered by database.',
      inputSchema: z.object({
        database: z
          .string()
          .optional()
          .default('')
          .describe('Filter by database name'),
        hostId: z.number().optional().describe('Override host ID'),
      }),
      execute: async (input: unknown) => {
        const { database = '', hostId: toolHostId } = input as {
          database?: string
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)

        return readOnlyQuery({
          query: `SELECT database, table, partition_id, name, reason FROM system.detached_parts WHERE ({database:String} = '' OR database = {database:String}) ORDER BY database, table`,
          query_params: { database },
          hostId: resolvedHostId,
        })
      },
    }),

    get_top_tables_by_size: dynamicTool({
      description: 'Get top tables ranked by compressed size on disk.',
      inputSchema: z.object({
        limit: z
          .number()
          .optional()
          .default(20)
          .describe('Maximum number of tables to return'),
        hostId: z.number().optional().describe('Override host ID'),
      }),
      execute: async (input: unknown) => {
        const { limit = 20, hostId: toolHostId } = input as {
          limit?: number
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)

        return readOnlyQuery({
          query: `SELECT database, table, sum(rows) AS total_rows, formatReadableSize(sum(bytes_on_disk)) AS compressed_size, formatReadableSize(sum(data_uncompressed_bytes)) AS uncompressed_size, round(sum(data_compressed_bytes) * 1.0 / nullIf(sum(data_uncompressed_bytes), 0), 3) AS compression_ratio, count() AS part_count FROM system.parts WHERE active = 1 GROUP BY database, table ORDER BY sum(bytes_on_disk) DESC LIMIT {limit:UInt32}`,
          query_params: { limit },
          hostId: resolvedHostId,
        })
      },
    }),
  }
}
