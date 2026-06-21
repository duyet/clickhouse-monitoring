/**
 * Realistic-scenario battery for the pluggable InsightsStore.
 *
 * Mirrors the project's sql-validator realistic-scenario battery (#1759): a
 * data-driven table of production-shaped scenarios, each run against EVERY
 * in-process-testable backend (memory, D1, Postgres, AgentState) with semantic
 * fakes of the underlying datastores. Two things are asserted per scenario:
 *
 *   1. Contract  — the canonical read-path output matches what the scenario expects.
 *   2. Parity    — every backend produces the SAME canonical output.
 *
 * "Canonical output" is the store rows passed through the read-path's
 * dedupe-by-stable-key normalization (`dedupeByKey` below mirrors
 * read-insights.ts), because backends legitimately differ at the raw `list`
 * level (AgentState upserts/dedups; SQL backends return raw rows) but MUST agree
 * once normalized. A parity mismatch is a real interchangeability bug.
 *
 * The fakes simulate correct datastore semantics; the store code under test is
 * real, so any SQL-building or row-mapping bug surfaces here.
 */

import type { Finding, FindingRow } from './types'

import { beforeEach, describe, expect, mock, test } from 'bun:test'

// ─────────────────────────────────────────────────────────────────────────────
// Semantic fakes for the three DB-backed stores. Each persists rows and filters
// the way its real datastore would, so the store's mapping logic is exercised.
// ─────────────────────────────────────────────────────────────────────────────

interface StoredRow {
  event_time: number
  host_id: string
  severity: string
  category: string
  source: string
  title: string
  detail: string
  metric: string
  value: number
}

// --- D1 fake (positional ? binds) -------------------------------------------
function makeFakeD1() {
  const rows: StoredRow[] = []
  function rowFromBinds(b: unknown[]): StoredRow {
    return {
      event_time: b[0] as number,
      host_id: b[1] as string,
      severity: b[2] as string,
      category: b[3] as string,
      source: b[4] as string,
      title: b[5] as string,
      detail: b[6] as string,
      metric: b[7] as string,
      value: b[8] as number,
    }
  }
  function allFor(sql: string, binds: unknown[]) {
    let i = 0
    const host = binds[i++] as string
    let sev: string | undefined
    let cutoff: number | undefined
    if (sql.includes('severity = ?')) sev = binds[i++] as string
    if (sql.includes('event_time >= ?')) cutoff = binds[i++] as number
    const limit = binds[i++] as number
    let out = rows.filter((r) => r.host_id === host)
    if (sev) out = out.filter((r) => r.severity === sev)
    if (cutoff != null) out = out.filter((r) => r.event_time >= cutoff)
    out = out.sort((a, b) => b.event_time - a.event_time).slice(0, limit)
    return { results: out }
  }
  return {
    prepare(sql: string) {
      return {
        sql,
        bind(...args: unknown[]) {
          return { sql, binds: args, all: async () => allFor(sql, args) }
        },
      }
    },
    async batch(stmts: Array<{ sql: string; binds?: unknown[] }>) {
      return stmts.map((s) => {
        if (/^\s*INSERT/.test(s.sql)) rows.push(rowFromBinds(s.binds ?? []))
        return { success: true }
      })
    },
  }
}

// --- Postgres fake (tagged-template; predicate fragments recorded in order) --
function makeFakePg() {
  const rows: StoredRow[] = []
  let pending: Array<{ col: string; val: unknown }> = []
  let pendingInsert: StoredRow[] | null = null

  function sql(...args: unknown[]): unknown {
    const isTpl = Array.isArray(args[0]) && 'raw' in (args[0] as object)
    if (!isTpl) {
      pendingInsert = args[0] as StoredRow[]
      return { __frag: 'rows' }
    }
    const strings = args[0] as string[]
    const values = args.slice(1)
    const text = strings.join(' ')
    if (/^\s*AND severity/.test(text)) {
      pending.push({ col: 'severity', val: values[0] })
      return { __frag: 'cond' }
    }
    if (/^\s*AND event_time/.test(text)) {
      pending.push({ col: 'event_time', val: values[0] })
      return { __frag: 'cond' }
    }
    if (text.trim() === '') return { __frag: 'empty' }
    if (/INSERT/i.test(text)) {
      for (const r of pendingInsert ?? []) rows.push({ ...r })
      pendingInsert = null
      return Promise.resolve([])
    }
    if (/SELECT/i.test(text)) {
      const host = values[0] as string
      const limit = values[values.length - 1] as number
      let out = rows.filter((r) => r.host_id === host)
      for (const p of pending) {
        if (p.col === 'severity') out = out.filter((r) => r.severity === p.val)
        if (p.col === 'event_time')
          out = out.filter((r) => r.event_time >= (p.val as number))
      }
      pending = []
      out = out.sort((a, b) => b.event_time - a.event_time).slice(0, limit)
      // postgres driver returns DOUBLE PRECISION as string — mimic that.
      return Promise.resolve(
        out.map((r) => ({
          ...r,
          value: String(r.value),
          event_time: r.event_time,
        }))
      )
    }
    return Promise.resolve([])
  }
  ;(sql as { unsafe?: unknown }).unsafe = async () => []
  return sql
}

