import { checkHostLimit } from './entitlements'
import {
  CAPABILITY_ENFORCEMENT,
  LIMIT_ENFORCEMENT,
  type LimitKey,
} from './plan-enforcement'
import { describe, expect, test } from 'bun:test'
import {
  BILLING_PLAN_LIST,
  BILLING_PLANS,
  type PlanCapability,
  planAiUsage,
  planAlertRules,
  planHosts,
  planRetention,
  planSeats,
} from '@chm/pricing'

/** Every capability that appears on any plan — the contract surface. */
const usedCapabilities = new Set<PlanCapability>(
  BILLING_PLAN_LIST.flatMap((p) => p.capabilities)
)

describe('plan-enforcement — anti-drift coverage', () => {
  test('every advertised capability is classified', () => {
    for (const cap of usedCapabilities) {
      // If this fails, a capability was added to @chm/pricing without deciding
      // whether/how it is enforced. Classify it in CAPABILITY_ENFORCEMENT.
      expect(CAPABILITY_ENFORCEMENT[cap]).toBeDefined()
    }
  })

  test('every numeric limit is classified', () => {
    const limitKeys: LimitKey[] = [
      'hosts',
      'seats',
      'alertRules',
      'retentionDays',
      'aiRequestsPerDay',
    ]
    for (const key of limitKeys) {
      expect(LIMIT_ENFORCEMENT[key]).toBeDefined()
    }
  })

  test('an "enforced" claim must name its gate', () => {
    const all = [
      ...Object.values(CAPABILITY_ENFORCEMENT),
      ...Object.values(LIMIT_ENFORCEMENT),
    ]
    for (const e of all) {
      if (e.status === 'enforced') {
        expect(e.gate.length).toBeGreaterThan(0)
      }
    }
  })

  test('the host cap is the one enforced limit today', () => {
    // Documents the audited reality; flip deliberately as enforcement lands.
    expect(LIMIT_ENFORCEMENT.hosts.status).toBe('enforced')
    expect(LIMIT_ENFORCEMENT.seats.status).toBe('deferred')
    expect(LIMIT_ENFORCEMENT.aiRequestsPerDay.status).toBe('deferred')
  })
})

describe('plan-enforcement — host cap really blocks', () => {
  test('Pro blocks at its host limit, allows below it', () => {
    const pro = BILLING_PLANS.pro
    expect(pro.hosts).toBe(3)
    expect(checkHostLimit(pro, 2).allowed).toBe(true)
    expect(checkHostLimit(pro, 3).allowed).toBe(false)
  })

  test('Enterprise (unlimited hosts) never blocks', () => {
    const ent = BILLING_PLANS.enterprise
    expect(ent.hosts).toBeNull()
    expect(checkHostLimit(ent, 10_000).allowed).toBe(true)
  })
})

describe('plan-enforcement — cross-surface render parity', () => {
  // The landing comparison matrix and the in-app billing matrix both derive
  // from these shared helpers. Pin the exact strings so a future change to the
  // helper (which would silently change BOTH surfaces) is caught here.
  test('limit cells render the agreed strings for every tier', () => {
    expect(BILLING_PLAN_LIST.map(planHosts)).toEqual([
      '1',
      '3',
      '10',
      'Unlimited',
    ])
    expect(BILLING_PLAN_LIST.map(planSeats)).toEqual([
      '1',
      '3',
      '10',
      'Unlimited',
    ])
    expect(BILLING_PLAN_LIST.map(planAlertRules)).toEqual([
      '—',
      '10',
      '50',
      'Unlimited',
    ])
    expect(BILLING_PLAN_LIST.map(planRetention)).toEqual([
      '7 days',
      '30 days',
      '90 days',
      'Custom',
    ])
    expect(BILLING_PLAN_LIST.map(planAiUsage)).toEqual([
      '5 messages / day',
      '100 messages / day, then $5 / 2,000',
      '1,000 messages / day, then $5 / 2,000',
      'BYOK',
    ])
  })
})
