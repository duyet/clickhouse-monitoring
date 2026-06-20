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
import { clampLimit, rowFromStored } from './types'
import { AgentState } from '@agentstate/sdk'
import { ErrorLogger } from '@chm/logger'

const COMPONENT = 'insights-agentstate-store'
const warn = (msg: string) =>
  ErrorLogger.logWarning(`[insights-agentstate-store] ${msg}`, {
    component: COMPONENT,
  })

/** Logical agent under which every insight record is grouped. */
const AGENT_ID = 'clickhouse-monitoring-insights'
/** Cap on the readable prefix baked into the state key to keep keys bounded. */
const KEY_PREFIX_MAX = 120
/** NUL separator: cannot appear in the source strings, so the hashed
 * composite is unambiguous (no field-boundary aliasing between parts). */
const SEP = String.fromCharCode(0)

export interface AgentStateInsightsStoreOptions {
  /** AgentState API key (`as_live_...`). Required. */
  apiKey: string
  /** AgentState API base URL. Defaults to the SDK default. */
  baseUrl?: string
}

/**
 * FNV-1a 32-bit — a tiny, fast, dependency-free string hash. Used only to make
 * the state key collision-resistant; not security-sensitive.
 */
function fnv1a(str: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

/**
 * Build the stable, bounded state key for an insight.
 *
 * The key must be (a) stable across regenerations of the SAME insight so
 * `upsertState` dedups in place, and (b) DISTINCT for different insights. A
 * naive truncated `category:metric:title` fails (b): two long titles sharing a
 * 120-char prefix collide and silently overwrite each other (data loss). So we
 * append a hash of the FULL untruncated composite — identical insight → identical
 * hash → in-place upsert; different insight → different hash → no collision —
 * while keeping a human-readable (truncated) prefix for debuggability.
 */
function stateKey(hostId: number, finding: Finding): string {
  const composite = `${finding.category}${SEP}${finding.metric ?? ''}${SEP}${finding.title}`
  const readable = encodeURIComponent(composite.split(SEP).join(':')).slice(
    0,
    KEY_PREFIX_MAX
  )
  return `insight:${hostId}:${readable}:${fnv1a(`${hostId}${SEP}${composite}`)}`
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
    const { severity, since } = opts
    try {
      const tags = [`host:${hostId}`]
      if (severity) tags.push(`severity:${severity}`)

      let updatedAfter: number | undefined
      if (since) {
        const ms = intervalToMs(since)
        if (ms !== null) updatedAfter = Date.now() - ms
        else warn(`ignoring invalid "since" value: ${since}`)
      }

      const response = await this.client.queryStates({
        agent_id: AGENT_ID,
        tags,
        updated_after: updatedAfter,
        limit: clampLimit(opts.limit),
      })

      // Skip malformed records (no usable title), then map through the shared
      // stored-row normalizer so the read contract matches the other backends.
      return (response.data ?? [])
        .filter((rec) => typeof rec.data?.title === 'string')
        .map((rec) => rowFromStored(rec.data))
    } catch (err) {
      warn(`failed to list findings on host ${hostId}: ${err}`)
      return []
    }
  }
}
