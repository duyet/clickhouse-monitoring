import {
  AuthProviderConfigError,
  getAuthProvider,
  parseAuthProvider,
} from './provider'
import { afterEach, describe, expect, test } from 'bun:test'

const originalChmAuthProvider = process.env.CHM_AUTH_PROVIDER

afterEach(() => {
  if (originalChmAuthProvider === undefined) {
    delete process.env.CHM_AUTH_PROVIDER
  } else {
    process.env.CHM_AUTH_PROVIDER = originalChmAuthProvider
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

  test('accepts proxy and trusted providers', () => {
    expect(parseAuthProvider('proxy')).toBe('proxy')
    expect(parseAuthProvider(' PROXY ')).toBe('proxy')
    expect(parseAuthProvider('trusted')).toBe('trusted')
    expect(parseAuthProvider(' Trusted ')).toBe('trusted')
  })

  test('rejects unknown providers', () => {
    expect(() => parseAuthProvider('basic')).toThrow(AuthProviderConfigError)
  })

  test('reads the runtime CHM_AUTH_PROVIDER worker var', () => {
    // Server reads CHM_AUTH_PROVIDER first, then the build-time
    // import.meta.env.VITE_AUTH_PROVIDER fallback (undefined under bun test).
    process.env.CHM_AUTH_PROVIDER = 'none'
    expect(getAuthProvider()).toBe('none')

    process.env.CHM_AUTH_PROVIDER = 'clerk'
    expect(getAuthProvider()).toBe('clerk')
  })
})
