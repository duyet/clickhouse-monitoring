/**
 * Tests for the AgentState insights backend.
 *
 * Mocks @agentstate/sdk with a behavioral fake of the generic State API
 * (upsertState / queryStates) so we exercise: the stable state_key (which gives
 * natural dedup), host/severity tagging, the updated_after recency filter, the
 * State-record → FindingRow mapping, and the best-effort degrade when the SDK
 * throws.
 */

import type { Finding } from './types'

import { beforeEach, describe, expect, mock, test } from 'bun:test'

interface FakeState {
  state_key: string
  agent_id: string
  data: Record<string, unknown>
  tags: string[]
  updated_at: number
}

const states = new Map<string, FakeState>()
const upsertCalls: Array<{
  key: string
  agent_id: string
  tags: string[]
}> = []
let failKeySubstring: string | null = null

class FakeAgentState {
  constructor(_cfg: unknown) {}

  async upsertState(
    key: string,
    body: { agent_id: string; data: Record<string, unknown>; tags: string[] }
  ): Promise<FakeState> {
    upsertCalls.push({ key, agent_id: body.agent_id, tags: body.tags })
    if (failKeySubstring && key.includes(failKeySubstring)) {
      throw new Error('simulated upsert failure')
    }
    const rec: FakeState = {
      state_key: key,
      agent_id: body.agent_id,
      data: body.data,
      tags: body.tags,
      updated_at: Number(body.data.event_time),
    }
    states.set(key, rec)
    return rec
  }

  async queryStates(q: {
    agent_id?: string
    tags?: string[]
    updated_after?: number
    limit?: number
  }) {
    let arr = [...states.values()]
    if (q.agent_id) arr = arr.filter((s) => s.agent_id === q.agent_id)
    if (q.tags?.length)
      arr = arr.filter((s) => q.tags!.every((t) => s.tags.includes(t)))
    if (q.updated_after != null)
      arr = arr.filter((s) => s.updated_at >= q.updated_after!)
    arr = arr.slice(0, q.limit ?? 100)
    return {
      data: arr,
      pagination: { limit: q.limit ?? 100, next_cursor: null },
    }
  }
}

mock.module('@agentstate/sdk', () => ({
  AgentState: FakeAgentState,
  AgentStateError: class extends Error {},
}))

const { AgentStateInsightsStore } = await import('./agentstate-store')

const store = () => new AgentStateInsightsStore({ apiKey: 'as_live_TEST' })

const finding = (over: Partial<Finding> = {}): Finding => ({
  severity: 'info',
  category: 'storage',
  source: 'ai-insight',
  title: 'table X fragmented',
  detail: 'd',
  metric: 'max_active_parts',
  value: 318,
  ...over,
})

beforeEach(() => {
  states.clear()
  upsertCalls.length = 0
  failKeySubstring = null
})

describe('AgentStateInsightsStore', () => {
  test('exposes the agentstate backend id', () => {
    expect(store().backend).toBe('agentstate')
  })

  test('records each finding under a stable, host-scoped state key with tags', async () => {
    expect(await store().record(0, [finding()])).toBe(true)
    expect(upsertCalls).toHaveLength(1)
    expect(upsertCalls[0].key).toBe(
      'insight:0:storage:max_active_parts:table%20X%20fragmented'
    )
    expect(upsertCalls[0].agent_id).toBe('clickhouse-monitoring-insights')
    expect(upsertCalls[0].tags).toEqual(['host:0', 'severity:info'])
  })

  test('re-recording the same insight upserts in place (natural dedup)', async () => {
    const s = store()
    await s.record(0, [finding({ value: 100 })])
    await s.record(0, [finding({ value: 200 })])
    expect(states.size).toBe(1)
    const rows = await s.list(0)
    expect(rows).toHaveLength(1)
    expect(rows[0].value).toBe(200) // newest write wins
  })

  test('list maps State data back to the FindingRow shape with ISO event_time', async () => {
    const s = store()
    await s.record(0, [finding()])
    const [row] = await s.list(0)
    expect(row).toMatchObject({
      host_id: '0',
      severity: 'info',
      category: 'storage',
      source: 'ai-insight',
      title: 'table X fragmented',
      metric: 'max_active_parts',
      value: 318,
    })
    expect(row.event_time).toContain('T')
  })

  test('list filters by host and severity via tags', async () => {
    const s = store()
    await s.record(0, [
      finding({ severity: 'info', title: 'a' }),
      finding({ severity: 'critical', title: 'b' }),
    ])
    await s.record(1, [finding({ title: 'other-host' })])

    expect(
      (await s.list(0, { severity: 'critical' })).map((r) => r.title)
    ).toEqual(['b'])
    expect((await s.list(1)).map((r) => r.title)).toEqual(['other-host'])
  })

  test('record returns false when a single upsert throws (best-effort AND)', async () => {
    failKeySubstring = 'bad'
    const s = store()
    const ok = await s.record(0, [
      finding({ title: 'good' }),
      finding({ title: 'bad' }),
    ])
    expect(ok).toBe(false)
    // the good one still persisted
    expect(states.size).toBe(1)
  })

  test('empty batch is a no-op success', async () => {
    expect(await store().record(0, [])).toBe(true)
    expect(upsertCalls).toHaveLength(0)
  })
})
