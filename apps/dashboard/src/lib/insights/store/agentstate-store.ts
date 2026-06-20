/**
 * AgentState insights backend.
 *
 * Persists each insight as a record in AgentState's generic **State** store
 * (https://agentstate.app) — not its conversation store. State records are a
 * better fit for scalar findings than conversations: each insight maps to one
 * versioned `state_key`, so re-recording the same insight upserts in place
 * (natural dedup), and `queryStates` filters by tag + recency for the read path.
 *
 * Key design:
 * - `agent_id`  = a fixed app id so every insight shares one logical agent.
 * - `state_key` = `insight:<hostId>:<category>:<metric>:<title>` (bounded),
 *   stable across regenerations so an unchanged insight overwrites itself.
 * - `tags`      = [`host:<hostId>`, `severity:<sev>`] for server-side filtering.
 * - `data`      = the scalar finding fields plus an explicit `event_time` (ms).
 *
 * Best-effort: any SDK error logs and degrades to no-op / empty, matching the
 * other backends. Reuses the same `AGENTSTATE_API_KEY` / `AGENTSTATE_BASE_URL`
 * env as the conversation store.
 */

import type { JsonObject } from '@agentstate/sdk'
import type {
  Finding,
  FindingRow,
  InsightsStore,
  ListFindingsOptions,
} from './types'

import { intervalToMs } from './interval'
import { AgentState } from '@agentstate/sdk'
import { ErrorLogger } from '@chm/logger'

const COMPONENT = 'insights-agentstate-store'
const warn = (msg: string) =>
  ErrorLogger.logWarning(`[insights-agentstate-store] ${msg}`, {
    component: COMPONENT,
  })

/** Logical agent under which every insight record is grouped. */
const AGENT_ID = 'clickhouse-monitoring-insights'
/** Cap on the title slice baked into the state key to keep keys bounded. */
const KEY_TITLE_MAX = 120

export interface AgentStateInsightsStoreOptions {
  /** AgentState API key (`as_live_...`). Required. */
  apiKey: string
  /** AgentState API base URL. Defaults to the SDK default. */
  baseUrl?: string
}

/** Build the stable, bounded state key for an insight. */
function stateKey(hostId: number, finding: Finding): string {
  const part = (s: string) => encodeURIComponent(s).slice(0, KEY_TITLE_MAX)
  return `insight:${hostId}:${part(finding.category)}:${part(
    finding.metric ?? ''
  )}:${part(finding.title)}`
}

export class AgentStateInsightsStore implements InsightsStore {
  readonly backend = 'agentstate' as const
  private readonly client: AgentState

  constructor(opts: AgentStateInsightsStoreOptions) {
    this.client = new AgentState({
      apiKey: opts.apiKey,
      baseUrl: opts.baseUrl,
    })
  }

  async record(hostId: number, findings: Finding[]): Promise<boolean> {
    if (findings.length === 0) return true
    const now = Date.now()
    try {
      const results = await Promise.all(
        findings.map((f) =>
          this.client
            .upsertState(stateKey(hostId, f), {
              agent_id: AGENT_ID,
              tags: [`host:${hostId}`, `severity:${f.severity}`],
              data: {
                event_time: now,
                host_id: String(hostId),
                severity: f.severity,
                category: f.category,
                source: f.source,
                title: f.title,
                detail: f.detail ?? '',
                metric: f.metric ?? '',
                value: f.value ?? 0,
              } satisfies JsonObject,
            })
            .then(
              () => true,
              (err) => {
                warn(`upsert failed for "${f.title}" on host ${hostId}: ${err}`)
                return false
              }
            )
        )
      )
      return results.every(Boolean)
    } catch (err) {
      warn(`failed to record findings on host ${hostId}: ${err}`)
      return false
    }
  }

  async list(
    hostId: number,
    opts: ListFindingsOptions = {}
  ): Promise<FindingRow[]> {
    const { severity, since, limit = 100 } = opts
    try {
      const tags = [`host:${hostId}`]
      if (severity) tags.push(`severity:${severity}`)

      let updatedAfter: number | undefined
      if (since) {
        const ms = intervalToMs(since)
        if (ms !== null) updatedAfter = Date.now() - ms
        else warn(`ignoring invalid "since" value: ${since}`)
      }

      const safeLimit = Math.min(Math.max(Math.trunc(limit) || 0, 1), 1000)
      const response = await this.client.queryStates({
        agent_id: AGENT_ID,
        tags,
        updated_after: updatedAfter,
        limit: safeLimit,
      })

      return (response.data ?? [])
        .map((rec) => this.toRow(rec.data))
        .filter((r): r is FindingRow => r !== null)
    } catch (err) {
      warn(`failed to list findings on host ${hostId}: ${err}`)
      return []
    }
  }

  /** Map a stored state `data` object back to the shared FindingRow shape. */
  private toRow(data: JsonObject): FindingRow | null {
    if (!data || typeof data.title !== 'string') return null
    const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)
    const str = (v: unknown) => (typeof v === 'string' ? v : '')
    return {
      event_time: new Date(num(data.event_time)).toISOString(),
      host_id: str(data.host_id),
      severity: str(data.severity),
      category: str(data.category),
      source: str(data.source),
      title: str(data.title),
      detail: str(data.detail),
      metric: str(data.metric),
      value: num(data.value),
    }
  }
}