// --- AgentState fake (generic State store; upsert dedups by state_key) -------
//
// CRITICAL: the store does `import { AgentState } from '@agentstate/sdk'` and
// `new AgentState(...)` — with ESM that named binding is snapshotted at module
// load, so a getter/holder that swaps the class per test does NOT take effect
// (unlike the D1/Postgres fakes, whose stores reach the dep through a runtime
// CALL: getPlatformBindings() / postgres()). So we register ONE stable class
// that reads a module-level map we reset per test.
interface FakeStateRec {
  agent_id: string
  data: Record<string, unknown>
  tags: string[]
  updated_at: number
}
let agentStates = new Map<string, FakeStateRec>()

class FakeAgentStateSdk {
  async upsertState(
    key: string,
    body: { agent_id: string; data: Record<string, unknown>; tags: string[] }
  ) {
    agentStates.set(key, {
      agent_id: body.agent_id,
      data: body.data,
      tags: body.tags,
      updated_at: Number(body.data.event_time),
    })
    return { state_key: key, ...body }
  }
  async queryStates(q: {
    agent_id?: string
    tags?: string[]
    updated_after?: number
    limit?: number
  }) {
    let arr = [...agentStates.values()]
    if (q.agent_id) arr = arr.filter((s) => s.agent_id === q.agent_id)
    if (q.tags?.length)
      arr = arr.filter((s) => q.tags!.every((t) => s.tags.includes(t)))
    if (q.updated_after != null)
      arr = arr.filter((s) => s.updated_at >= q.updated_after!)
    arr = arr
      .sort((a, b) => b.updated_at - a.updated_at)
      .slice(0, q.limit ?? 100)
    return {
      data: arr,
      pagination: { limit: q.limit ?? 100, next_cursor: null },
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock registration. Each fake is swapped in per test via the holders below.
// ─────────────────────────────────────────────────────────────────────────────
let currentD1: ReturnType<typeof makeFakeD1> | null = null
let currentPg: ReturnType<typeof makeFakePg> = makeFakePg()

/** Reset every backend's fake datastore to empty. */
function resetFakes(): void {
  currentD1 = makeFakeD1()
  currentPg = makeFakePg()
  agentStates = new Map()
}

mock.module('cloudflare:workers', () => ({ env: {} }))
mock.module('@chm/platform', () => ({
  getPlatformBindings: () => ({ getD1Database: () => currentD1 }),
}))
mock.module('postgres', () => ({ default: () => currentPg }))
mock.module('@agentstate/sdk', () => ({
  AgentState: FakeAgentStateSdk,
  AgentStateError: class extends Error {},
}))

const { MemoryInsightsStore } = await import('./memory-store')
const { D1InsightsStore } = await import('./d1-store')
const { PostgresInsightsStore } = await import('./postgres-store')
const { AgentStateInsightsStore } = await import('./agentstate-store')
const { insightKey } = await import('../types')

import type { InsightsStore } from './types'

interface Backend {
  name: string
  make: () => InsightsStore
}

const BACKENDS: Backend[] = [
  { name: 'memory', make: () => new MemoryInsightsStore() },
  { name: 'd1', make: () => new D1InsightsStore() },
  { name: 'postgres', make: () => new PostgresInsightsStore('postgres://x') },
  {
    name: 'agentstate',
    make: () => new AgentStateInsightsStore({ apiKey: 'as_live_TEST' }),
  },
]

beforeEach(() => {
  resetFakes()
})

// ─────────────────────────────────────────────────────────────────────────────
// Canonical normalization — mirrors read-insights.ts dedupe-by-stable-key. The
// store rows differ across backends at the raw level but MUST agree once
// normalized this way (newest occurrence per key wins; rows are newest-first).
// ─────────────────────────────────────────────────────────────────────────────
interface CanonicalCard {
  key: string
  severity: string
  category: string
  source: string
  title: string
  detail: string
  metric: string
  value: number
}

const INSIGHT_SOURCE = 'ai-insight'

function dedupeByKey(host: number, rows: FindingRow[]): CanonicalCard[] {
  const byKey = new Map<string, CanonicalCard>()
  for (const r of rows) {
    if (r.source !== INSIGHT_SOURCE) continue
    const key = insightKey(host, {
      category: r.category,
      metric: r.metric || undefined,
      title: r.title,
    })
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        severity: r.severity,
        category: r.category,
        source: r.source,
        title: r.title,
        detail: r.detail,
        metric: r.metric,
        value: Number(r.value),
      })
    }
  }
  return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key))
}

