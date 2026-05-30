import { hostIdSchema, resolveHostId } from './helpers'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'
import {
  type Finding,
  type FindingSeverity,
  listRecentFindings,
  recordFinding,
} from '@/lib/findings/findings-store'

export function createFindingTools(hostId: number) {
  return {
    record_finding: dynamicTool({
      description:
        'Persist a monitoring finding to the app-owned findings table so it survives across sessions and powers autonomous monitoring. Use after detecting an anomaly, incident, or noteworthy condition. Best-effort: silently no-ops on read-only clusters.',
      inputSchema: z.object({
        severity: z
          .enum(['info', 'warning', 'critical'])
          .describe('How urgent the finding is'),
        category: z
          .string()
          .describe('Domain, e.g. "merges", "replication", "memory", "errors"'),
        source: z
          .string()
          .describe(
            'What produced the finding, e.g. "detect_anomalies", "health-sweep", "manual"'
          ),
        title: z.string().describe('Short human-readable summary'),
        detail: z.string().optional().describe('Longer explanation or context'),
        metric: z
          .string()
          .optional()
          .describe('Metric name this finding is about, e.g. "error_rate"'),
        value: z
          .number()
          .optional()
          .describe('Numeric value of the metric, if applicable'),
        hostId: hostIdSchema,
      }),
      execute: async (input: unknown) => {
        const {
          severity,
          category,
          source,
          title,
          detail,
          metric,
          value,
          hostId: toolHostId,
        } = input as {
          severity: FindingSeverity
          category: string
          source: string
          title: string
          detail?: string
          metric?: string
          value?: number
          hostId?: number
        }
        const resolved = resolveHostId(toolHostId, hostId)

        const finding: Finding = {
          severity,
          category,
          source,
          title,
          detail,
          metric,
          value,
        }
        const recorded = await recordFinding(resolved, finding)

        return {
          recorded,
          host_id: resolved,
          finding,
          message: recorded
            ? 'Finding recorded.'
            : 'Could not record finding (cluster may be read-only or table unavailable). Continuing without persistence.',
        }
      },
    }),

    list_recent_findings: dynamicTool({
      description:
        'List recently recorded monitoring findings for a host, newest first. Optionally filter by severity and time window. Use to recall what previous autonomous checks or sessions flagged.',
      inputSchema: z.object({
        severity: z
          .enum(['info', 'warning', 'critical'])
          .optional()
          .describe('Filter to a single severity'),
        since: z
          .string()
          .optional()
          .describe('Time window, e.g. "24 HOUR", "7 DAY"'),
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .default(50)
          .describe('Max findings to return (default 50, max 1000)'),
        hostId: hostIdSchema,
      }),
      execute: async (input: unknown) => {
        const {
          severity,
          since,
          limit = 50,
          hostId: toolHostId,
        } = input as {
          severity?: FindingSeverity
          since?: string
          limit?: number
          hostId?: number
        }
        const resolved = resolveHostId(toolHostId, hostId)

        const findings = await listRecentFindings(resolved, {
          severity,
          since,
          limit,
        })

        return {
          host_id: resolved,
          count: findings.length,
          findings,
        }
      },
    }),
  }
}
