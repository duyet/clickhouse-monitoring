/**
 * Retention enforcement tests.
 *
 * Tests the pure helpers (retentionCutoffMs / isWithinRetention) and the
 * MemoryStore sinceMs read-filter using the real plan data from @chm/pricing.
 */

import { MemoryStore } from '../conversation-store/memory-store'
import { isWithinRetention, retentionCutoffMs } from './entitlements'
import { getPlan } from './plans'
import { beforeEach, describe, expect, test } from 'bun:test'

// ─────────────────────────────────────────────────────────────────────────────
// Plans
// ─────────────────────────────────────────────────────────────────────────────

const freePlan = getPlan('free') // retentionDays: 7
const proPlan = getPlan('pro') // retentionDays: 30
const maxPlan = getPlan('max') // retentionDays: 90
const enterprisePlan = getPlan('enterprise') // retentionDays: null (unlimited)

// ─────────────────────────────────────────────────────────────────────────────
// retentionCutoffMs
// ─────────────────────────────────────────────────────────────────────────────

describe('retentionCutoffMs', () => {
  const NOW = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000

  test('free → 7-day cutoff', () => {
    const cutoff = retentionCutoffMs(freePlan, NOW)
    expect(cutoff).not.toBeNull()
    expect(cutoff).toBe(NOW - 7 * DAY_MS)
  })

  test('pro → 30-day cutoff', () => {
    const cutoff = retentionCutoffMs(proPlan, NOW)
    expect(cutoff).not.toBeNull()
    expect(cutoff).toBe(NOW - 30 * DAY_MS)
  })

  test('max → 90-day cutoff', () => {
    const cutoff = retentionCutoffMs(maxPlan, NOW)
    expect(cutoff).not.toBeNull()
    expect(cutoff).toBe(NOW - 90 * DAY_MS)
  })

  test('enterprise → null (unlimited)', () => {
    expect(retentionCutoffMs(enterprisePlan, NOW)).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// isWithinRetention
// ─────────────────────────────────────────────────────────────────────────────

describe('isWithinRetention', () => {
  const NOW = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000

  describe('free plan (7 days)', () => {
    test('timestamp 6 days ago → within retention', () => {
      const ts = NOW - 6 * DAY_MS
      expect(isWithinRetention(freePlan, ts, NOW)).toBe(true)
    })

    test('timestamp 8 days ago → outside retention', () => {
      const ts = NOW - 8 * DAY_MS
      expect(isWithinRetention(freePlan, ts, NOW)).toBe(false)
    })

    test('exactly at the 7-day boundary → within retention', () => {
      const ts = NOW - 7 * DAY_MS
      expect(isWithinRetention(freePlan, ts, NOW)).toBe(true)
    })
  })

  describe('enterprise plan (unlimited)', () => {
    test('any timestamp → always within retention', () => {
      const veryOld = NOW - 365 * 10 * DAY_MS // 10 years ago
      expect(isWithinRetention(enterprisePlan, veryOld, NOW)).toBe(true)
    })

    test('retentionCutoffMs returns null', () => {
      expect(retentionCutoffMs(enterprisePlan, NOW)).toBeNull()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// MemoryStore.list sinceMs read-filter
// ─────────────────────────────────────────────────────────────────────────────

describe('MemoryStore.list sinceMs filter', () => {
  const USER = 'user-retention-test'
  const NOW = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000

  beforeEach(async () => {
    MemoryStore.clearAll()
    const store = new MemoryStore()

    // Insert a recent conversation (2 days ago)
    await store.upsert({
      id: 'conv-recent',
      userId: USER,
      title: 'Recent',
      messages: [],
      createdAt: NOW - 2 * DAY_MS,
      updatedAt: NOW - 2 * DAY_MS,
      messageCount: 0,
    })

    // Insert an old conversation (10 days ago)
    await store.upsert({
      id: 'conv-old',
      userId: USER,
      title: 'Old',
      messages: [],
      createdAt: NOW - 10 * DAY_MS,
      updatedAt: NOW - 10 * DAY_MS,
      messageCount: 0,
    })
  })

  test('without sinceMs → returns both conversations', async () => {
    const store = new MemoryStore()
    const results = await store.list(USER)
    expect(results.length).toBe(2)
  })

  test('with free-plan cutoff (7 days) → excludes the 10-day-old row', async () => {
    const store = new MemoryStore()
    const cutoff = retentionCutoffMs(freePlan, NOW)!
    const results = await store.list(USER, 50, cutoff)
    expect(results.length).toBe(1)
    expect(results[0].id).toBe('conv-recent')
  })

  test('with enterprise (null cutoff) → no sinceMs applied, both rows returned', async () => {
    const store = new MemoryStore()
    const cutoff = retentionCutoffMs(enterprisePlan, NOW) // null
    const results = await store.list(USER, 50, cutoff ?? undefined)
    expect(results.length).toBe(2)
  })

  test('sinceMs that excludes all → empty list', async () => {
    const store = new MemoryStore()
    const futureCutoff = NOW + DAY_MS // everything is "too old"
    const results = await store.list(USER, 50, futureCutoff)
    expect(results.length).toBe(0)
  })
})
