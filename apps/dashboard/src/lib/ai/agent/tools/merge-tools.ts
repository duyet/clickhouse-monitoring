import { z } from 'zod'

import { hostIdSchema, readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'

export function createMergeTools(hostId: number) {
  return {
    get_merge_status: dynamicTool({
      description:
        'Get currently active merges with progress and elapsed time.',
      inputSchema: z.object({
        hostId: hostIdSchema,
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
  }
}
