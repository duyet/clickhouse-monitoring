import type { FeaturePermission, PublicFeaturePermissionConfig } from '../types'

import { isFeatureAllowed, resolveFeatureState } from '../shared'
import { describe, expect, test } from 'bun:test'

function config(
  overrides: Partial<PublicFeaturePermissionConfig> = {}
): PublicFeaturePermissionConfig {
  return {
    authProvider: 'none',
    principal: 'anonymous',
    features: {},
    ...overrides,
  } as PublicFeaturePermissionConfig
}

describe('isFeatureAllowed — defaults', () => {
  test('no permission → allowed (default public, enabled)', () => {
    expect(isFeatureAllowed(undefined, config())).toBe(true)
  })

  test('disabled feature → not allowed', () => {
    expect(
      isFeatureAllowed(
        { feature: 'agent' },
        config({ features: { agent: { enabled: false } } })
      )
    ).toBe(false)
  })
})

describe('isFeatureAllowed — access is a backend concern (FE renders all enabled)', () => {
  const perm: FeaturePermission = { feature: 'agent' }

  // The frontend is a pure rendering layer: it no longer gates on access or
  // principal. Every ENABLED feature renders in every auth mode, and the backend
  // (server.ts authorizeFeatureRequest) is the single security boundary — it 401s
  // protected data/actions. So an `authenticated` feature is visible to everyone
  // on the client; the page renders and the API call enforces.
  test.each([
    ['none, anonymous', 'none', 'anonymous'],
    ['clerk, anonymous (workerd hard-anonymous)', 'clerk', 'anonymous'],
    ['clerk, signed in', 'clerk', 'authenticated'],
    ['proxy, anonymous', 'proxy', 'anonymous'],
  ] as const)('authenticated feature renders — %s', (_label, authProvider, principal) => {
    expect(
      isFeatureAllowed(
        perm,
        config({
          authProvider:
            authProvider as PublicFeaturePermissionConfig['authProvider'],
          principal: principal as PublicFeaturePermissionConfig['principal'],
          features: { agent: { access: 'authenticated' } },
        })
      )
    ).toBe(true)
  })

  test('disabled wins over access — hidden even when authenticated', () => {
    expect(
      isFeatureAllowed(
        perm,
        config({
          authProvider: 'clerk',
          principal: 'authenticated',
          features: { agent: { access: 'authenticated', enabled: false } },
        })
      )
    ).toBe(false)
  })
})

describe('isFeatureAllowed — agent menu visible across deploy postures', () => {
  const agentPerm: FeaturePermission = { feature: 'agent' }

  // Regression: a static workerd deploy can never report principal:'authenticated'
  // (no server-side Clerk auth()), so /api/v1/config always returns 'anonymous'.
  // The agent menu must stay visible in every posture — the backend enforces auth
  // on send, not the client route. Each row is a deploy posture it must survive.
  test.each([
    ['no auth provider, anonymous', 'none', 'anonymous'],
    ['clerk active, anonymous (workerd hard-anonymous)', 'clerk', 'anonymous'],
    ['clerk active, signed in', 'clerk', 'authenticated'],
    ['proxy active, anonymous', 'proxy', 'anonymous'],
  ] as const)('visible — %s', (_label, authProvider, principal) => {
    expect(
      isFeatureAllowed(
        agentPerm,
        config({
          authProvider:
            authProvider as PublicFeaturePermissionConfig['authProvider'],
          principal: principal as PublicFeaturePermissionConfig['principal'],
        })
      )
    ).toBe(true)
  })

  test('hidden only when the feature is disabled', () => {
    expect(
      isFeatureAllowed(
        agentPerm,
        config({
          authProvider: 'clerk',
          features: { agent: { enabled: false } },
        })
      )
    ).toBe(false)
  })
})

describe('resolveFeatureState', () => {
  test('undefined permission → enabled public default', () => {
    expect(resolveFeatureState(undefined, { features: {} })).toEqual({
      enabled: true,
      access: 'public',
    })
  })

  test('override is layered over defaults', () => {
    expect(
      resolveFeatureState(
        { feature: 'agent' },
        { features: { agent: { enabled: false, access: 'authenticated' } } }
      )
    ).toEqual({ enabled: false, access: 'authenticated' })
  })

  test('defaultAccess from permission applies when no override', () => {
    expect(
      resolveFeatureState(
        { feature: 'agent', defaultAccess: 'authenticated' },
        { features: {} }
      )
    ).toEqual({ enabled: true, access: 'authenticated' })
  })
})
