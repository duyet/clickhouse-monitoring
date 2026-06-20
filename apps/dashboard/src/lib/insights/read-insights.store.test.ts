/**
 * Wiring test: the insight read path now flows through the pluggable
 * InsightsStore resolver instead of calling the ClickHouse findings store
 * directly. Using the in-memory backend (INSIGHTS_STORE_BACKEND=memory) we
 * record findings through the resolved store and assert that readInsights reads
 * them back, de-dupes by stable key (newest wins), derives the card action from
 * metric/category, and orders by severity. This proves the seam end-to-end
 * without a database.
 */

import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test'

// clickhouse-store is statically imported by the resolver; its transitive
// @chm/clickhouse-client import may touch the virtual cloudflare:workers env.
// Stub it — the memory backend never calls the client.
mock.module('cloudflare:workers', () => ({ env: {} }))

import { readInsights } from './read-insights'
import {
  resetInsightsStoreCache,
  resolveInsightsStore,
} from './store/resolve-store'

const saved = process.env.INSIGHTS_STORE_BACKEND

beforeEach(() => {
  process.env.INSIGHTS_STORE_BACKEND = 'memory'
  resetInsightsStoreCache()
})

afterAll(() => {
  if (saved === undefined) delete process.env.INSIGHTS_STORE_BACKEND
  else process.env.INSIGHTS_STORE_BACKEND = saved
  resetInsightsStoreCache()
})

describe('readInsights over a pluggable backend', () => {
  test('reads recorded findings back as insight cards', async () => {
    const store = await resolveInsightsStore()
    expect(store.backend).toBe('memory')

    await store.record(0, [
      {
        severity: 'warning',
        category: 'storage',
        source: 'ai-insight',
        title: 'table X is fragmented',
        detail: 'consider OPTIMIZE',
        metric: 'max_active_parts',
        value: 318,
      },
    ])

    const cards = await readInsights(0)
    expect(cards).toHaveLength(1)
    expect(cards[0]).toMatchObject({
      severity: 'warning',
      category: 'storage',
      title: 'table X is fragmented',
      metric: 'max_active_parts',
    })
    // action is re-derived from metric/category on read
    expect(cards[0].action).toEqual({ label: 'View tables', href: '/tables' })
    // stable dismissal key
    expect(cards[0].key).toBe(
      '0:storage:max_active_parts:table X is fragmented'
    )
  })

  test('de-dupes by stable key, newest occurrence wins', async () => {
    const store = await resolveInsightsStore()
    await store.record(0, [
      {
        severity: 'warning',
        category: 'storage',
        source: 'ai-insight',
        title: 'fragmented',
        metric: 'max_active_parts',
        value: 100,
      },
    ])
    await store.record(0, [
      {
        severity: 'critical',
        category: 'storage',
        source: 'ai-insight',
        title: 'fragmented',
        metric: 'max_active_parts',
        value: 400,
      },
    ])

    const cards = await readInsights(0)
    expect(cards).toHaveLength(1)
    expect(cards[0].value).toBe(400) // newest write wins
    expect(cards[0].severity).toBe('critical')
  })

  test('orders cards by severity (critical → warning → info)', async () => {
    const store = await resolveInsightsStore()
    await store.record(0, [
      {
        severity: 'info',
        category: 'anomaly',
        source: 'ai-insight',
        title: 'i',
        metric: 'a',
      },
      {
        severity: 'critical',
        category: 'anomaly',
        source: 'ai-insight',
        title: 'c',
        metric: 'b',
      },
      {
        severity: 'warning',
        category: 'anomaly',
        source: 'ai-insight',
        title: 'w',
        metric: 'c',
      },
    ])
    const cards = await readInsights(0)
    expect(cards.map((c) => c.severity)).toEqual([
      'critical',
      'warning',
      'info',
    ])
  })

  test('ignores rows whose source is not an insight source', async () => {
    const store = await resolveInsightsStore()
    await store.record(0, [
      {
        severity: 'info',
        category: 'storage',
        source: 'health-sweep',
        title: 'not-an-insight',
      },
    ])
    expect(await readInsights(0)).toHaveLength(0)
  })
})
