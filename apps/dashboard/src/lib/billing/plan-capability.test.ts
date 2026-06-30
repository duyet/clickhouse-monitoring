import { planAllowsCapability } from './plan-capability'
import { getPlan } from './plans'
import { describe, expect, it } from 'bun:test'

/**
 * Pure unit tests for planAllowsCapability.
 * requirePlanCapability is async + Clerk-dependent; integration-tested separately.
 */

describe('planAllowsCapability — sso_rbac_audit (Enterprise-only)', () => {
  it('denies free plan', () => {
    expect(planAllowsCapability(getPlan('free'), 'sso_rbac_audit')).toBe(false)
  })

  it('denies pro plan', () => {
    expect(planAllowsCapability(getPlan('pro'), 'sso_rbac_audit')).toBe(false)
  })

  it('denies max plan', () => {
    expect(planAllowsCapability(getPlan('max'), 'sso_rbac_audit')).toBe(false)
  })

  it('allows enterprise plan', () => {
    expect(planAllowsCapability(getPlan('enterprise'), 'sso_rbac_audit')).toBe(
      true
    )
  })
})

describe('planAllowsCapability — core_monitoring (all tiers)', () => {
  it('allows free', () => {
    expect(planAllowsCapability(getPlan('free'), 'core_monitoring')).toBe(true)
  })

  it('allows pro', () => {
    expect(planAllowsCapability(getPlan('pro'), 'core_monitoring')).toBe(true)
  })

  it('allows max', () => {
    expect(planAllowsCapability(getPlan('max'), 'core_monitoring')).toBe(true)
  })

  it('allows enterprise', () => {
    expect(planAllowsCapability(getPlan('enterprise'), 'core_monitoring')).toBe(
      true
    )
  })
})

describe('planAllowsCapability — api_mcp_access (gate applied at routes/api/mcp.ts POST+GET)', () => {
  it('denies free plan', () => {
    expect(planAllowsCapability(getPlan('free'), 'api_mcp_access')).toBe(false)
  })

  it('denies pro plan', () => {
    expect(planAllowsCapability(getPlan('pro'), 'api_mcp_access')).toBe(false)
  })

  it('allows max plan', () => {
    expect(planAllowsCapability(getPlan('max'), 'api_mcp_access')).toBe(true)
  })

  it('allows enterprise plan', () => {
    expect(planAllowsCapability(getPlan('enterprise'), 'api_mcp_access')).toBe(
      true
    )
  })
})
