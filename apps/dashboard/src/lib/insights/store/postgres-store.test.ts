/**
 * Tests for the PostgreSQL insights backend.
 *
 * The `postgres` package is a callable tagged-template (`sql\`...\``) that also
 * acts as a helper (`sql(rows)`) and exposes `sql.unsafe(ddl)`. We mock it with
 * a fake that distinguishes those three call shapes, so we can assert: the
 * connection-string guard, lazy one-time migration, the insert path, the
 * unix-ms → ISO and string-numeric → number mapping on read, and best-effort
 * degrade when a query rejects.
 */

import type { Finding } from './types'

import { beforeEach, describe, expect, mock, test } from 'bun:test'

// --- behavioral `postgres` fake ---------------------------------------------
let nextRows: Array<Record<string, unknown>> = []
let migrations = 0
let failTemplates = false

function isTemplate(args: unknown[]): boolean {
  return Array.isArray(args[0]) && 'raw' in (args[0] as object)
}

function makeSql() {
  function sql(...args: unknown[]): unknown {
    if (!isTemplate(args)) {
      // Helper form `sql(rows)` → opaque fragment, embedded into a template.
      return { __fragment: true }
    }
    const text = (args[0] as string[]).join(' ')
    // Only the composed top-level queries execute; embedded conditional
    // fragments (`sql`AND ...`` / empty `sql``) never run on their own, so they
    // must not reject (doing so would create unhandled rejections).
    const isQuery = /SELECT|INSERT/i.test(text)
    if (failTemplates && isQuery) {
      return Promise.reject(new Error('pg query failed'))
    }
    return Promise.resolve(/SELECT/i.test(text) ? nextRows : [])
  }
  sql.unsafe = async () => {
    migrations++
    return []
  }
  return sql
}

let currentSql = makeSql()

mock.module('postgres', () => ({
  default: (_url?: string, _opts?: unknown) => currentSql,
}))

const { PostgresInsightsStore } = await import('./postgres-store')

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
  nextRows = []
  migrations = 0
  failTemplates = false
  currentSql = makeSql()
})

describe('PostgresInsightsStore', () => {
  test('exposes the postgres backend id', () => {
    expect(new PostgresInsightsStore('postgres://x').backend).toBe('postgres')
  })

  test('throws if no connection string is available', () => {
    const saved = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    expect(() => new PostgresInsightsStore()).toThrow(/DATABASE_URL/)
    if (saved !== undefined) process.env.DATABASE_URL = saved
  })

  test('migrates lazily exactly once across multiple writes', async () => {
    const store = new PostgresInsightsStore('postgres://x')
    expect(await store.record(0, [finding()])).toBe(true)
    expect(migrations).toBe(1)
    expect(await store.record(0, [finding()])).toBe(true)
    expect(migrations).toBe(1) // initialized guard prevents re-migration
  })

  test('empty batch is a no-op success', async () => {
    const store = new PostgresInsightsStore('postgres://x')
    expect(await store.record(0, [])).toBe(true)
    expect(migrations).toBe(0)
  })

  test('list maps driver rows (string numerics, ms event_time) to FindingRow', async () => {
    nextRows = [
      {
        event_time: 1781900000000,
        host_id: '0',
        severity: 'critical',
        category: 'anomaly',
        source: 'ai-insight',
        title: 'spike',
        detail: '',
        metric: 'error_rate',
        value: '5', // postgres returns DOUBLE PRECISION as string
      },
    ]
    const store = new PostgresInsightsStore('postgres://x')
    const [row] = await store.list(0, { since: '6 HOUR', severity: 'critical' })
    expect(row.value).toBe(5) // coerced to number
    expect(typeof row.value).toBe('number')
    expect(row.event_time).toBe(new Date(1781900000000).toISOString())
    expect(row.title).toBe('spike')
  })

  test('degrades to false / [] when a query rejects', async () => {
    const store = new PostgresInsightsStore('postgres://x')
    failTemplates = true
    expect(await store.record(0, [finding()])).toBe(false)
    expect(await store.list(0)).toEqual([])
  })
})
