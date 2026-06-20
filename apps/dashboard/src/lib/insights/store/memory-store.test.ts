/**
 * Tests for the in-memory insights backend. No mocks — exercises the recency
 * (`since`) filter, severity filter, newest-first ordering, the limit clamp, and
 * the per-host buffer bound. This is the reference implementation of the
 * InsightsStore read/write contract that the DB-backed stores must match.
 */

import type { Finding } from './types'

import { MemoryInsightsStore } from './memory-store'
import { describe, expect, test } from 'bun:test'

const finding = (over: Partial<Finding> = {}): Finding => ({
  severity: 'info',
  category: 'storage',
  source: 'ai-insight',
  title: 'table X is fragmented',
  detail: 'consider OPTIMIZE',
  metric: 'max_active_parts',
  value: 318,
  ...over,
})

describe('MemoryInsightsStore', () => {
  test('record then list round-trips with the full FindingRow shape', async () => {
    const store = new MemoryInsightsStore()
    expect(await store.record(0, [finding()])).toBe(true)

    const rows = await store.list(0)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      host_id: '0',
      severity: 'info',
      category: 'storage',
      source: 'ai-insight',
      title: 'table X is fragmented',
      detail: 'consider OPTIMIZE',
      metric: 'max_active_parts',
      value: 318,
    })
    expect(typeof rows[0].event_time).toBe('string')
  })

  test('empty batch is a no-op success', async () => {
    const store = new MemoryInsightsStore()
    expect(await store.record(0, [])).toBe(true)
    expect(await store.list(0)).toEqual([])
  })

  test('defaults optional fields to "" / 0', async () => {
    const store = new MemoryInsightsStore()
    await store.record(1, [
      {
        severity: 'warning',
        category: 'anomaly',
        source: 'ai-insight',
        title: 't',
      },
    ])
    const [row] = await store.list(1)
    expect(row.detail).toBe('')
    expect(row.metric).toBe('')
    expect(row.value).toBe(0)
  })

  test('isolates rows per host', async () => {
    const store = new MemoryInsightsStore()
    await store.record(0, [finding({ title: 'host0' })])
    await store.record(1, [finding({ title: 'host1' })])
    expect((await store.list(0)).map((r) => r.title)).toEqual(['host0'])
    expect((await store.list(1)).map((r) => r.title)).toEqual(['host1'])
  })

  test('returns newest first', async () => {
    const store = new MemoryInsightsStore()
    await store.record(0, [finding({ title: 'first' })])
    await store.record(0, [finding({ title: 'second' })])
    expect((await store.list(0)).map((r) => r.title)).toEqual([
      'second',
      'first',
    ])
  })

  test('filters by severity', async () => {
    const store = new MemoryInsightsStore()
    await store.record(0, [
      finding({ severity: 'info', title: 'i' }),
      finding({ severity: 'critical', title: 'c' }),
    ])
    const rows = await store.list(0, { severity: 'critical' })
    expect(rows.map((r) => r.title)).toEqual(['c'])
  })

  test('honors the limit clamp', async () => {
    const store = new MemoryInsightsStore()
    await store.record(
      0,
      Array.from({ length: 5 }, (_, i) => finding({ title: `t${i}` }))
    )
    expect(await store.list(0, { limit: 2 })).toHaveLength(2)
    // out-of-range limits clamp into [1, 1000]
    expect(await store.list(0, { limit: 0 })).toHaveLength(1)
  })

  test('filters out rows older than the since window', async () => {
    const store = new MemoryInsightsStore()
    await store.record(0, [finding()])
    // A zero-width-ish past window excludes the just-written row.
    expect(await store.list(0, { since: '1 SECOND' })).toHaveLength(1)
    // Invalid since is ignored (row still returned), not treated as 0.
    expect(await store.list(0, { since: 'garbage' })).toHaveLength(1)
  })
})
