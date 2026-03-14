import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createLogTools(hostId: number) {
  return {
    get_text_log: dynamicTool({
      description: 'Retrieve server log entries from system.text_log.',
      inputSchema: z.object({
        level: z
          .string()
          .optional()
          .default('')
          .describe(
            'Log level filter (e.g. Error, Warning, Information). Empty for all levels.'
          ),
        limit: z
          .number()
          .optional()
          .default(100)
          .describe('Maximum number of log entries to return'),
        lastHours: z
          .number()
          .optional()
          .default(1)
          .describe('How many hours back to look for log entries'),
        pattern: z
          .string()
          .optional()
          .default('')
          .describe('Optional LIKE pattern to filter log messages'),
        hostId: z.number().optional().describe('Host index override'),
      }),
      execute: async (input: unknown) => {
        const {
          level = '',
          limit = 100,
          lastHours = 1,
          pattern = '',
          hostId: hostIdOverride,
        } = input as {
          level?: string
          limit?: number
          lastHours?: number
          pattern?: string
          hostId?: number
        }
        const resolvedHostId = resolveHostId(hostIdOverride, hostId)
        return readOnlyQuery({
          query: `SELECT event_time, level, logger_name, message FROM system.text_log WHERE event_time > now() - INTERVAL {lastHours:UInt32} HOUR AND ({level:String} = '' OR level = {level:String}) AND ({pattern:String} = '' OR message LIKE {pattern:String}) ORDER BY event_time DESC LIMIT {limit:UInt32}`,
          query_params: { level, limit, lastHours, pattern },
          hostId: resolvedHostId,
        })
      },
    }),

    get_stack_traces: dynamicTool({
      description:
        'Retrieve current thread stack traces from system.stack_trace.',
      inputSchema: z.object({
        limit: z
          .number()
          .optional()
          .default(20)
          .describe('Maximum number of stack traces to return'),
        hostId: z.number().optional().describe('Host index override'),
      }),
      execute: async (input: unknown) => {
        const { limit = 20, hostId: hostIdOverride } = input as {
          limit?: number
          hostId?: number
        }
        const resolvedHostId = resolveHostId(hostIdOverride, hostId)
        return readOnlyQuery({
          query: `SELECT thread_name, thread_id, query_id, substring(trace_full, 1, 1000) AS trace FROM system.stack_trace LIMIT {limit:UInt32}`,
          query_params: { limit },
          hostId: resolvedHostId,
        })
      },
    }),
  }
}
