import {
  BILLING_PLAN_LIST,
  BILLING_PLANS,
  monthlyEquivalentUsd,
  planHasCapability,
  yearlyMonthsFree,
} from './plans'
import { describe, expect, test } from 'bun:test'

describe('billing plans', () => {
  test('locked price points: Pro $29 / Max $99', () => {
    expect(BILLING_PLANS.pro.priceMonthlyUsd).toBe(29)
    expect(BILLING_PLANS.max.priceMonthlyUsd).toBe(99)
  })

  test('seats/hosts per tier match the deal', () => {
    expect([BILLING_PLANS.pro.seats, BILLING_PLANS.pro.hosts]).toEqual([3, 3])
    expect([BILLING_PLANS.max.seats, BILLING_PLANS.max.hosts]).toEqual([10, 10])
  })

  test('yearly = 10× monthly (≈2 months free)', () => {
    expect(BILLING_PLANS.pro.priceYearlyUsd).toBe(290)
    expect(BILLING_PLANS.max.priceYearlyUsd).toBe(990)
    expect(yearlyMonthsFree(BILLING_PLANS.pro)).toBe(2)
    expect(yearlyMonthsFree(BILLING_PLANS.max)).toBe(2)
  })

  test('monthlyEquivalentUsd: yearly shows per-month equivalent', () => {
    expect(monthlyEquivalentUsd(BILLING_PLANS.pro, 'monthly')).toBe(29)
    expect(monthlyEquivalentUsd(BILLING_PLANS.pro, 'yearly')).toBeCloseTo(
      24.17,
      1
    )
  })

  test('enterprise is custom (null price, BYOK, unlimited)', () => {
    const e = BILLING_PLANS.enterprise
    expect(e.priceMonthlyUsd).toBeNull()
    expect(e.aiMonthlyUsdBudget).toBeNull() // BYOK
    expect(e.hosts).toBeNull()
    expect(yearlyMonthsFree(e)).toBeNull()
  })

  test('capabilities form an increasing ladder', () => {
    const counts = BILLING_PLAN_LIST.map((p) => p.capabilities.length)
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1])
    }
  })

  test('core monitoring is in every tier; SSO only in enterprise', () => {
    for (const id of ['free', 'pro', 'max', 'enterprise'] as const) {
      expect(planHasCapability(id, 'core_monitoring')).toBe(true)
    }
    expect(planHasCapability('max', 'sso_rbac_audit')).toBe(false)
    expect(planHasCapability('enterprise', 'sso_rbac_audit')).toBe(true)
  })

  test('new metered limits are set on every tier', () => {
    // alert rules: 0 → 10 → 50 → unlimited
    expect(BILLING_PLANS.free.alertRules).toBe(0)
    expect(BILLING_PLANS.pro.alertRules).toBe(10)
    expect(BILLING_PLANS.max.alertRules).toBe(50)
    expect(BILLING_PLANS.enterprise.alertRules).toBeNull()
    // daily AI trial caps Free only
    expect(BILLING_PLANS.free.aiRequestsPerDay).toBe(25)
    expect(BILLING_PLANS.pro.aiRequestsPerDay).toBeNull()
  })

  test('new feature capabilities sit on the right tiers', () => {
    expect(planHasCapability('free', 'data_export')).toBe(false)
    expect(planHasCapability('pro', 'data_export')).toBe(true)
    expect(planHasCapability('pro', 'anomaly_detection')).toBe(true)
    expect(planHasCapability('pro', 'custom_dashboards')).toBe(false)
    expect(planHasCapability('max', 'custom_dashboards')).toBe(true)
    expect(planHasCapability('max', 'webhook_integrations')).toBe(true)
  })
})
