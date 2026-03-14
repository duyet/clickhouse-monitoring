import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createSettingsTools(hostId: number) {
  return {
    get_settings: dynamicTool({
      description:
        'Retrieve server settings that have been changed from their defaults.',
      inputSchema: z.object({
        pattern: z
          .string()
          .optional()
          .default('')
          .describe('Optional LIKE pattern to filter setting names'),
        hostId: z.number().optional().describe('Host index override'),
      }),
      execute: async (input: unknown) => {
        const { pattern = '', hostId: hostIdOverride } = input as {
          pattern?: string
          hostId?: number
        }
        const resolvedHostId = resolveHostId(hostIdOverride, hostId)
        return readOnlyQuery({
          query: `SELECT name, value, changed, description, type FROM system.settings WHERE changed = 1 AND ({pattern:String} = '' OR name LIKE {pattern:String}) ORDER BY name`,
          query_params: { pattern },
          hostId: resolvedHostId,
        })
      },
    }),

    get_mergetree_settings: dynamicTool({
      description:
        'Retrieve MergeTree engine settings that have been changed from their defaults.',
      inputSchema: z.object({
        pattern: z
          .string()
          .optional()
          .default('')
          .describe('Optional LIKE pattern to filter setting names'),
        hostId: z.number().optional().describe('Host index override'),
      }),
      execute: async (input: unknown) => {
        const { pattern = '', hostId: hostIdOverride } = input as {
          pattern?: string
          hostId?: number
        }
        const resolvedHostId = resolveHostId(hostIdOverride, hostId)
        return readOnlyQuery({
          query: `SELECT name, value, changed, description, type FROM system.merge_tree_settings WHERE changed = 1 AND ({pattern:String} = '' OR name LIKE {pattern:String}) ORDER BY name`,
          query_params: { pattern },
          hostId: resolvedHostId,
        })
      },
    }),
  }
}
