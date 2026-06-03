import {
  buildProtectedResourceMetadata,
  getClerkIssuer,
} from '../oauth-metadata'
import { afterEach, describe, expect, it } from 'bun:test'

const ENV_KEYS = [
  'CLERK_OAUTH_ISSUER',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_PUBLISHABLE_KEY',
] as const
const saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]))

// pk_<env>_<base64(frontendApiHost + '$')> — how Clerk encodes the issuer host.
function publishableKey(host: string, env: 'test' | 'live' = 'live'): string {
  return `pk_${env}_${btoa(`${host}$`)}`
}

describe('oauth-metadata', () => {
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] !== undefined) process.env[k] = saved[k]
      else delete process.env[k]
    }
  })

  describe('getClerkIssuer', () => {
    it('derives the issuer host from the publishable key', () => {
      delete process.env.CLERK_OAUTH_ISSUER
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = publishableKey(
        'clerk.chmonitor.dev'
      )
      expect(getClerkIssuer()).toBe('https://clerk.chmonitor.dev')
    })

    it('prefers an explicit CLERK_OAUTH_ISSUER override (trailing slash trimmed)', () => {
      process.env.CLERK_OAUTH_ISSUER = 'https://auth.example.com/'
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = publishableKey(
        'clerk.chmonitor.dev'
      )
      expect(getClerkIssuer()).toBe('https://auth.example.com')
    })

    it('returns null when nothing is configured', () => {
      for (const k of ENV_KEYS) delete process.env[k]
      expect(getClerkIssuer()).toBeNull()
    })
  })

  describe('buildProtectedResourceMetadata', () => {
    it('builds RFC 9728 metadata pointing at the Clerk issuer', () => {
      delete process.env.CLERK_OAUTH_ISSUER
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = publishableKey(
        'clerk.chmonitor.dev'
      )
      const md = buildProtectedResourceMetadata('https://dash.chmonitor.dev/')
      expect(md).not.toBeNull()
      expect(md?.resource).toBe('https://dash.chmonitor.dev')
      expect(md?.authorization_servers).toEqual(['https://clerk.chmonitor.dev'])
      expect(md?.bearer_methods_supported).toEqual(['header'])
      expect(md?.scopes_supported.length).toBeGreaterThan(0)
    })

    it('returns null when Clerk is not configured (resource is not OAuth-protected)', () => {
      for (const k of ENV_KEYS) delete process.env[k]
      expect(buildProtectedResourceMetadata('https://x.dev')).toBeNull()
    })
  })
})
