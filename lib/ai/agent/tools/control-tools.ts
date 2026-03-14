import { isValidTableIdentifier, resolveHostId, writeQuery } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createControlTools(hostId: number) {
  return {
    kill_query: dynamicTool({
      description:
        'Kill a running query by its query_id. DESTRUCTIVE — confirm with user before executing.',
      inputSchema: z.object({
        queryId: z.string().describe('The query_id of the query to kill'),
        hostId: z.number().optional().describe('Host index override'),
      }),
      execute: async (input: unknown) => {
        const { queryId, hostId: hostIdOverride } = input as {
          queryId: string
          hostId?: number
        }
        const resolvedHostId = resolveHostId(hostIdOverride, hostId)
        return writeQuery({
          query: 'KILL QUERY WHERE query_id = {queryId:String}',
          query_params: { queryId },
          hostId: resolvedHostId,
        })
      },
    }),

    optimize_table: dynamicTool({
      description:
        'Trigger an OPTIMIZE operation on a table to force merges. DESTRUCTIVE — confirm with user before executing.',
      inputSchema: z.object({
        database: z.string().describe('Database name'),
        table: z.string().describe('Table name'),
        final: z
          .boolean()
          .optional()
          .default(false)
          .describe('Whether to run OPTIMIZE FINAL'),
        hostId: z.number().optional().describe('Host index override'),
      }),
      execute: async (input: unknown) => {
        const {
          database,
          table,
          final = false,
          hostId: hostIdOverride,
        } = input as {
          database: string
          table: string
          final?: boolean
          hostId?: number
        }
        if (
          !isValidTableIdentifier(database) ||
          !isValidTableIdentifier(table)
        ) {
          throw new Error(
            `Invalid table identifier: ${database}.${table}. Only alphanumeric characters, underscores, and hyphens are allowed.`
          )
        }
        const resolvedHostId = resolveHostId(hostIdOverride, hostId)
        const sql = `OPTIMIZE TABLE ${database}.${table}${final ? ' FINAL' : ''}`
        return writeQuery({
          query: sql,
          hostId: resolvedHostId,
        })
      },
    }),

    kill_mutation: dynamicTool({
      description:
        'Cancel a running mutation on a table. DESTRUCTIVE — confirm with user before executing.',
      inputSchema: z.object({
        database: z.string().describe('Database name'),
        table: z.string().describe('Table name'),
        mutationId: z.string().describe('The mutation_id to cancel'),
        hostId: z.number().optional().describe('Host index override'),
      }),
      execute: async (input: unknown) => {
        const {
          database,
          table,
          mutationId,
          hostId: hostIdOverride,
        } = input as {
          database: string
          table: string
          mutationId: string
          hostId?: number
        }
        const resolvedHostId = resolveHostId(hostIdOverride, hostId)
        return writeQuery({
          query:
            'KILL MUTATION WHERE database = {database:String} AND table = {table:String} AND mutation_id = {mutationId:String}',
          query_params: { database, table, mutationId },
          hostId: resolvedHostId,
        })
      },
    }),
  }
}
