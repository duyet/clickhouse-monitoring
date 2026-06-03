import { issueApiKey } from '../auth/api-key'
import {
  apiKeyAuthenticator,
  buildServerInfo,
  corsPreflight,
  handleMcp,
  handleMcpInfo,
  normalizePath,
  withCors,
} from '../http'
import { afterEach, describe, expect, it } from 'bun:test'

const TEST_SECRET = 'test-secret-key-for-unit-tests-at-least-32-chars'

function req(headers: Record<string, string> = {}): Request {
  return new Request('https://example.com/api/mcp', { method: 'POST', headers })
}

describe('mcp http', () => {
  const originalSecret = process.env.CHM_API_KEY_SECRET

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.CHM_API_KEY_SECRET = originalSecret
    } else {
      delete process.env.CHM_API_KEY_SECRET
    }
  })

  describe('withCors / corsPreflight', () => {
    it('adds permissive CORS headers', () => {
      const res = withCors(new Response('ok'))
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    })

    it('preflight is 204 with CORS', () => {
      const res = corsPreflight()
      expect(res.status).toBe(204)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })
  })

  describe('normalizePath', () => {
    it('strips trailing slashes but preserves root', () => {
      expect(normalizePath('/api/mcp/')).toBe('/api/mcp')
      expect(normalizePath('/api/mcp')).toBe('/api/mcp')
      expect(normalizePath('/')).toBe('/')
    })
  })

  describe('apiKeyAuthenticator', () => {
    it('allows anonymous when no secret is configured (open case)', async () => {
      delete process.env.CHM_API_KEY_SECRET
      expect(await apiKeyAuthenticator(req())).toBeNull()
    })

    it('401s when secret is set but no token is provided', async () => {
      process.env.CHM_API_KEY_SECRET = TEST_SECRET
      const res = await apiKeyAuthenticator(req())
      expect(res?.status).toBe(401)
      // failures are CORS-wrapped so browser clients can read the status
      expect(res?.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })

    it('401s on an invalid token', async () => {
      process.env.CHM_API_KEY_SECRET = TEST_SECRET
      const res = await apiKeyAuthenticator(
        req({ authorization: 'Bearer not-a-real-key' })
      )
      expect(res?.status).toBe(401)
    })

    it('allows a valid issued key (bearer or x-api-key)', async () => {
      process.env.CHM_API_KEY_SECRET = TEST_SECRET
      const key = await issueApiKey('test')
      expect(
        await apiKeyAuthenticator(req({ authorization: `Bearer ${key}` }))
      ).toBeNull()
      expect(await apiKeyAuthenticator(req({ 'x-api-key': key }))).toBeNull()
    })
  })

  describe('handleMcp auth gate', () => {
    it('short-circuits with the authenticator response and never runs the server', async () => {
      const sentinel = new Response('nope', { status: 403 })
      const res = await handleMcp(req(), {
        authenticate: async () => sentinel,
      })
      expect(res.status).toBe(403)
    })

    it('honors a custom authenticator that allows through', async () => {
      // We can't assert full MCP protocol output here, but reaching the
      // transport (any non-403) proves the gate passed.
      const res = await handleMcp(req({ 'content-type': 'application/json' }), {
        authenticate: async () => null,
      })
      expect(res.status).not.toBe(403)
    })
  })

  describe('buildServerInfo / handleMcpInfo', () => {
    it('builds the expected server info payload', () => {
      const info = buildServerInfo()
      expect(info.name).toBe('chmonitor')
      // version is sourced live from package.json, not hardcoded
      expect(info.version).toMatch(/^\d+\.\d+\.\d+/)
      expect(info.tools.length).toBeGreaterThan(0)
      expect(info.resources.map((r) => r.name)).toContain('system-tables')
    })

    it('returns info JSON with CORS when auth is open', async () => {
      delete process.env.CHM_API_KEY_SECRET
      const res = await handleMcpInfo(
        new Request('https://example.com/api/v1/mcp/info')
      )
      expect(res.status).toBe(200)
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
      const body = (await res.json()) as { name: string }
      expect(body.name).toBe('chmonitor')
    })

    it('401s info when auth is required and no token is given', async () => {
      process.env.CHM_API_KEY_SECRET = TEST_SECRET
      const res = await handleMcpInfo(
        new Request('https://example.com/api/v1/mcp/info')
      )
      expect(res.status).toBe(401)
    })
  })
})
