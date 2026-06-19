/**
 * Tests for the trusted reverse-proxy auth provider (trusted.ts).
 *
 * Covers the full surface:
 *   - trust gate: shared-secret match, constant-time compare, insecure opt-in,
 *     fail-closed when neither is configured
 *   - identity extraction: subject (user→email fallback), name, email, avatar,
 *     roles (groups + role header, de-duplicated), custom header mapping
 *   - group gating: CHM_TRUSTED_ALLOWED_GROUPS intersection
 *   - custom header names via env overrides
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { TrustedAuthProvider } from '@/lib/auth/providers/trusted'

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('https://example.com/api/v1/test', { headers })
}

const originalEnv: Record<string, string | undefined> = {}
const MANAGED_KEYS = [
  'CHM_TRUSTED_AUTH_SECRET',
  'CHM_TRUSTED_SHARED_SECRET_HEADER',
  'CHM_TRUSTED_ALLOW_INSECURE',
  'CHM_TRUSTED_USER_HEADER',
  'CHM_TRUSTED_EMAIL_HEADER',
  'CHM_TRUSTED_NAME_HEADER',
  'CHM_TRUSTED_AVATAR_HEADER',
  'CHM_TRUSTED_GROUPS_HEADER',
  'CHM_TRUSTED_ROLE_HEADER',
  'CHM_TRUSTED_CUSTOM_HEADERS',
  'CHM_TRUSTED_ALLOWED_GROUPS',
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

const provider = new TrustedAuthProvider()

// ---------------------------------------------------------------------------
// Trust gate
// ---------------------------------------------------------------------------

describe('TrustedAuthProvider — trust gate', () => {
  test('fails closed when neither secret nor insecure opt-in is set', async () => {
    const result = await provider.authenticateRequest(
      makeRequest({ 'X-Forwarded-User': 'alice@example.com' })
    )
    expect(result.authenticated).toBe(false)
  })

  test('authenticates with insecure opt-in (no secret)', async () => {
    process.env.CHM_TRUSTED_ALLOW_INSECURE = 'true'
    const result = await provider.authenticateRequest(
      makeRequest({ 'X-Forwarded-User': 'alice@example.com' })
    )
    expect(result.authenticated).toBe(true)
    expect(result.subject).toBe('alice@example.com')
  })

  test('requires the shared secret header when a secret is configured', async () => {
    process.env.CHM_TRUSTED_AUTH_SECRET = 'correct-secret'
    const result = await provider.authenticateRequest(
      makeRequest({ 'X-Forwarded-User': 'alice@example.com' })
    )
    expect(result.authenticated).toBe(false)
  })

  test('authenticates when the shared secret matches', async () => {
    process.env.CHM_TRUSTED_AUTH_SECRET = 'correct-secret'
    const result = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'alice@example.com',
        'X-Chm-Proxy-Secret': 'correct-secret',
      })
    )
    expect(result.authenticated).toBe(true)
    expect(result.subject).toBe('alice@example.com')
  })

  test('denies on secret mismatch (constant-time)', async () => {
    process.env.CHM_TRUSTED_AUTH_SECRET = 'correct-secret'
    for (const wrong of [
      'correct-secreX',
      'correct-secret!',
      'correct-secre',
    ]) {
      const result = await provider.authenticateRequest(
        makeRequest({
          'X-Forwarded-User': 'alice@example.com',
          'X-Chm-Proxy-Secret': wrong,
        })
      )
      expect(result.authenticated).toBe(false)
    }
  })

  test('uses a custom shared-secret header name', async () => {
    process.env.CHM_TRUSTED_AUTH_SECRET = 'secret123'
    process.env.CHM_TRUSTED_SHARED_SECRET_HEADER = 'X-Internal-Token'
    const result = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'alice@example.com',
        'X-Internal-Token': 'secret123',
      })
    )
    expect(result.authenticated).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Identity extraction
// ---------------------------------------------------------------------------

describe('TrustedAuthProvider — identity extraction', () => {
  beforeEach(() => {
    process.env.CHM_TRUSTED_ALLOW_INSECURE = 'true'
  })

  test('denies when no identity header is present', async () => {
    const result = await provider.authenticateRequest(makeRequest())
    expect(result.authenticated).toBe(false)
  })

  test('falls back to the email header for the subject', async () => {
    const result = await provider.authenticateRequest(
      makeRequest({ 'X-Forwarded-Email': 'bob@example.com' })
    )
    expect(result.authenticated).toBe(true)
    expect(result.subject).toBe('bob@example.com')
    expect(result.principal?.email).toBe('bob@example.com')
  })

  test('builds a full principal from standard oauth2-proxy headers', async () => {
    const result = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'alice',
        'X-Forwarded-Email': 'alice@example.com',
        'X-Forwarded-Preferred-Username': 'Alice Liddell',
        'X-Forwarded-Avatar': 'https://cdn.example.com/alice.png',
        'X-Forwarded-Groups': 'admins,sre,oncall',
      })
    )
    expect(result.authenticated).toBe(true)
    expect(result.principal).toEqual({
      subject: 'alice',
      name: 'Alice Liddell',
      email: 'alice@example.com',
      avatarUrl: 'https://cdn.example.com/alice.png',
      roles: ['admins', 'sre', 'oncall'],
    })
  })

  test('merges and de-duplicates groups + role header', async () => {
    const result = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'alice',
        'X-Forwarded-Groups': 'admins, sre',
        'X-Forwarded-Role': 'admins',
      })
    )
    expect(result.principal?.roles).toEqual(['admins', 'sre'])
  })

  test('maps custom headers into principal.custom', async () => {
    process.env.CHM_TRUSTED_CUSTOM_HEADERS = 'team:X-Forwarded-Team,dept:X-Dept'
    const result = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'alice',
        'X-Forwarded-Team': 'platform',
        'X-Dept': 'engineering',
      })
    )
    expect(result.principal?.custom).toEqual({
      team: 'platform',
      dept: 'engineering',
    })
  })

  test('honors custom identity header names', async () => {
    process.env.CHM_TRUSTED_USER_HEADER = 'X-Auth-Request-User'
    process.env.CHM_TRUSTED_EMAIL_HEADER = 'X-Auth-Request-Email'
    const result = await provider.authenticateRequest(
      makeRequest({
        'X-Auth-Request-User': 'carol',
        'X-Auth-Request-Email': 'carol@example.com',
      })
    )
    expect(result.authenticated).toBe(true)
    expect(result.subject).toBe('carol')
    expect(result.principal?.email).toBe('carol@example.com')
  })

  test('omits optional fields when their headers are absent', async () => {
    const result = await provider.authenticateRequest(
      makeRequest({ 'X-Forwarded-User': 'alice' })
    )
    expect(result.principal).toEqual({ subject: 'alice' })
  })
})

// ---------------------------------------------------------------------------
// Group gating (permission matrix combination)
// ---------------------------------------------------------------------------

describe('TrustedAuthProvider — group gating', () => {
  beforeEach(() => {
    process.env.CHM_TRUSTED_ALLOW_INSECURE = 'true'
    process.env.CHM_TRUSTED_ALLOWED_GROUPS = 'sre, platform-admins'
  })

  test('allows a user in an allowed group (case-insensitive)', async () => {
    const result = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'alice',
        'X-Forwarded-Groups': 'developers,SRE',
      })
    )
    expect(result.authenticated).toBe(true)
  })

  test('denies a user with no matching group', async () => {
    const result = await provider.authenticateRequest(
      makeRequest({
        'X-Forwarded-User': 'mallory',
        'X-Forwarded-Groups': 'interns',
      })
    )
    expect(result.authenticated).toBe(false)
  })

  test('denies an authenticated user carrying no groups', async () => {
    const result = await provider.authenticateRequest(
      makeRequest({ 'X-Forwarded-User': 'alice' })
    )
    expect(result.authenticated).toBe(false)
  })
})
