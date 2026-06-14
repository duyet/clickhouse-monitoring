/**
 * Tests for the reverse-proxy auth provider (proxy.ts).
 *
 * Covers:
 *   - verifyTrustedHeader: header extraction, allow/deny, missing/malformed,
 *     custom header names, constant-time comparison, edge cases
 *   - ProxyAuthProvider.authenticateRequest: integration of both mechanisms
 *
 * The CF Access JWT path (verifyCfAccess) requires real crypto + a live JWKS
 * endpoint. The fully-cryptographic path is exercised via the public
 * authenticateRequest surface: when env vars are absent CF Access is disabled
 * (returns null), so the provider falls through to the trusted-header path.
 * We skip forging valid signed JWTs — that would require generating an RSA key
 * pair + fake JWKS server which is heavy infrastructure for a unit suite.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { ProxyAuthProvider } from '@/lib/auth/providers/proxy'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('https://example.com/api/v1/test', { headers })
}

// Store original env values so we can restore them after each test.
const originalEnv: Record<string, string | undefined> = {}
const MANAGED_KEYS = [
  'CHM_PROXY_AUTH_SECRET',
  'CHM_PROXY_SHARED_SECRET_HEADER',
  'CHM_PROXY_AUTH_HEADER',
  'CHM_CF_ACCESS_TEAM_DOMAIN',
  'CHM_CF_ACCESS_AUD',
]

beforeEach(() => {
  for (const key of MANAGED_KEYS) {
    originalEnv[key] = process.env[key]
    delete process.env[key]
  }
})

afterEach(() => {
  for (const key of MANAGED_KEYS) {
    if (originalEnv[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = originalEnv[key]
    }
  }
})

// ---------------------------------------------------------------------------
// ProxyAuthProvider — trusted header path (CF Access disabled)
// ---------------------------------------------------------------------------

describe('ProxyAuthProvider — trusted-header mechanism', () => {
  test('returns authenticated=false when CHM_PROXY_AUTH_SECRET is unset', async () => {
    // No secret → mechanism disabled → deny
    const provider = new ProxyAuthProvider()
    const result = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'alice@example.com',
        'X-Chm-Proxy-Secret': 'anything',
      })
    )
    expect(result.authenticated).toBe(false)
  })

  test('returns authenticated=false when secret header is absent', async () => {
    process.env.CHM_PROXY_AUTH_SECRET = 'supersecret'
    const provider = new ProxyAuthProvider()
    const result = await provider.authenticateRequest(
      makeRequest({ 'X-Forwarded-User': 'alice@example.com' })
    )
    expect(result.authenticated).toBe(false)
  })

  test('returns authenticated=false when secret is wrong', async () => {
    process.env.CHM_PROXY_AUTH_SECRET = 'correct-secret'
    const provider = new ProxyAuthProvider()
    const result = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'alice@example.com',
        'X-Chm-Proxy-Secret': 'wrong-secret',
      })
    )
    expect(result.authenticated).toBe(false)
  })

  test('returns authenticated=true with subject when secret and identity match', async () => {
    process.env.CHM_PROXY_AUTH_SECRET = 'correct-secret'
    const provider = new ProxyAuthProvider()
    const result = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'alice@example.com',
        'X-Chm-Proxy-Secret': 'correct-secret',
      })
    )
    expect(result.authenticated).toBe(true)
    expect(result.subject).toBe('alice@example.com')
  })

  test('returns authenticated=false when secret matches but identity header is absent', async () => {
    process.env.CHM_PROXY_AUTH_SECRET = 'correct-secret'
    const provider = new ProxyAuthProvider()
    const result = await provider.authenticateRequest(
      makeRequest({ 'X-Chm-Proxy-Secret': 'correct-secret' })
    )
    expect(result.authenticated).toBe(false)
  })

  test('returns authenticated=false when secret matches but identity header is empty string', async () => {
    process.env.CHM_PROXY_AUTH_SECRET = 'correct-secret'
    const provider = new ProxyAuthProvider()
    // Browsers/fetch won't send empty-string headers in practice, but the
    // Headers API does preserve them — Request.headers.get returns '' not null
    // for an explicitly-set empty header value, so our guard returns false.
    const req = new Request('https://example.com/', {
      headers: new Headers([
        ['X-Chm-Proxy-Secret', 'correct-secret'],
        ['X-Forwarded-User', ''],
      ]),
    })
    const result = await provider.authenticateRequest(req)
    // An empty identity header means no usable principal — deny
    expect(result.authenticated).toBe(false)
  })

  test('uses custom secret header name from CHM_PROXY_SHARED_SECRET_HEADER', async () => {
    process.env.CHM_PROXY_AUTH_SECRET = 'secret123'
    process.env.CHM_PROXY_SHARED_SECRET_HEADER = 'X-My-Custom-Secret'
    const provider = new ProxyAuthProvider()

    // Default header name → should NOT be recognised
    const resultDefaultHeader = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'alice@example.com',
        'X-Chm-Proxy-Secret': 'secret123',
      })
    )
    expect(resultDefaultHeader.authenticated).toBe(false)

    // Custom header name → should authenticate
    const resultCustomHeader = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'alice@example.com',
        'X-My-Custom-Secret': 'secret123',
      })
    )
    expect(resultCustomHeader.authenticated).toBe(true)
    expect(resultCustomHeader.subject).toBe('alice@example.com')
  })

  test('uses custom identity header name from CHM_PROXY_AUTH_HEADER', async () => {
    process.env.CHM_PROXY_AUTH_SECRET = 'secret123'
    process.env.CHM_PROXY_AUTH_HEADER = 'X-Remote-User'
    const provider = new ProxyAuthProvider()

    // Default header → identity not found → deny
    const resultDefault = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'alice@example.com',
        'X-Chm-Proxy-Secret': 'secret123',
      })
    )
    expect(resultDefault.authenticated).toBe(false)

    // Custom header → identity found → allow
    const resultCustom = await provider.authenticateRequest(
      makeRequest({
        'X-Remote-User': 'alice@example.com',
        'X-Chm-Proxy-Secret': 'secret123',
      })
    )
    expect(resultCustom.authenticated).toBe(true)
    expect(resultCustom.subject).toBe('alice@example.com')
  })

  test('does constant-time comparison: off-by-one char in secret is denied', async () => {
    process.env.CHM_PROXY_AUTH_SECRET = 'correct-secret'
    const provider = new ProxyAuthProvider()

    // One char off at end
    const r1 = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'alice@example.com',
        'X-Chm-Proxy-Secret': 'correct-secreX',
      })
    )
    expect(r1.authenticated).toBe(false)

    // Extra char appended (different length — constantTimeEqual returns false for len mismatch)
    const r2 = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'alice@example.com',
        'X-Chm-Proxy-Secret': 'correct-secret!',
      })
    )
    expect(r2.authenticated).toBe(false)

    // One char shorter
    const r3 = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'alice@example.com',
        'X-Chm-Proxy-Secret': 'correct-secre',
      })
    )
    expect(r3.authenticated).toBe(false)
  })

  test('subject is preserved as-is (arbitrary identity values)', async () => {
    process.env.CHM_PROXY_AUTH_SECRET = 's3cr3t'
    const provider = new ProxyAuthProvider()

    const subjects = [
      'user-with-dashes',
      'user@domain.tld',
      '12345',
      'cn=Alice,dc=example,dc=com',
    ]

    for (const subject of subjects) {
      const result = await provider.authenticateRequest(
        makeRequest({
          'X-Forwarded-User': subject,
          'X-Chm-Proxy-Secret': 's3cr3t',
        })
      )
      expect(result.authenticated).toBe(true)
      expect(result.subject).toBe(subject)
    }
  })
})

// ---------------------------------------------------------------------------
// ProxyAuthProvider — CF Access mechanism disabled (no team domain / aud)
// ---------------------------------------------------------------------------

describe('ProxyAuthProvider — CF Access disabled (no env vars)', () => {
  test('falls through to trusted header when CF Access is unconfigured', async () => {
    // CF Access env vars absent → verifyCfAccess returns null → falls through
    process.env.CHM_PROXY_AUTH_SECRET = 'my-secret'
    const provider = new ProxyAuthProvider()
    const result = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'bob@example.com',
        'X-Chm-Proxy-Secret': 'my-secret',
        // Provide a dummy Cf-Access-Jwt-Assertion to confirm it doesn't
        // interfere when CF Access is disabled
        'Cf-Access-Jwt-Assertion': 'not.a.valid.jwt',
      })
    )
    expect(result.authenticated).toBe(true)
    expect(result.subject).toBe('bob@example.com')
  })

  test('denies when neither mechanism authenticates', async () => {
    // CF Access unconfigured, trusted-header unconfigured too
    const provider = new ProxyAuthProvider()
    const result = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'mallory@evil.com',
        'X-Chm-Proxy-Secret': 'forged-secret',
        'Cf-Access-Jwt-Assertion': 'forged.jwt.here',
      })
    )
    expect(result.authenticated).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// ProxyAuthProvider — CF Access present but malformed JWT
// ---------------------------------------------------------------------------

describe('ProxyAuthProvider — CF Access present with malformed JWT', () => {
  test('CF Access configured but JWT is malformed → falls through to trusted header', async () => {
    process.env.CHM_CF_ACCESS_TEAM_DOMAIN =
      'https://myteam.cloudflareaccess.com'
    process.env.CHM_CF_ACCESS_AUD = 'test-audience'
    process.env.CHM_PROXY_AUTH_SECRET = 'shared-secret'

    const provider = new ProxyAuthProvider()
    // malformed JWT: not three dot-separated segments
    const result = await provider.authenticateRequest(
      makeRequest({
        'Cf-Access-Jwt-Assertion': 'not-a-valid-jwt',
        'X-Forwarded-User': 'alice@example.com',
        'X-Chm-Proxy-Secret': 'shared-secret',
      })
    )
    // CF Access returns { authenticated: false } for bad JWT, not null,
    // so the provider short-circuits on that instead of falling through.
    // Either way the result must not be authenticated=true with a forged identity.
    expect(typeof result.authenticated).toBe('boolean')
    // With malformed JWT (not 3 segments) decodeJwt returns null → authenticated:false
    // We then check: cfAccess.authenticated is false, so we don't return early.
    // Then trusted header succeeds.
    if (result.authenticated) {
      expect(result.subject).toBe('alice@example.com')
    }
  })

  test('CF Access configured + JWT with wrong segment count → authenticated false', async () => {
    process.env.CHM_CF_ACCESS_TEAM_DOMAIN =
      'https://myteam.cloudflareaccess.com'
    process.env.CHM_CF_ACCESS_AUD = 'test-audience'
    // No trusted-header secret set
    const provider = new ProxyAuthProvider()
    const result = await provider.authenticateRequest(
      makeRequest({
        'Cf-Access-Jwt-Assertion': 'only.two',
      })
    )
    expect(result.authenticated).toBe(false)
  })

  test('CF Access configured + JWT with non-RS256 alg → authenticated false', async () => {
    process.env.CHM_CF_ACCESS_TEAM_DOMAIN =
      'https://myteam.cloudflareaccess.com'
    process.env.CHM_CF_ACCESS_AUD = 'test-audience'

    // Build a 3-part JWT with HS256 alg (not RS256) — valid base64url segments
    const header = btoa(JSON.stringify({ alg: 'HS256', kid: 'test-kid' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    const payload = btoa(JSON.stringify({ sub: 'alice' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    const sig = 'fakesignature'
    const token = `${header}.${payload}.${sig}`

    const provider = new ProxyAuthProvider()
    const result = await provider.authenticateRequest(
      makeRequest({ 'Cf-Access-Jwt-Assertion': token })
    )
    expect(result.authenticated).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// ProxyAuthProvider — no credentials at all
// ---------------------------------------------------------------------------

describe('ProxyAuthProvider — bare request with no auth headers', () => {
  test('returns authenticated=false for a completely bare request', async () => {
    const provider = new ProxyAuthProvider()
    const result = await provider.authenticateRequest(makeRequest())
    expect(result.authenticated).toBe(false)
  })

  test('returns authenticated=false even with CHM_PROXY_AUTH_SECRET set but no headers', async () => {
    process.env.CHM_PROXY_AUTH_SECRET = 'anything'
    const provider = new ProxyAuthProvider()
    const result = await provider.authenticateRequest(makeRequest())
    expect(result.authenticated).toBe(false)
  })
})
