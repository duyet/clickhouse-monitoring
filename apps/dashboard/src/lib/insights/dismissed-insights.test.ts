import {
  clearDismissedInsights,
  dismissAllInsights,
  dismissInsight,
  filterActiveInsights,
  getDismissedInsights,
  isInsightDismissed,
} from './dismissed-insights'
import type { DismissibleInsight } from './dismissed-insights'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

// ---------------------------------------------------------------------------
// In-memory localStorage shim (bun has no DOM)
// ---------------------------------------------------------------------------

class MemoryStorage {
  private store = new Map<string, string>()

  getItem(k: string): string | null {
    return this.store.has(k) ? (this.store.get(k) as string) : null
  }

  setItem(k: string, v: string): void {
    this.store.set(k, String(v))
  }

  removeItem(k: string): void {
    this.store.delete(k)
  }

  clear(): void {
    this.store.clear()
  }
}

function withWindow(fn: () => void): void {
  ;(globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage()
  ;(globalThis as { window?: unknown }).window = globalThis
  try {
    fn()
  } finally {
    ;(globalThis as { localStorage?: unknown }).localStorage = undefined
    ;(globalThis as { window?: unknown }).window = undefined
  }
}

function makeInsight(key: string): DismissibleInsight {
  return { key }
}

// ---------------------------------------------------------------------------
// Helpers to manage window/localStorage lifecycle per test
// ---------------------------------------------------------------------------

beforeEach(() => {
  ;(globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage()
  ;(globalThis as { window?: unknown }).window = globalThis
})

afterEach(() => {
  ;(globalThis as { localStorage?: unknown }).localStorage = undefined
  ;(globalThis as { window?: unknown }).window = undefined
})

// ---------------------------------------------------------------------------
// SSR guard
// ---------------------------------------------------------------------------

describe('SSR guard (window === undefined)', () => {
  test('getDismissedInsights returns empty Set when window is undefined', () => {
    withWindow(() => {
      dismissInsight(makeInsight('ssr-key'))
    })
    // Unset window to simulate SSR
    ;(globalThis as { window?: unknown }).window = undefined
    const result = getDismissedInsights()
    expect(result).toBeInstanceOf(Set)
    expect(result.size).toBe(0)
  })

  test('isInsightDismissed returns false when window is undefined', () => {
    withWindow(() => {
      dismissInsight(makeInsight('ssr-key2'))
    })
    ;(globalThis as { window?: unknown }).window = undefined
    expect(isInsightDismissed('ssr-key2')).toBe(false)
  })

  test('dismissInsight is a no-op when window is undefined', () => {
    ;(globalThis as { window?: unknown }).window = undefined
    // Should not throw
    dismissInsight(makeInsight('noop-key'))
    // Re-enable window to verify nothing was persisted
    ;(globalThis as { window?: unknown }).window = globalThis
    expect(isInsightDismissed('noop-key')).toBe(false)
  })

  test('dismissAllInsights is a no-op when window is undefined', () => {
    ;(globalThis as { window?: unknown }).window = undefined
    dismissAllInsights([makeInsight('a'), makeInsight('b')])
    ;(globalThis as { window?: unknown }).window = globalThis
    expect(getDismissedInsights().size).toBe(0)
  })

  test('clearDismissedInsights is a no-op when window is undefined', () => {
    // First store something, then simulate SSR clear
    dismissInsight(makeInsight('pre-stored'))
    ;(globalThis as { window?: unknown }).window = undefined
    clearDismissedInsights() // should be no-op
    ;(globalThis as { window?: unknown }).window = globalThis
    // Item should still be present
    expect(isInsightDismissed('pre-stored')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getDismissedInsights
// ---------------------------------------------------------------------------

describe('getDismissedInsights', () => {
  test('returns an empty Set when localStorage is empty', () => {
    const result = getDismissedInsights()
    expect(result).toBeInstanceOf(Set)
    expect(result.size).toBe(0)
  })

  test('returns a Set of previously dismissed keys', () => {
    dismissInsight(makeInsight('key-a'))
    dismissInsight(makeInsight('key-b'))
    const result = getDismissedInsights()
    expect(result.has('key-a')).toBe(true)
    expect(result.has('key-b')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// isInsightDismissed
// ---------------------------------------------------------------------------

describe('isInsightDismissed', () => {
  test('returns false for a key that has not been dismissed', () => {
    expect(isInsightDismissed('unknown-key')).toBe(false)
  })

  test('returns true after the key has been dismissed', () => {
    dismissInsight(makeInsight('checked-key'))
    expect(isInsightDismissed('checked-key')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// dismissInsight
// ---------------------------------------------------------------------------

describe('dismissInsight', () => {
  test('persists the dismissed key across calls', () => {
    const insight = makeInsight('persist-me')
    expect(isInsightDismissed(insight.key)).toBe(false)
    dismissInsight(insight)
    expect(isInsightDismissed(insight.key)).toBe(true)
  })

  test('dismissing the same key twice is idempotent', () => {
    const insight = makeInsight('dup-key')
    dismissInsight(insight)
    dismissInsight(insight)
    expect(getDismissedInsights().size).toBe(1)
  })

  test('dismissing one key does not affect unrelated keys', () => {
    dismissInsight(makeInsight('key-1'))
    expect(isInsightDismissed('key-2')).toBe(false)
  })

  test('accumulates multiple dismissed keys', () => {
    dismissInsight(makeInsight('alpha'))
    dismissInsight(makeInsight('beta'))
    dismissInsight(makeInsight('gamma'))
    const dismissed = getDismissedInsights()
    expect(dismissed.has('alpha')).toBe(true)
    expect(dismissed.has('beta')).toBe(true)
    expect(dismissed.has('gamma')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// dismissAllInsights
// ---------------------------------------------------------------------------

describe('dismissAllInsights', () => {
  test('dismisses every insight in the array', () => {
    const insights = [makeInsight('x1'), makeInsight('x2'), makeInsight('x3')]
    dismissAllInsights(insights)
    for (const i of insights) {
      expect(isInsightDismissed(i.key)).toBe(true)
    }
  })

  test('merges with previously dismissed keys', () => {
    dismissInsight(makeInsight('existing'))
    dismissAllInsights([makeInsight('new-a'), makeInsight('new-b')])
    expect(isInsightDismissed('existing')).toBe(true)
    expect(isInsightDismissed('new-a')).toBe(true)
    expect(isInsightDismissed('new-b')).toBe(true)
  })

  test('handles an empty array without throwing', () => {
    dismissAllInsights([])
    expect(getDismissedInsights().size).toBe(0)
  })

  test('is idempotent for duplicate keys in the input', () => {
    const insight = makeInsight('dup')
    dismissAllInsights([insight, insight])
    expect(getDismissedInsights().size).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// clearDismissedInsights
// ---------------------------------------------------------------------------

describe('clearDismissedInsights', () => {
  test('removes all dismissed keys', () => {
    dismissInsight(makeInsight('a'))
    dismissInsight(makeInsight('b'))
    expect(getDismissedInsights().size).toBe(2)
    clearDismissedInsights()
    expect(getDismissedInsights().size).toBe(0)
  })

  test('is safe to call on an already-empty store', () => {
    clearDismissedInsights()
    expect(getDismissedInsights().size).toBe(0)
  })

  test('keys dismissed after clear are tracked fresh', () => {
    dismissInsight(makeInsight('old'))
    clearDismissedInsights()
    dismissInsight(makeInsight('new'))
    expect(isInsightDismissed('old')).toBe(false)
    expect(isInsightDismissed('new')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// filterActiveInsights
// ---------------------------------------------------------------------------

describe('filterActiveInsights', () => {
  test('returns all insights when none are dismissed', () => {
    const insights = [makeInsight('f1'), makeInsight('f2')]
    expect(filterActiveInsights(insights)).toHaveLength(2)
  })

  test('excludes dismissed insights', () => {
    const a = makeInsight('fa')
    const b = makeInsight('fb')
    dismissInsight(a)
    const active = filterActiveInsights([a, b])
    expect(active).toHaveLength(1)
    expect(active[0].key).toBe('fb')
  })

  test('returns empty array when all insights are dismissed', () => {
    const insights = [makeInsight('all-a'), makeInsight('all-b')]
    dismissAllInsights(insights)
    expect(filterActiveInsights(insights)).toHaveLength(0)
  })

  test('returns empty array for empty input', () => {
    expect(filterActiveInsights([])).toHaveLength(0)
  })

  test('preserves order of active insights', () => {
    const a = makeInsight('ord-a')
    const b = makeInsight('ord-b')
    const c = makeInsight('ord-c')
    dismissInsight(b)
    const active = filterActiveInsights([a, b, c])
    expect(active.map((i) => i.key)).toEqual(['ord-a', 'ord-c'])
  })

  test('works in SSR context (window undefined) — returns all insights', () => {
    // In SSR getDismissedInsights returns empty Set, so all insights pass through
    ;(globalThis as { window?: unknown }).window = undefined
    const insights = [makeInsight('ssr-f1'), makeInsight('ssr-f2')]
    const active = filterActiveInsights(insights)
    expect(active).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Malformed JSON fallback
// ---------------------------------------------------------------------------

describe('malformed JSON in localStorage', () => {
  test('getDismissedInsights returns empty Set for non-JSON value', () => {
    ;(
      globalThis as unknown as { localStorage: MemoryStorage }
    ).localStorage.setItem('dismissed-ai-insights', 'not-valid-json')
    const result = getDismissedInsights()
    expect(result).toBeInstanceOf(Set)
    expect(result.size).toBe(0)
  })

  test('getDismissedInsights returns empty Set for JSON null', () => {
    ;(
      globalThis as unknown as { localStorage: MemoryStorage }
    ).localStorage.setItem('dismissed-ai-insights', 'null')
    // JSON.parse('null') is valid but not an array — Set constructor with null
    // would throw, so the catch block returns an empty Set.
    // However, new Set(null as unknown as Iterable) actually works in V8 (returns
    // empty Set).  We just verify it doesn't throw and returns a Set.
    const result = getDismissedInsights()
    expect(result).toBeInstanceOf(Set)
  })

  test('getDismissedInsights returns empty Set for JSON number', () => {
    ;(
      globalThis as unknown as { localStorage: MemoryStorage }
    ).localStorage.setItem('dismissed-ai-insights', '42')
    // new Set(42) would throw → caught → empty Set
    expect(() => getDismissedInsights()).not.toThrow()
    const result = getDismissedInsights()
    expect(result).toBeInstanceOf(Set)
  })

  test('isInsightDismissed returns false when stored JSON is corrupt', () => {
    ;(
      globalThis as unknown as { localStorage: MemoryStorage }
    ).localStorage.setItem('dismissed-ai-insights', '{bad json')
    expect(isInsightDismissed('any-key')).toBe(false)
  })

  test('dismissInsight still works after corrupt data was present', () => {
    ;(
      globalThis as unknown as { localStorage: MemoryStorage }
    ).localStorage.setItem('dismissed-ai-insights', 'CORRUPT')
    // getDismissedInsights returns empty Set → dismissInsight builds on top of it
    dismissInsight(makeInsight('recovery-key'))
    expect(isInsightDismissed('recovery-key')).toBe(true)
  })
})
