/**
 * Tests for the insight store resolver — the policy core of the pluggable
 * persistence. Verifies the additive-opt-in contract: default `auto` →
 * ClickHouse (unchanged behavior), explicit selections, fallback-to-ClickHouse
 * when a selected backend lacks its prerequisite, unknown values → auto, and
 * the per-env memoization. Construction of every backend is lazy (no network on
 * `new`), so no module mocks are required.
 */

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

// The `d1` branch dynamically imports d1-store → @chm/platform →
// platform-native, which imports the virtual `cloudflare:workers` module. That
// module only resolves under vite/workerd, so stub it (it just re-exports
// `env`). The resolver only reads `store.backend`, never touches a binding.
mock.module('cloudflare:workers', () => ({ env: {} }))

import { resetInsightsStoreCache, resolveInsightsStore } from './resolve-store'

const ENV_KEYS = [
  'INSIGHTS_STORE_BACKEND',
  'DATABASE_URL',
  'AGENTSTATE_API_KEY',
  'AGENTSTATE_BASE_URL',
] as const

const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k]
    delete process.env[k]
  }
  resetInsightsStoreCache()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
  resetInsightsStoreCache()
})

describe('resolveInsightsStore', () => {
  test('defaults to clickhouse when unset (auto)', async () => {
    const store = await resolveInsightsStore()
    expect(store.backend).toBe('clickhouse')
  })

  test('"auto" explicitly resolves to clickhouse', async () => {
    process.env.INSIGHTS_STORE_BACKEND = 'auto'
    expect((await resolveInsightsStore()).backend).toBe('clickhouse')
  })

  test('selects clickhouse / memory / d1 explicitly', async () => {
    process.env.INSIGHTS_STORE_BACKEND = 'clickhouse'
    expect((await resolveInsightsStore()).backend).toBe('clickhouse')

    resetInsightsStoreCache()
    process.env.INSIGHTS_STORE_BACKEND = 'memory'
    expect((await resolveInsightsStore()).backend).toBe('memory')

    resetInsightsStoreCache()
    process.env.INSIGHTS_STORE_BACKEND = 'd1'
    expect((await resolveInsightsStore()).backend).toBe('d1')
  })

  test('case-insensitive and trims the env value', async () => {
    process.env.INSIGHTS_STORE_BACKEND = '  Memory '
    expect((await resolveInsightsStore()).backend).toBe('memory')
  })

  test('postgres requires DATABASE_URL, else falls back to clickhouse', async () => {
    process.env.INSIGHTS_STORE_BACKEND = 'postgres'
    expect((await resolveInsightsStore()).backend).toBe('clickhouse')

    resetInsightsStoreCache()
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db'
    expect((await resolveInsightsStore()).backend).toBe('postgres')
  })

  test('agentstate requires AGENTSTATE_API_KEY, else falls back to clickhouse', async () => {
    process.env.INSIGHTS_STORE_BACKEND = 'agentstate'
    expect((await resolveInsightsStore()).backend).toBe('clickhouse')

    resetInsightsStoreCache()
    process.env.AGENTSTATE_API_KEY = 'as_live_TEST'
    expect((await resolveInsightsStore()).backend).toBe('agentstate')
  })

  test('unknown value falls back to auto (clickhouse)', async () => {
    process.env.INSIGHTS_STORE_BACKEND = 'redis'
    expect((await resolveInsightsStore()).backend).toBe('clickhouse')
  })

  test('memoizes per env value and re-resolves after reset / change', async () => {
    process.env.INSIGHTS_STORE_BACKEND = 'memory'
    const a = await resolveInsightsStore()
    const b = await resolveInsightsStore()
    expect(a).toBe(b) // same instance while env unchanged

    process.env.INSIGHTS_STORE_BACKEND = 'clickhouse'
    // Without reset the resolver keys off the new env value directly.
    const c = await resolveInsightsStore()
    expect(c.backend).toBe('clickhouse')
    expect(c).not.toBe(a)
  })
})
