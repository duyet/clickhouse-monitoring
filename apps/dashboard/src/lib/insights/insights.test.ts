import type { InsightCard } from './types'

import {
  dismissAllInsights,
  dismissInsight,
  filterActiveInsights,
  getDismissedInsights,
  isInsightDismissed,
} from './dismissed-insights'
import { insightKey } from './types'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

// ── In-memory localStorage + window shim (bun has no DOM by default) ──
class MemoryStorage {
  private store = new Map<string, string>()
  getItem(k: string) {
    return this.store.has(k) ? (this.store.get(k) as string) : null
  }
  setItem(k: string, v: string) {
    this.store.set(k, String(v))
  }
  removeItem(k: string) {
    this.store.delete(k)
  }
  clear() {
    this.store.clear()
  }
}

beforeEach(() => {
  ;(globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage()
  ;(globalThis as { window?: unknown }).window = globalThis
})
afterEach(() => {
  ;(globalThis as { localStorage?: unknown }).localStorage = undefined
  ;(globalThis as { window?: unknown }).window = undefined
})

const card = (over: Partial<InsightCard> = {}): InsightCard => ({
  severity: 'warning',
  category: 'anomaly',
  title: 'Error rate climbing',
  detail: 'detail',
  metric: 'error_rate',
  key: insightKey(0, {
    category: 'anomaly',
    metric: 'error_rate',
    title: 'Error rate climbing',
  }),
  ...over,
})

describe('insightKey', () => {
  test('is stable for the same host/category/metric/title', () => {
    const a = insightKey(0, {
      category: 'storage',
      metric: 'max_active_parts',
      title: 'X is fragmented',
    })
    const b = insightKey(0, {
      category: 'storage',
      metric: 'max_active_parts',
      title: 'X is fragmented',
    })
    expect(a).toBe(b)
  })

  test('differs across hosts and metrics', () => {
    const base = { category: 'anomaly', metric: 'error_rate', title: 'T' }
    expect(insightKey(0, base)).not.toBe(insightKey(1, base))
    expect(insightKey(0, base)).not.toBe(
      insightKey(0, { ...base, metric: 'memory_usage' })
    )
  })

  test('tolerates a missing metric', () => {
    expect(insightKey(0, { category: 'c', title: 't' })).toBe('0:c::t')
  })
})

describe('dismissed insights', () => {
  test('dismiss hides a single insight and persists', () => {
    const c = card()
    expect(isInsightDismissed(c.key)).toBe(false)
    dismissInsight(c)
    expect(isInsightDismissed(c.key)).toBe(true)
    expect(getDismissedInsights().has(c.key)).toBe(true)
  })

  test('filterActiveInsights drops dismissed cards only', () => {
    const a = card({ key: 'k:a' })
    const b = card({ key: 'k:b', title: 'Other' })
    dismissInsight(a)
    const active = filterActiveInsights([a, b])
    expect(active).toHaveLength(1)
    expect(active[0].key).toBe('k:b')
  })

  test('dismissAll hides every provided insight', () => {
    const a = card({ key: 'k:a' })
    const b = card({ key: 'k:b' })
    dismissAllInsights([a, b])
    expect(filterActiveInsights([a, b])).toHaveLength(0)
  })
})
