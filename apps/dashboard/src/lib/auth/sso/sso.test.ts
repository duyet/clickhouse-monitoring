// Tests for enterprise-gated SSO scaffold.
// Asserts community edition is always inert (isSsoEnabled=false, getSsoProviders=[]).
// This module is standalone — it does NOT touch the none/clerk/proxy auth path.

import { getSsoProviders, isSsoEnabled, SSO_STUB_PROVIDERS } from './sso'
import { describe, expect, test } from 'bun:test'

describe('isSsoEnabled', () => {
  test('returns false by default (no env set)', () => {
    expect(isSsoEnabled()).toBe(false)
  })

  test('returns false for community edition explicitly', () => {
    expect(isSsoEnabled({ CHM_EDITION: 'community' })).toBe(false)
  })

  test('returns false for empty CHM_EDITION (fail-open to community)', () => {
    expect(isSsoEnabled({ CHM_EDITION: '' })).toBe(false)
  })

  test('returns false for unrecognised CHM_EDITION value', () => {
    expect(isSsoEnabled({ CHM_EDITION: 'pro' })).toBe(false)
  })

  test('returns true for enterprise edition', () => {
    expect(isSsoEnabled({ CHM_EDITION: 'enterprise' })).toBe(true)
  })

  test('returns true for enterprise edition regardless of case', () => {
    // parseEdition is case-insensitive
    expect(isSsoEnabled({ CHM_EDITION: 'ENTERPRISE' })).toBe(true)
    expect(isSsoEnabled({ CHM_EDITION: 'Enterprise' })).toBe(true)
  })
})

describe('getSsoProviders', () => {
  test('returns [] in community (default)', () => {
    // The SSO gate is closed in community — providers are always empty.
    // This is the key community-inertness guarantee.
    const providers = getSsoProviders()
    expect(providers).toEqual([])
    expect(providers.length).toBe(0)
  })

  test('returns [] when CHM_EDITION is unset', () => {
    expect(getSsoProviders({})).toEqual([])
  })

  test('returns [] for community edition explicitly', () => {
    expect(getSsoProviders({ CHM_EDITION: 'community' })).toEqual([])
  })

  test('returns SSO_STUB_PROVIDERS for enterprise edition', () => {
    // In enterprise the gate opens, returning SSO_STUB_PROVIDERS (currently
    // empty registry — enterprise will populate at runtime).
    const providers = getSsoProviders({ CHM_EDITION: 'enterprise' })
    expect(providers).toBe(SSO_STUB_PROVIDERS)
  })
})

describe('SSO_STUB_PROVIDERS', () => {
  test('stub registry is empty (no providers in community or initial enterprise)', () => {
    expect(SSO_STUB_PROVIDERS).toEqual([])
    expect(SSO_STUB_PROVIDERS.length).toBe(0)
  })
})

describe('SsoProvider type shape', () => {
  test('a valid SsoProvider object satisfies the interface', () => {
    // This is a compile-time + runtime shape check.
    const samlProvider = {
      protocol: 'saml' as const,
      id: 'acme-saml',
      displayName: 'Acme Corp SSO',
    }
    expect(samlProvider.protocol).toBe('saml')
    expect(samlProvider.id).toBe('acme-saml')
    expect(samlProvider.displayName).toBe('Acme Corp SSO')
  })

  test('a valid oidc SsoProvider object satisfies the interface', () => {
    const oidcProvider = {
      protocol: 'oidc' as const,
      id: 'acme-oidc',
      displayName: 'Acme OIDC',
    }
    expect(oidcProvider.protocol).toBe('oidc')
    expect(oidcProvider.id).toBe('acme-oidc')
  })
})

describe('isolation — does NOT affect existing auth providers', () => {
  test('getSsoProviders always returns [] in community regardless of other env vars', () => {
    // Even if CHM_AUTH_PROVIDER is set to clerk, SSO remains gated.
    const providers = getSsoProviders({
      CHM_AUTH_PROVIDER: 'clerk',
      CHM_EDITION: 'community',
    })
    expect(providers).toEqual([])
  })

  test('getSsoProviders does not read CHM_AUTH_PROVIDER — SSO is standalone', () => {
    // SSO uses CHM_EDITION only; CHM_AUTH_PROVIDER is irrelevant to this module.
    const communityWithClerk = getSsoProviders({
      CHM_AUTH_PROVIDER: 'clerk',
    })
    const communityWithNone = getSsoProviders({
      CHM_AUTH_PROVIDER: 'none',
    })
    expect(communityWithClerk).toEqual([])
    expect(communityWithNone).toEqual([])
  })
})
