import { getAllSkills } from '../skills/dynamic-loader'
import { getAllWorkflows } from '../workflows/registry'
import { hostIdSchema, readOnlyQuery, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

const NOTABLE_SETTINGS_LIMIT = 12

/**
 * Best-effort query that returns a fallback when the table/feature is missing,
 * so one unavailable source never blocks the whole context snapshot.
 */
async function safeQuery<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<{ value: T; error?: string }> {
  try {
    return { value: await fn() }
  } catch (err) {
    return {
      value: fallback,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Creates the `get_context` tool — a runtime context-management snapshot.
 *
 * Gathers, in parallel and with graceful degradation, the situational
 * information the agent otherwise has to rediscover each turn: ClickHouse
 * version/uptime, the connected user, Keeper/ZooKeeper availability, memory
 * pressure, how many settings differ from defaults, and the agent's own
 * capabilities (tool count, loaded skills, available workflows). Call it once at
 * the start of a session on an unfamiliar host to orient quickly.
 *
 * `toolCount` is injected by the assembler (index.ts) to avoid a circular import.
 */
export function createContextTools(
  hostId: number,
  options: { toolCount: number }
) {
  return {
    get_context: dynamicTool({
      description:
        "Get a runtime context snapshot for orientation: ClickHouse version & uptime, the current user, whether Keeper/ZooKeeper is configured, memory pressure, the count of changed (non-default) settings, and the agent's own capabilities (tools, skills, workflows). Use it at the start of a session on an unfamiliar host. Supports hostId.",
      inputSchema: z.object({ hostId: hostIdSchema }),
      execute: async (input: unknown) => {
        const { hostId: paramHostId } = input as { hostId?: number }
        const effectiveHostId = resolveHostId(paramHostId, hostId)

        const [server, memory, settings, keeper] = await Promise.all([
          // Version, uptime, user, timezone
          safeQuery(
            async () =>
              (await readOnlyQuery({
                query:
                  'SELECT version() AS version, uptime() AS uptime_seconds, currentUser() AS current_user, timezone() AS timezone',
                hostId: effectiveHostId,
              })) as Array<Record<string, unknown>>,
            []
          ),
          // Memory pressure (tracked + OS total/available)
          safeQuery(
            async () =>
              (await readOnlyQuery({
                query: `SELECT metric, value FROM system.asynchronous_metrics
                        WHERE metric IN ('OSMemoryTotal', 'OSMemoryAvailable')
                        UNION ALL
                        SELECT metric, value FROM system.metrics
                        WHERE metric = 'MemoryTracking'`,
                hostId: effectiveHostId,
              })) as Array<{ metric: string; value: number }>,
            []
          ),
          // Changed (non-default) settings
          safeQuery(
            async () =>
              (await readOnlyQuery({
                query: `SELECT name, value FROM system.settings WHERE changed = 1 ORDER BY name`,
                hostId: effectiveHostId,
              })) as Array<{ name: string; value: string }>,
            []
          ),
          // Keeper/ZooKeeper availability (optional table)
          safeQuery(
            async () =>
              (await readOnlyQuery({
                query: `SELECT count() AS c FROM system.zookeeper WHERE path = '/'`,
                hostId: effectiveHostId,
              })) as Array<{ c: number }>,
            null as Array<{ c: number }> | null
          ),
        ])

        const serverRow = server.value[0] ?? {}
        const memByMetric = new Map(
          memory.value.map((row) => [row.metric, Number(row.value)])
        )
        const changedSettings = settings.value

        // Capabilities are local (no DB) — describe what the agent can do.
        const toolCount = options.toolCount
        const skills = getAllSkills().map((skill) => skill.name)
        const workflows = getAllWorkflows().map((workflow) => workflow.name)

        return {
          type: 'agent_context' as const,
          hostId: effectiveHostId,
          server: {
            version: serverRow.version ?? null,
            uptimeSeconds: serverRow.uptime_seconds ?? null,
            currentUser: serverRow.current_user ?? null,
            timezone: serverRow.timezone ?? null,
            ...(server.error ? { error: server.error } : {}),
          },
          keeper: {
            configured: keeper.value !== null,
            ...(keeper.error
              ? { detail: 'system.zookeeper not available' }
              : {}),
          },
          memory: {
            trackedBytes: memByMetric.get('MemoryTracking') ?? null,
            osTotalBytes: memByMetric.get('OSMemoryTotal') ?? null,
            osAvailableBytes: memByMetric.get('OSMemoryAvailable') ?? null,
          },
          settings: {
            changedCount: changedSettings.length,
            notable: changedSettings
              .slice(0, NOTABLE_SETTINGS_LIMIT)
              .map((row) => row.name),
          },
          capabilities: {
            toolCount,
            skills,
            workflows,
          },
          generatedAt: new Date().toISOString(),
        }
      },
    }),
  }
}
