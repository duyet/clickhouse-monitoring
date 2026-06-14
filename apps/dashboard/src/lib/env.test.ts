import {
  AuthProviderConfigError,
  getServerAuthProvider,
  isClerkEnabled,
  parseAuthProvider,
} from './env'
import { describe, expect, test } from 'bun:test'

describe('parseAuthProvider', () => {
  test('unset / empty / "none" → none', () => {
    expect(parseAuthProvider(undefined)).toBe('none')
    expect(parseAuthProvider(null)).toBe('none')
    expect(parseAuthProvider('')).toBe('none')
    expect(parseAuthProvider('  NONE  ')).toBe('none')
  })

  test('"clerk" (any case/whitespace) → clerk', () => {
    expect(parseAuthProvider('clerk')).toBe('clerk')
    expect(parseAuthProvider(' Clerk ')).toBe('clerk')
  })

  test('throws AuthProviderConfigError on an unknown value', () => {
    expect(() => parseAuthProvider('oauth')).toThrow(AuthProviderConfigError)
    expect(() => parseAuthProvider('oauth')).toThrow(/Invalid auth provider/)
  })
})

describe('getServerAuthProvider', () => {
  test('runtime CHM_AUTH_PROVIDER from the passed env wins', () => {
    expect(getServerAuthProvider({ CHM_AUTH_PROVIDER: 'clerk' })).toBe('clerk')
    expect(getServerAuthProvider({ CHM_AUTH_PROVIDER: 'none' })).toBe('none')
  })

  test('empty runtime env resolves to a valid provider (no throw)', () => {
    // With no CHM_AUTH_PROVIDER it reads build-time VITE_AUTH_PROVIDER, which is
    // environment-dependent — assert it resolves to one of the valid values.
    expect(['none', 'clerk']).toContain(getServerAuthProvider({}))
  })

  test('an invalid runtime value throws', () => {
    expect(() => getServerAuthProvider({ CHM_AUTH_PROVIDER: 'bogus' })).toThrow(
      AuthProviderConfigError
    )
  })
})

describe('isClerkEnabled', () => {
  test('true only when the resolved provider is clerk', () => {
    expect(isClerkEnabled({ CHM_AUTH_PROVIDER: 'clerk' })).toBe(true)
    expect(isClerkEnabled({ CHM_AUTH_PROVIDER: 'none' })).toBe(false)
  })
})