/** Run a scenario's record batches against a backend and return canonical cards. */
async function runBackend(
  backend: Backend,
  host: number,
  batches: Finding[][],
  opts?: { since?: string; limit?: number }
): Promise<CanonicalCard[]> {
  const store = backend.make()
  for (const batch of batches) {
    // Assert the write succeeded — a degraded write must not pass silently and
    // let a parity/contract check pass on an empty store.
    expect(await store.record(host, batch)).toBe(true)
  }
  const rows = await store.list(host, opts)
  return dedupeByKey(host, rows)
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario fixtures — production-shaped findings.
// ─────────────────────────────────────────────────────────────────────────────
const f = (over: Partial<Finding> = {}): Finding => ({
  severity: 'info',
  category: 'storage',
  source: 'ai-insight',
  title: 'table is fragmented',
  detail: '',
  metric: '',
  value: 0,
  ...over,
})

interface Scenario {
  name: string
  host: number
  batches: Finding[][]
  expect: (cards: CanonicalCard[]) => void
  /**
   * How to compare backends in the parity check. 'full' (default) requires
   * identical canonical cards. 'keys' requires only the same set of surviving
   * stable keys — used for scenarios that record the SAME key multiple times in
   * one test (same millisecond), where "which duplicate wins" is legitimately
   * non-deterministic across backends (memory reverses insertion; SQL backends
   * keep stable insertion order under an equal-timestamp ORDER BY). Real cron
   * runs are minutes apart, so this only affects same-ms test fixtures.
   */
  parityMode?: 'full' | 'keys'
}

const SCENARIOS: Scenario[] = [
  {
    name: 'fragmented table (storage)',
    host: 0,
    batches: [
      [
        f({
          severity: 'warning',
          metric: 'max_active_parts',
          value: 318,
          title: 'duyet.redirect is fragmented',
          detail: '318 parts',
        }),
      ],
    ],
    expect: (c) => {
      expect(c).toHaveLength(1)
      expect(c[0]).toMatchObject({
        severity: 'warning',
        category: 'storage',
        metric: 'max_active_parts',
        value: 318,
        title: 'duyet.redirect is fragmented',
        detail: '318 parts',
      })
    },
  },
  {
    name: 'error-rate spike (anomaly, critical)',
    host: 0,
    batches: [
      [
        f({
          severity: 'critical',
          category: 'anomaly',
          metric: 'error_rate',
          value: 12.5,
          title: 'error rate climbing',
        }),
      ],
    ],
    expect: (c) =>
      expect(c[0]).toMatchObject({
        severity: 'critical',
        category: 'anomaly',
        metric: 'error_rate',
        value: 12.5,
      }),
  },
  {
    name: 'replication lag (reliability)',
    host: 0,
    batches: [
      [
        f({
          severity: 'warning',
          category: 'reliability',
          metric: 'max_replication_delay',
          value: 45,
        }),
      ],
    ],
    expect: (c) => expect(c[0].metric).toBe('max_replication_delay'),
  },
  {
    name: 'narrative insight, no metric',
    host: 0,
    batches: [
      [
        f({
          severity: 'info',
          category: 'storage',
          metric: '',
          title: 'consider TTL policy',
        }),
      ],
    ],
    expect: (c) => {
      expect(c).toHaveLength(1)
      expect(c[0].metric).toBe('')
      expect(c[0].key).toBe('0:storage::consider TTL policy')
    },
  },
  {
    name: 'three insights → all distinct keys',
    host: 0,
    batches: [
      [
        f({
          severity: 'critical',
          category: 'anomaly',
          metric: 'a',
          title: 'c',
        }),
        f({
          severity: 'warning',
          category: 'anomaly',
          metric: 'b',
          title: 'w',
        }),
        f({ severity: 'info', category: 'anomaly', metric: 'd', title: 'i' }),
      ],
    ],
    expect: (c) => expect(c).toHaveLength(3),
  },
  {
    name: 'duplicate key across two cron runs → dedups to one',
    host: 0,
    batches: [
      [
        f({
          severity: 'warning',
          metric: 'max_active_parts',
          title: 'frag',
          value: 100,
        }),
      ],
      [
        f({
          severity: 'critical',
          metric: 'max_active_parts',
          title: 'frag',
          value: 400,
        }),
      ],
    ],
    expect: (c) => expect(c).toHaveLength(1),
    parityMode: 'keys',
  },
  {
    name: 'duplicate key across three cron runs → dedups to one',
    host: 2,
    batches: [
      [f({ metric: 'm', title: 't', value: 1 })],
      [f({ metric: 'm', title: 't', value: 2 })],
      [f({ metric: 'm', title: 't', value: 3 })],
    ],
    expect: (c) => expect(c).toHaveLength(1),
    parityMode: 'keys',
  },
  {
    name: 'mixed sources → only ai-insight survives',
    host: 0,
    batches: [
      [
        f({ title: 'real insight', metric: 'm1' }),
        f({ source: 'health-sweep', title: 'sweep finding', metric: 'm2' }),
      ],
    ],
    expect: (c) => {
      expect(c).toHaveLength(1)
      expect(c[0].title).toBe('real insight')
    },
  },
  {
    name: 'ten distinct insights all returned',
    host: 0,
    batches: [
      Array.from({ length: 10 }, (_, i) =>
        f({ metric: `m${i}`, title: `t${i}` })
      ),
    ],
    expect: (c) => expect(c).toHaveLength(10),
  },
  {
    name: 'unicode + emoji title round-trips intact',
    host: 0,
    batches: [
      [f({ metric: 'm', title: 'таблица 重 fragmented 🧩', detail: 'ключ' })],
    ],
    expect: (c) => {
      expect(c[0].title).toBe('таблица 重 fragmented 🧩')
      expect(c[0].detail).toBe('ключ')
    },
  },
  {
    name: 'title with colon and percent encodes safely yet reads raw',
    host: 0,
    batches: [
      [f({ metric: 'pct%', title: 'db:table at 80% full', detail: 'x' })],
    ],
    expect: (c) => {
      expect(c[0].title).toBe('db:table at 80% full')
      expect(c[0].metric).toBe('pct%')
    },
  },
  {
    name: 'value edge cases: zero / negative / large / fractional',
    host: 0,
    batches: [
      [
        f({ metric: 'z', title: 'zero', value: 0 }),
        f({ metric: 'n', title: 'neg', value: -1 }),
        f({ metric: 'big', title: 'large', value: 1_000_000_000 }),
        f({ metric: 'fr', title: 'frac', value: 0.125 }),
      ],
    ],
    expect: (c) => {
      const byTitle = Object.fromEntries(c.map((x) => [x.title, x.value]))
      expect(byTitle.zero).toBe(0)
      expect(byTitle.neg).toBe(-1)
      expect(byTitle.large).toBe(1_000_000_000)
      expect(byTitle.frac).toBe(0.125)
    },
  },
  {
    name: 'empty batch → nothing stored',
    host: 0,
    batches: [[]],
    expect: (c) => expect(c).toHaveLength(0),
  },
  {
    name: 'per-host isolation (read host 0)',
    host: 0,
    batches: [[f({ metric: 'm', title: 'host0-insight' })]],
    expect: (c) => {
      expect(c).toHaveLength(1)
      expect(c[0].title).toBe('host0-insight')
    },
  },
  {
    name: 'detail field preserved verbatim',
    host: 0,
    batches: [
      [
        f({
          metric: 'm',
          title: 't',
          detail: 'Consider OPTIMIZE TABLE or reviewing the partition key.',
        }),
      ],
    ],
    expect: (c) =>
      expect(c[0].detail).toBe(
        'Consider OPTIMIZE TABLE or reviewing the partition key.'
      ),
  },
  {
    name: 'long title (200 chars) is not lost or truncated',
    host: 0,
    batches: [[f({ metric: 'm', title: 'T'.repeat(200) })]],
    expect: (c) => {
      expect(c).toHaveLength(1)
      expect(c[0].title).toBe('T'.repeat(200))
    },
  },
  {
    name: 'two long titles sharing a 150-char prefix stay distinct',
    host: 0,
    batches: [
      [
        f({ metric: 'm', title: `${'P'.repeat(150)}-alpha` }),
        f({ metric: 'm', title: `${'P'.repeat(150)}-beta` }),
      ],
    ],
    expect: (c) => expect(c).toHaveLength(2),
  },
  {
    name: 'same title, different metric → distinct keys',
    host: 0,
    batches: [
      [
        f({ metric: 'parts', title: 'fragmented' }),
        f({ metric: 'compression', title: 'fragmented' }),
      ],
    ],
    expect: (c) => expect(c).toHaveLength(2),
  },
  {
    name: 'same title+metric, different category → distinct keys',
    host: 0,
    batches: [
      [
        f({ category: 'storage', metric: 'm', title: 'issue' }),
        f({ category: 'anomaly', metric: 'm', title: 'issue' }),
      ],
    ],
    expect: (c) => expect(c).toHaveLength(2),
  },
  {
    name: 'realistic cron snapshot: 4 mixed insights',
    host: 0,
    batches: [
      [
        f({
          severity: 'critical',
          category: 'anomaly',
          metric: 'error_rate',
          value: 9,
          title: 'errors climbing',
        }),
        f({
          severity: 'warning',
          category: 'storage',
          metric: 'max_active_parts',
          value: 280,
          title: 'events fragmented',
        }),
        f({
          severity: 'warning',
          category: 'reliability',
          metric: 'readonly_replicas',
          value: 1,
          title: 'replica read-only',
        }),
        f({
          severity: 'info',
          category: 'performance',
          metric: 'query_duration_p95',
          value: 1200,
          title: 'p95 elevated',
        }),
      ],
    ],
    expect: (c) => expect(c).toHaveLength(4),
  },
  {
    name: 'regenerated snapshot dedups every card (idempotent cron)',
    host: 0,
    batches: [
      [
        f({ severity: 'warning', metric: 'max_active_parts', title: 'A' }),
        f({ severity: 'warning', metric: 'error_rate', title: 'B' }),
      ],
      [
        f({ severity: 'critical', metric: 'max_active_parts', title: 'A' }),
        f({ severity: 'critical', metric: 'error_rate', title: 'B' }),
      ],
    ],
    expect: (c) => expect(c).toHaveLength(2),
    parityMode: 'keys',
  },
  {
    name: 'whitespace-only detail preserved as empty-ish',
    host: 0,
    batches: [[f({ metric: 'm', title: 't', detail: '' })]],
    expect: (c) => expect(c[0].detail).toBe(''),
  },
  {
    name: 'high host id',
    host: 7,
    batches: [[f({ metric: 'm', title: 'host7' })]],
    expect: (c) => {
      expect(c).toHaveLength(1)
      expect(c[0].title).toBe('host7')
    },
  },
  {
    name: 'twenty insights stay under default limit',
    host: 0,
    batches: [
      Array.from({ length: 20 }, (_, i) =>
        f({ metric: `k${i}`, title: `n${i}` })
      ),
    ],
    expect: (c) => expect(c).toHaveLength(20),
  },
  {
    name: 'newline / quote characters in detail survive',
    host: 0,
    batches: [
      [
        f({
          metric: 'm',
          title: 't',
          detail: 'line1\nline2 "quoted" \'apostrophe\'',
        }),
      ],
    ],
    expect: (c) =>
      expect(c[0].detail).toBe('line1\nline2 "quoted" \'apostrophe\''),
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// The battery: contract + parity, per scenario per backend.
// ─────────────────────────────────────────────────────────────────────────────
describe('InsightsStore realistic-scenario battery', () => {
  for (const s of SCENARIOS) {
    for (const backend of BACKENDS) {
      test(`[${backend.name}] ${s.name}`, async () => {
        const cards = await runBackend(backend, s.host, s.batches)
        s.expect(cards)
      })
    }

    test(`[parity] ${s.name}`, async () => {
      const results: Record<string, CanonicalCard[]> = {}
      for (const backend of BACKENDS) {
        // fresh fakes per backend run so they don't share state
        resetFakes()
        results[backend.name] = await runBackend(backend, s.host, s.batches)
      }
      // 'keys' mode compares only the surviving key set (see Scenario.parityMode);
      // 'full' (default) compares the entire canonical card.
      const project = (cards: CanonicalCard[]) =>
        s.parityMode === 'keys'
          ? JSON.stringify(cards.map((c) => c.key).sort())
          : JSON.stringify(cards)

      const reference = project(results.memory)
      for (const backend of BACKENDS) {
        expect(
          project(results[backend.name]),
          `${backend.name} must match memory for "${s.name}"`
        ).toBe(reference)
      }
    })
  }
})
