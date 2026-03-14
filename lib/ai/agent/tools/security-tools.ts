import { readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createSecurityTools(hostId: number) {
  return {
    get_active_sessions: dynamicTool({
      description:
        'Get active sessions with user, client info, and resource usage.',
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
            query_id,
            user,
            elapsed,
            read_rows,
            memory_usage,
            substring(query, 1, 200) AS query,
            client_hostname,
            client_name,
            http_user_agent
          FROM system.processes
          ORDER BY elapsed DESC`,
          hostId: resolvedHostId,
        })
      },
    }),

    get_login_attempts: dynamicTool({
      description:
        'Get recent login attempts from session_log. Note: session_log may not exist in all ClickHouse versions.',
      inputSchema: z.object({
        limit: z
          .number()
          .optional()
          .default(50)
          .describe('Maximum number of rows to return.'),
        lastHours: z
          .number()
          .optional()
          .default(24)
          .describe('Number of hours to look back.'),
        hostId: z
          .number()
          .optional()
          .describe('Override the default ClickHouse host index.'),
      }),
      execute: async (input: unknown) => {
        const {
          limit = 50,
          lastHours = 24,
          hostId: toolHostId,
        } = input as {
          limit?: number
          lastHours?: number
          hostId?: number
        }
        const resolvedHostId = resolveHostId(toolHostId, hostId)
        return readOnlyQuery({
          query: `SELECT
            user,
            client_hostname,
            client_port,
            auth_type,
            event_time,
            interface
          FROM system.session_log
          WHERE event_time > now() - INTERVAL {lastHours:UInt32} HOUR
          ORDER BY event_time DESC
          LIMIT {limit:UInt32}`,
          query_params: { limit, lastHours },
          hostId: resolvedHostId,
        })
      },
    }),

    get_users_and_roles: dynamicTool({
      description:
        'Get all users and roles defined in ClickHouse access control.',
      inputSchema: z.object({
        hostId: z
          .number()
          .optional()
          .describe('Override the default ClickHouse host index.'),
      }),
      execute: async (input: unknown) => {
        const { hostId: toolHostId } = input as { hostId?: number }
        const resolvedHostId = resolveHostId(toolHostId, hostId)
        const [users, roles] = await Promise.all([
          readOnlyQuery({
            query: `SELECT
              name,
              storage,
              auth_type,
              host_ip,
              host_names,
              default_roles_all,
              default_roles_list
            FROM system.users
            ORDER BY name`,
            hostId: resolvedHostId,
          }),
          readOnlyQuery({
            query: `SELECT
              name,
              storage
            FROM system.roles
            ORDER BY name`,
            hostId: resolvedHostId,
          }),
        ])
        return { users, roles }
      },
    }),
  }
}
