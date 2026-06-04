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

describe('isFeatureAllowed — access: authenticated', () => {
  const perm: FeaturePermission = { feature: 'agent' }

  test('anonymous principal → not allowed', () => {
    expect(
      isFeatureAllowed(
        perm,
        config({
          authProvider: 'clerk',
          principal: 'anonymous',
          features: { agent: { access: 'authenticated' } },
        })
      )
    ).toBe(false)
  })

  test('authenticated principal → allowed', () => {
    expect(
      isFeatureAllowed(
        perm,
        config({
          authProvider: 'clerk',
          principal: 'authenticated',
          features: { agent: { access: 'authenticated' } },
        })
      )
    ).toBe(true)
  })
})

describe('isFeatureAllowed — interactionGated (regression: agent menu)', () => {
  const agentPerm: FeaturePermission = {
    feature: 'agent',
    interactionGated: true,
  }

  // The bug: a fully-static workerd deploy can never report
  // principal:'authenticated' (no server-side Clerk auth()), so /api/v1/config
  // always returns 'anonymous'. The agent menu item is interaction-gated and
  // MUST stay visible for everyone — the send action gates, not the route.
  // Each row is a deploy posture the agent menu must survive.
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

  test('interactionGated still hidden when the feature is disabled', () => {
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

  test('interactionGated wins over access:authenticated (always visible)', () => {
    expect(
      isFeatureAllowed(
        agentPerm,
        config({
          authProvider: 'clerk',
          principal: 'anonymous',
          features: { agent: { access: 'authenticated' } },
        })
      )
    ).toBe(true)
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
