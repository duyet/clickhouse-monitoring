/**
 * Tests for the client-side localStorage cache for AI insights.
 *
 * Covers: save/load/clear, TTL expiry, malformed JSON fallback, SSR guard.
 * Uses a simple in-memory localStorage mock injected via globalThis.
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import {
  clearCachedInsights,
  loadCachedInsights,
  saveCachedInsights,
} from './cached-insights'
import type { InsightCard } from './types'

// ---------------------------------------------------------------------------
// Minimal in-memory localStorage mock
// ---------------------------------------------------------------------------

function makeLocalStorageMock() {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k]
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    // expose internal store for test assertions
    _store: store,
  }
}

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const makeCard = (overrides: Partial<InsightCard> = {}): InsightCard => ({
  key: 'host0:performance:query_time:Slow queries',
  severity: 'warning',
  category: 'performance',
  title: 'Slow queries',
  detail: 'P99 query latency is above 5 s.',
  ...overrides,
})

const CARDS: InsightCard[] = [
  makeCard(),
  makeCard({
    key: 'host0:storage:disk:Disk usage',
    category: 'storage',
    title: 'Disk usage',
    detail: 'Disk usage above 80 %.',
  }),
]

// ---------------------------------------------------------------------------
// Test setup / teardown
// ---------------------------------------------------------------------------

let mockStorage: ReturnType<typeof makeLocalStorageMock>
let originalWindow: typeof globalThis.window

beforeEach(() => {
  mockStorage = makeLocalStorageMock()
  // Make window defined so SSR guard is satisfied
  if (typeof window === 'undefined') {
    ;(globalThis as unknown as Record<string, unknown>).window = {}
  }
  ;(globalThis as unknown as Record<string, unknown>).localStorage =
    mockStorage as unknown as Storage
})

afterEach(() => {
  // Restore window if we added it
  if (originalWindow === undefined) {
    delete (globalThis as unknown as Record<string, unknown>).window
  }
  delete (globalThis as unknown as Record<string, unknown>).localStorage
})

// ---------------------------------------------------------------------------
// saveCachedInsights
// ---------------------------------------------------------------------------

describe('saveCachedInsights', () => {
  it('persists insights under the correct localStorage key', () => {
    saveCachedInsights(0, CARDS)
    const raw = mockStorage.getItem('ai-insights-cache:0')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.insights).toHaveLength(2)
    expect(parsed.insights[0].key).toBe(CARDS[0].key)
  })

  it('stores a savedAt timestamp close to Date.now()', () => {
    const before = Date.now()
    saveCachedInsights(1, CARDS)
    const after = Date.now()
    const raw = mockStorage.getItem('ai-insights-cache:1')
    const parsed = JSON.parse(raw!)
    expect(parsed.savedAt).toBeGreaterThanOrEqual(before)
    expect(parsed.savedAt).toBeLessThanOrEqual(after)
  })

  it('stores a defensive copy (mutations after save do not affect stored data)', () => {
    const mutable: InsightCard[] = [makeCard()]
    saveCachedInsights(0, mutable)
    // mutate original array
    mutable.push(makeCard({ key: 'new', title: 'extra' }))
    const raw = mockStorage.getItem('ai-insights-cache:0')
    const parsed = JSON.parse(raw!)
    expect(parsed.insights).toHaveLength(1)
  })

  it('silently ignores errors when localStorage.setItem throws', () => {
    const throwingStorage = {
      ...mockStorage,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    ;(globalThis as unknown as Record<string, unknown>).localStorage =
      throwingStorage as unknown as Storage

    // Must not throw
    expect(() => saveCachedInsights(0, CARDS)).not.toThrow()
  })

  it('uses separate keys per hostId', () => {
    saveCachedInsights(0, [CARDS[0]])
    saveCachedInsights(1, [CARDS[1]])
    const raw0 = JSON.parse(mockStorage.getItem('ai-insights-cache:0')!)
    const raw1 = JSON.parse(mockStorage.getItem('ai-insights-cache:1')!)
    expect(raw0.insights[0].key).toBe(CARDS[0].key)
    expect(raw1.insights[0].key).toBe(CARDS[1].key)
  })
})

// ---------------------------------------------------------------------------
// loadCachedInsights
// ---------------------------------------------------------------------------

describe('loadCachedInsights', () => {
  it('returns empty array when no entry exists', () => {
    expect(loadCachedInsights(0)).toEqual([])
  })

  it('returns the saved insights when fresh', () => {
    saveCachedInsights(0, CARDS)
    const result = loadCachedInsights(0)
    expect(result).toHaveLength(2)
    expect(result[0].key).toBe(CARDS[0].key)
  })

  it('returns empty array when entry is older than 7 days', () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    const oldEntry = {
      insights: CARDS,
      savedAt: Date.now() - sevenDaysMs - 1, // just past the TTL
    }
    mockStorage.setItem('ai-insights-cache:0', JSON.stringify(oldEntry))
    expect(loadCachedInsights(0)).toEqual([])
  })

  it('returns insights when entry is exactly within the 7-day window', () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    const freshEnoughEntry = {
      insights: CARDS,
      savedAt: Date.now() - sevenDaysMs + 1000, // 1 second before expiry
    }
    mockStorage.setItem('ai-insights-cache:0', JSON.stringify(freshEnoughEntry))
    expect(loadCachedInsights(0)).toHaveLength(2)
  })

  it('returns empty array for malformed JSON', () => {
    mockStorage.setItem('ai-insights-cache:0', 'not-json{{{')
    expect(loadCachedInsights(0)).toEqual([])
  })

  it('returns empty array when insights field is not an array', () => {
    mockStorage.setItem(
      'ai-insights-cache:0',
      JSON.stringify({ insights: 'oops', savedAt: Date.now() })
    )
    expect(loadCachedInsights(0)).toEqual([])
  })

  it('returns empty array when savedAt is not a number', () => {
    mockStorage.setItem(
      'ai-insights-cache:0',
      JSON.stringify({ insights: CARDS, savedAt: 'yesterday' })
    )
    expect(loadCachedInsights(0)).toEqual([])
  })

  it('returns empty array when parsed entry is null', () => {
    mockStorage.setItem('ai-insights-cache:0', 'null')
    expect(loadCachedInsights(0)).toEqual([])
  })

  it('returns empty array when localStorage.getItem throws', () => {
    const throwingStorage = {
      ...mockStorage,
      getItem: () => {
        throw new Error('SecurityError')
      },
    }
    ;(globalThis as unknown as Record<string, unknown>).localStorage =
      throwingStorage as unknown as Storage
    expect(loadCachedInsights(0)).toEqual([])
  })

  it('isolates data between different hostIds', () => {
    saveCachedInsights(0, [CARDS[0]])
    saveCachedInsights(1, [CARDS[1]])
    expect(loadCachedInsights(0)[0].key).toBe(CARDS[0].key)
    expect(loadCachedInsights(1)[0].key).toBe(CARDS[1].key)
  })
})

// ---------------------------------------------------------------------------
// clearCachedInsights
// ---------------------------------------------------------------------------

describe('clearCachedInsights', () => {
  it('removes the entry for the given hostId', () => {
    saveCachedInsights(0, CARDS)
    expect(mockStorage.getItem('ai-insights-cache:0')).not.toBeNull()
    clearCachedInsights(0)
    expect(mockStorage.getItem('ai-insights-cache:0')).toBeNull()
  })

  it('does not affect entries for other hostIds', () => {
    saveCachedInsights(0, CARDS)
    saveCachedInsights(1, CARDS)
    clearCachedInsights(0)
    expect(mockStorage.getItem('ai-insights-cache:0')).toBeNull()
    expect(mockStorage.getItem('ai-insights-cache:1')).not.toBeNull()
  })

  it('does not throw when no entry exists for the hostId', () => {
    expect(() => clearCachedInsights(99)).not.toThrow()
  })

  it('silently ignores errors when localStorage.removeItem throws', () => {
    const throwingStorage = {
      ...mockStorage,
      removeItem: () => {
        throw new Error('SecurityError')
      },
    }
    ;(globalThis as unknown as Record<string, unknown>).localStorage =
      throwingStorage as unknown as Storage
    expect(() => clearCachedInsights(0)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// SSR guard (window === undefined)
// ---------------------------------------------------------------------------

describe('SSR guard', () => {
  beforeEach(() => {
    // Remove window to simulate SSR
    originalWindow = (globalThis as unknown as Record<string, unknown>)
      .window as typeof globalThis.window
    delete (globalThis as unknown as Record<string, unknown>).window
  })

  afterEach(() => {
    ;(globalThis as unknown as Record<string, unknown>).window = originalWindow
  })

  it('saveCachedInsights is a no-op when window is undefined', () => {
    expect(() => saveCachedInsights(0, CARDS)).not.toThrow()
    // Storage should not have been touched
    expect(mockStorage._store).toEqual({})
  })

  it('loadCachedInsights returns [] when window is undefined', () => {
    expect(loadCachedInsights(0)).toEqual([])
  })

  it('clearCachedInsights is a no-op when window is undefined', () => {
    // Populate first while window exists — re-enable window temporarily
    ;(globalThis as unknown as Record<string, unknown>).window = {}
    saveCachedInsights(0, CARDS)
    delete (globalThis as unknown as Record<string, unknown>).window

    const rawBefore = mockStorage.getItem('ai-insights-cache:0')
    clearCachedInsights(0) // should be a no-op
    expect(mockStorage.getItem('ai-insights-cache:0')).toBe(rawBefore)
  })
})
