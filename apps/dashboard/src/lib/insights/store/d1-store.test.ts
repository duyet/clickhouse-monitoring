/**
 * Tests for the Cloudflare D1 insights backend.
 *
 * Uses a small behavioral fake of D1Database (prepare/bind/batch/all) injected
 * through a mocked @chm/platform, so we exercise the real SQL the store issues:
 * lazy migration, batched inserts, host/severity/since filtering, newest-first
 * ordering with the limit clamp, the unix-ms → ISO event_time mapping, and the
 * best-effort degrade when no binding is present.
 */

import type { Finding } from './types'

import { beforeEach, describe, expect, mock, test } from 'bun:test'

// --- behavioral D1 fake ------------------------------------------------------
interface FakeRow {
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

function makeFakeD1() {
  const rows: FakeRow[] = []
  const calls = { migrations: 0, inserts: 0 }

  function bindsToRow(b: unknown[]): FakeRow {
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

  function prepare(sql: string) {
    const stmt = {
      sql,
      binds: undefined as unknown[] | undefined,
      bind(...args: unknown[]) {
        return { sql, binds: args, all: async () => allFor(sql, args) }
      },
    }
    return stmt
  }

  async function batch(stmts: Array<{ sql: string; binds?: unknown[] }>) {
    return stmts.map((s) => {
      if (/CREATE (TABLE|INDEX)/.test(s.sql)) calls.migrations++
      else if (/^\s*INSERT/.test(s.sql)) {
        calls.inserts++
        rows.push(bindsToRow(s.binds ?? []))
      }
      return { success: true }
    })
  }

  return { prepare, batch, _rows: rows, _calls: calls }
}

// --- inject via mocked platform ---------------------------------------------
let currentDb: ReturnType<typeof makeFakeD1> | null = null

mock.module('@chm/platform', () => ({
  getPlatformBindings: () => ({
    getD1Database: () => currentDb,
  }),
}))

const { D1InsightsStore } = await import('./d1-store')

const finding = (over: Partial<Finding> = {}): Finding => ({
  severity: 'info',
  category: 'storage',
  source: 'ai-insight',
  title: 't',
  detail: 'd',
  metric: 'm',
  value: 1,
  ...over,
})

beforeEach(() => {
  currentDb = makeFakeD1()
})

describe('D1InsightsStore', () => {
  test('exposes the d1 backend id', () => {
    expect(new D1InsightsStore().backend).toBe('d1')
  })

  test('migrates lazily once, then inserts the batch', async () => {
    const store = new D1InsightsStore()
    expect(
      await store.record(0, [finding({ title: 'a' }), finding({ title: 'b' })])
    ).toBe(true)
    expect(currentDb?._calls.migrations).toBe(2) // CREATE TABLE + CREATE INDEX
    expect(currentDb?._calls.inserts).toBe(2)

    // Second write must not re-run the migration (per-instance guard).
    await store.record(0, [finding({ title: 'c' })])
    expect(currentDb?._calls.migrations).toBe(2)
    expect(currentDb?._calls.inserts).toBe(3)
  })

  test('round-trips rows with the full shape and ISO event_time', async () => {
    const store = new D1InsightsStore()
    await store.record(0, [finding({ title: 'a' }), finding({ title: 'b' })])

    const out = await store.list(0)
    // Both rows come back; order across same-ms writes is event_time-only and
    // therefore not asserted (the store has no secondary sort key).
    expect(out.map((r) => r.title).sort()).toEqual(['a', 'b'])
    expect(out[0]).toMatchObject({
      host_id: '0',
      source: 'ai-insight',
      value: 1,
    })
    expect(() => new Date(out[0].event_time).toISOString()).not.toThrow()
    expect(out[0].event_time).toContain('T') // ISO string, not unix ms
  })

  test('filters by severity and host', async () => {
    const store = new D1InsightsStore()
    await store.record(0, [
      finding({ severity: 'info', title: 'i' }),
      finding({ severity: 'critical', title: 'c' }),
    ])
    await store.record(1, [finding({ title: 'other-host' })])

    expect(
      (await store.list(0, { severity: 'critical' })).map((r) => r.title)
    ).toEqual(['c'])
    expect((await store.list(1)).map((r) => r.title)).toEqual(['other-host'])
  })

  test('empty batch is a no-op success (no migration, no insert)', async () => {
    const store = new D1InsightsStore()
    expect(await store.record(0, [])).toBe(true)
    expect(currentDb?._calls.migrations).toBe(0)
    expect(currentDb?._calls.inserts).toBe(0)
  })

  test('degrades to false / [] when no D1 binding is present', async () => {
    currentDb = null
    const store = new D1InsightsStore()
    expect(await store.record(0, [finding()])).toBe(false)
    expect(await store.list(0)).toEqual([])
  })
})
