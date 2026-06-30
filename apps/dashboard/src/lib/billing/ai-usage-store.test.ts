/**
 * Unit tests for ai-usage-store.ts
 *
 * Uses a minimal in-memory D1 fake injected via mock.module('@chm/platform')
 * — the same pattern as src/lib/insights/store/d1-store.test.ts — so the
 * store's real SQL is exercised without requiring a Cloudflare Workers runtime.
 */

import { beforeEach, describe, expect, mock, test } from 'bun:test'

// ---------------------------------------------------------------------------
// In-memory D1 fake
// ---------------------------------------------------------------------------

/** Keyed by "owner_id::day" → count */
type UsageStore = Map<string, number>

function makeFakeD1(store: UsageStore) {
  function prepare(sql: string) {
    const isSelect = sql.trimStart().toUpperCase().startsWith('SELECT')

    return {
      bind(...values: unknown[]) {
        const ownerId = values[0] as string
        const day = values[1] as string
        const key = `${ownerId}::${day}`

        return {
          async first<T>() {
            if (!isSelect) return null
            const count = store.get(key)
            if (count == null) return null
            return { count } as unknown as T
          },
          async run() {
            if (!isSelect) {
              // INSERT ... ON CONFLICT DO UPDATE SET count = count + 1
              store.set(key, (store.get(key) ?? 0) + 1)
            }
            return { success: true, results: [], meta: {} }
          },
        }
      },
    }
  }

  return { prepare }
}

// ---------------------------------------------------------------------------
// Inject via mocked platform (must happen before any import of the SUT)
// ---------------------------------------------------------------------------

let currentDb: ReturnType<typeof makeFakeD1> | null = null

mock.module('@chm/platform', () => ({
  getPlatformBindings: () => ({
    getD1Database: () => currentDb,
    getDurableObjectNamespace: () => null,
  }),
}))

// Dynamic import so the mock is already in place when the module initialises.
const { utcDayKey, getAiUsageToday, incrementAiUsage } = await import(
  './ai-usage-store'
)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const FIXED_DATE = new Date('2025-03-15T10:30:00Z')

describe('utcDayKey (pure)', () => {
  test('formats a known UTC date correctly', () => {
    expect(utcDayKey(new Date('2025-01-01T00:00:00Z'))).toBe('2025-01-01')
    expect(utcDayKey(new Date('2025-12-31T23:59:59Z'))).toBe('2025-12-31')
    expect(utcDayKey(new Date('2025-03-15T10:30:00Z'))).toBe('2025-03-15')
  })

  test('returns the current UTC date when called without args', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(utcDayKey()).toBe(today)
  })
})

describe('getAiUsageToday', () => {
  beforeEach(() => {
    currentDb = makeFakeD1(new Map())
  })

  test('returns 0 when no row exists', async () => {
    expect(await getAiUsageToday('user_abc', FIXED_DATE)).toBe(0)
  })

  test('returns 0 when D1 binding is unavailable', async () => {
    currentDb = null
    expect(await getAiUsageToday('user_abc', FIXED_DATE)).toBe(0)
  })
})

describe('incrementAiUsage + getAiUsageToday round-trip', () => {
  let store: UsageStore

  beforeEach(() => {
    store = new Map()
    currentDb = makeFakeD1(store)
  })

  test('count goes 0 → 1 after a single increment', async () => {
    expect(await getAiUsageToday('user_abc', FIXED_DATE)).toBe(0)
    await incrementAiUsage('user_abc', FIXED_DATE)
    expect(await getAiUsageToday('user_abc', FIXED_DATE)).toBe(1)
  })

  test('count accumulates across multiple increments', async () => {
    for (let i = 0; i < 5; i++) {
      await incrementAiUsage('user_xyz', FIXED_DATE)
    }
    expect(await getAiUsageToday('user_xyz', FIXED_DATE)).toBe(5)
  })

  test('different owners are isolated', async () => {
    await incrementAiUsage('user_a', FIXED_DATE)
    await incrementAiUsage('user_a', FIXED_DATE)
    await incrementAiUsage('user_b', FIXED_DATE)

    expect(await getAiUsageToday('user_a', FIXED_DATE)).toBe(2)
    expect(await getAiUsageToday('user_b', FIXED_DATE)).toBe(1)
  })

  test('different days are isolated for the same owner', async () => {
    const day1 = new Date('2025-03-14T10:00:00Z')
    const day2 = new Date('2025-03-15T10:00:00Z')

    await incrementAiUsage('user_abc', day1)
    await incrementAiUsage('user_abc', day1)
    await incrementAiUsage('user_abc', day2)

    expect(await getAiUsageToday('user_abc', day1)).toBe(2)
    expect(await getAiUsageToday('user_abc', day2)).toBe(1)
  })

  test('increment is a no-op when D1 binding is unavailable', async () => {
    currentDb = null
    // Must not throw
    await incrementAiUsage('user_abc', FIXED_DATE)
  })
})
