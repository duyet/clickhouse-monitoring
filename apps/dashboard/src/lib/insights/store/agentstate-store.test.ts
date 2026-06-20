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
    // Key shape: insight:<host>:<readable-prefix>:<8-hex hash>. The hash suffix
    // makes it collision-proof regardless of how long the title is (see the
    // long-prefix regression test below); the readable prefix aids debugging.
    expect(upsertCalls[0].key).toMatch(/^insight:0:storage.*:[0-9a-f]{8}$/)
    expect(upsertCalls[0].agent_id).toBe('clickhouse-monitoring-insights')
    expect(upsertCalls[0].tags).toEqual(['host:0', 'severity:info'])
  })

  test('regression: long titles sharing a 120+ char prefix do NOT collide', async () => {
    // BUG (found by the realistic-scenario battery): the old key truncated each
    // part to 120 chars, so two distinct insights whose titles share a long
    // prefix produced the SAME state_key and silently overwrote each other.
    const s = store()
    const prefix = 'P'.repeat(150)
    await s.record(0, [
      finding({ metric: 'm', title: `${prefix}-alpha`, value: 1 }),
      finding({ metric: 'm', title: `${prefix}-beta`, value: 2 }),
    ])
    // Two distinct state keys → both persisted, no data loss.
    expect(states.size).toBe(2)
    expect(upsertCalls[0].key).not.toBe(upsertCalls[1].key)
    const rows = await s.list(0)
    expect(rows.map((r) => r.title).sort()).toEqual([
      `${prefix}-alpha`,
      `${prefix}-beta`,
    ])
  })

  test('regression: the same insight maps to a STABLE key across regenerations', async () => {
    // Dedup correctness: an unchanged insight must upsert in place, so the key
    // must be deterministic for identical (category, metric, title).
    const s = store()
    await s.record(0, [finding({ metric: 'm', title: 'stable', value: 1 })])
    const firstKey = upsertCalls[0].key
    await s.record(0, [finding({ metric: 'm', title: 'stable', value: 2 })])
    expect(upsertCalls[1].key).toBe(firstKey)
    expect(states.size).toBe(1) // upserted in place, not duplicated
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

  // Benchmark / scale guard for the hashed key (paired with the collision fix):
  // many adversarial near-identical insights must all get DISTINCT keys, and
  // key generation must stay cheap. This is the perf+correctness backstop for
  // the FNV-1a state_key scheme.
  test('benchmark: 2000 near-identical long-prefix insights → 2000 distinct keys, fast', async () => {
    const s = store()
    const N = 2000
    const prefix = 'X'.repeat(200) // forces all keys past the readable cap
    const batch = Array.from({ length: N }, (_, i) =>
      finding({ metric: 'm', title: `${prefix}-${i}`, value: i })
    )

    const t0 = performance.now()
    await s.record(0, batch)
    const elapsedMs = performance.now() - t0

    // No collisions: every distinct insight persisted to its own state key.
    expect(states.size).toBe(N)
    expect(new Set(upsertCalls.map((c) => c.key)).size).toBe(N)
    // Cheap: well under a generous budget on CI hardware (keygen is O(title)).
    expect(elapsedMs).toBeLessThan(1500)
  })
})
