import {
  AuthProviderConfigError,
  getAuthProvider,
  parseAuthProvider,
} from './provider'
import { afterEach, describe, expect, test } from 'bun:test'

const originalChmAuthProvider = process.env.CHM_AUTH_PROVIDER
const originalNextPublicAuthProvider = process.env.NEXT_PUBLIC_AUTH_PROVIDER

afterEach(() => {
  if (originalChmAuthProvider === undefined) {
    delete process.env.CHM_AUTH_PROVIDER
  } else {
    process.env.CHM_AUTH_PROVIDER = originalChmAuthProvider
  }

  if (originalNextPublicAuthProvider === undefined) {
    delete process.env.NEXT_PUBLIC_AUTH_PROVIDER
  } else {
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = originalNextPublicAuthProvider
  }
})

describe('parseAuthProvider', () => {
  test('defaults unset and none to no auth', () => {
    expect(parseAuthProvider(undefined)).toBe('none')
    expect(parseAuthProvider(null)).toBe('none')
    expect(parseAuthProvider('')).toBe('none')
    expect(parseAuthProvider('none')).toBe('none')
    expect(parseAuthProvider(' NONE ')).toBe('none')
  })

  test('accepts clerk provider', () => {
    expect(parseAuthProvider('clerk')).toBe('clerk')
    expect(parseAuthProvider(' CLERK ')).toBe('clerk')
  })

  test('rejects unknown providers', () => {
    expect(() => parseAuthProvider('basic')).toThrow(AuthProviderConfigError)
  })

  test('prefers CHM_AUTH_PROVIDER over legacy public auth provider env', () => {
    process.env.CHM_AUTH_PROVIDER = 'none'
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'

    expect(getAuthProvider()).toBe('none')
  })
})
