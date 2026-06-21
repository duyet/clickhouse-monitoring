import { issueApiKey } from '../auth/api-key'
import { defaultAuthenticator, handleProtectedResourceMetadata } from '../http'
import { afterEach, describe, expect, it } from 'bun:test'

const API_SECRET = 'test-secret-key-for-unit-tests-at-least-32-chars'
const PUBLISHABLE_KEY = `pk_test_${btoa('clerk.chmonitor.dev$')}`

const ENV = [
  'CHM_API_KEY_SECRET',
  'CHM_MCP_PUBLIC',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_OAUTH_ISSUER',
] as const
const saved = Object.fromEntries(ENV.map((k) => [k, process.env[k]]))
const originalFetch = globalThis.fetch

function clearEnv() {
  for (const k of ENV) delete process.env[k]
}

function mcpReq(headers: Record<string, string> = {}): Request {
  return new Request('https://example.com/api/mcp', { method: 'POST', headers })
}

function mockClerkVerify(valid: boolean) {
  globalThis.fetch = (async () =>
    valid
      ? Response.json({ subject: 'user_1', scopes: ['email'] })
      : new Response('no', { status: 401 })) as typeof fetch
}

describe('mcp http — clerk + composed auth', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
    for (const k of ENV) {
      if (saved[k] !== undefined) process.env[k] = saved[k]
      else delete process.env[k]
    }
  })

  describe('defaultAuthenticator', () => {
    it('401s when neither API key nor Clerk is configured (secure by default)', async () => {
      clearEnv()
      const res = await defaultAuthenticator(mcpReq())
      expect(res?.status).toBe(401)
    })

    it('is open when CHM_MCP_PUBLIC=true and no auth is configured', async () => {
      clearEnv()
      process.env.CHM_MCP_PUBLIC = 'true'
      expect(await defaultAuthenticator(mcpReq())).toBeNull()
    })

    it('accepts a valid API key', async () => {
      clearEnv()
      process.env.CHM_API_KEY_SECRET = API_SECRET
      const key = await issueApiKey('cli')
      expect(
        await defaultAuthenticator(mcpReq({ authorization: `Bearer ${key}` }))
      ).toBeNull()
    })

    it('accepts a valid Clerk OAuth token via REST verify', async () => {
      clearEnv()
      process.env.CLERK_SECRET_KEY = 'sk_test_x'
      mockClerkVerify(true)
      expect(
        await defaultAuthenticator(
          mcpReq({ authorization: 'Bearer clerk-tok' })
        )
      ).toBeNull()
    })

    it('accepts EITHER scheme when both are configured (API key path, no Clerk call)', async () => {
      clearEnv()
      process.env.CHM_API_KEY_SECRET = API_SECRET
      process.env.CLERK_SECRET_KEY = 'sk_test_x'
      let clerkCalled = false
      globalThis.fetch = (async () => {
        clerkCalled = true
        return new Response('no', { status: 401 })
      }) as typeof fetch
      const key = await issueApiKey('cli')
      expect(
        await defaultAuthenticator(mcpReq({ authorization: `Bearer ${key}` }))
      ).toBeNull()
      // API key validated locally first → Clerk REST is never hit
      expect(clerkCalled).toBe(false)
    })

    it('never relays an x-api-key credential to Clerk', async () => {
      clearEnv()
      process.env.CHM_API_KEY_SECRET = API_SECRET
      process.env.CLERK_SECRET_KEY = 'sk_test_x'
      let clerkCalled = false
      globalThis.fetch = (async () => {
        clerkCalled = true
        return Response.json({ subject: 'user_1' })
      }) as typeof fetch
      // A bad x-api-key must be rejected, NOT forwarded to Clerk as an OAuth token
      const res = await defaultAuthenticator(
        mcpReq({ 'x-api-key': 'chm_bogus' })
      )
      expect(res?.status).toBe(401)
      expect(clerkCalled).toBe(false)
    })

    it('accepts a valid x-api-key even when an invalid Authorization bearer is present', async () => {
      clearEnv()
      process.env.CHM_API_KEY_SECRET = API_SECRET
      process.env.CLERK_SECRET_KEY = 'sk_test_x'
      let clerkCalled = false
      globalThis.fetch = (async () => {
        clerkCalled = true
        return new Response('no', { status: 401 })
      }) as typeof fetch
      const key = await issueApiKey('cli')
      // Mixed headers: a bad bearer must NOT mask a valid x-api-key. Composed
      // auth accepts any configured scheme, so the valid key wins and the bad
      // bearer (not an API key) never needs to reach Clerk.
      const res = await defaultAuthenticator(
        mcpReq({ authorization: 'Bearer not-a-key', 'x-api-key': key })
      )
      expect(res).toBeNull()
      expect(clerkCalled).toBe(false)
    })

    it('rejects a Clerk token the verifier reports inactive (2xx but active:false)', async () => {
      clearEnv()
      process.env.CLERK_SECRET_KEY = 'sk_test_x'
      // Clerk can answer 2xx for an inactive/revoked/expired token; that must
      // not authenticate.
      globalThis.fetch = (async () =>
        Response.json({ subject: 'user_1', active: false })) as typeof fetch
      const res = await defaultAuthenticator(
        mcpReq({ authorization: 'Bearer revoked-tok' })
      )
      expect(res?.status).toBe(401)
    })

    it('rejects a Clerk 2xx response that carries no subject', async () => {
      clearEnv()
      process.env.CLERK_SECRET_KEY = 'sk_test_x'
      globalThis.fetch = (async () =>
        Response.json({ scopes: ['email'] })) as typeof fetch
      const res = await defaultAuthenticator(
        mcpReq({ authorization: 'Bearer subjectless' })
      )
      expect(res?.status).toBe(401)
    })

    it('401s a bad token and includes WWW-Authenticate discovery when Clerk is on', async () => {
      clearEnv()
      process.env.CLERK_SECRET_KEY = 'sk_test_x'
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = PUBLISHABLE_KEY
      mockClerkVerify(false)
      const res = await defaultAuthenticator(
        mcpReq({ authorization: 'Bearer bad' })
      )
      expect(res?.status).toBe(401)
      const wwwAuth = res?.headers.get('WWW-Authenticate')
      expect(wwwAuth).toContain('resource_metadata=')
      expect(wwwAuth).toContain('/.well-known/oauth-protected-resource')
    })

    it('401s with no token when a scheme is configured', async () => {
      clearEnv()
      process.env.CHM_API_KEY_SECRET = API_SECRET
      const res = await defaultAuthenticator(mcpReq())
      expect(res?.status).toBe(401)
    })
  })

  describe('handleProtectedResourceMetadata', () => {
    it('serves metadata for the MCP endpoint pointing at the Clerk issuer', async () => {
      clearEnv()
      // discoverable requires BOTH a verifier (secret) and an issuer (pub key)
      process.env.CLERK_SECRET_KEY = 'sk_test_x'
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = PUBLISHABLE_KEY
      const res = handleProtectedResourceMetadata(
        new Request(
          'https://dash.chmonitor.dev/.well-known/oauth-protected-resource'
        )
      )
      expect(res.status).toBe(200)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
      const body = (await res.json()) as {
        resource: string
        authorization_servers: string[]
      }
      // resource is the MCP endpoint, not the bare origin (RFC 9728 match)
      expect(body.resource).toBe('https://dash.chmonitor.dev/api/mcp')
      expect(body.authorization_servers).toEqual([
        'https://clerk.chmonitor.dev',
      ])
    })

    it('404s when Clerk OAuth is not discoverable (issuer but no verifier)', () => {
      clearEnv()
      // publishable key present but no CLERK_SECRET_KEY → cannot verify tokens,
      // so we must NOT advertise a login flow
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = PUBLISHABLE_KEY
      const res = handleProtectedResourceMetadata(
        new Request('https://x.dev/.well-known/oauth-protected-resource')
      )
      expect(res.status).toBe(404)
    })
  })
})
