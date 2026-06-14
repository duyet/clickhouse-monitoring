/**
 * Tests for the Cloudflare Access JWT path of the reverse-proxy auth provider
 * (proxy.ts `verifyCfAccess` + its JWT decode / JWKS verify helpers).
 *
 * The existing proxy.test.ts deliberately skips this path ("heavy
 * infrastructure"). bun ships Web Crypto, so we can do it for real: generate an
 * RS256 key pair, sign genuine JWTs, and mock `fetch` to serve the team JWKS.
 * That lets us assert the security-critical behaviour — signature validity,
 * aud/iss/exp checks, algorithm pinning, and the anti-DoS guarantee that an
 * unknown `kid` never triggers an outbound fetch.
 *
 * Cache isolation: proxy.ts keeps a module-level JWKS cache keyed by team
 * domain, so each test uses a UNIQUE team domain to avoid cross-test leakage.
 */

import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from 'bun:test'
import { ProxyAuthProvider } from '@/lib/auth/providers/proxy'

const CF_ACCESS_JWT_HEADER = 'Cf-Access-Jwt-Assertion'
const KID = 'test-kid-1'
const AUD = 'test-audience-tag'

let keyPair: CryptoKeyPair
let publicJwk: JsonWebKey & { kid?: string }

beforeAll(async () => {
  keyPair = (await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  )) as CryptoKeyPair
  publicJwk = (await crypto.subtle.exportKey(
    'jwk',
    keyPair.publicKey
  )) as JsonWebKey & { kid?: string }
  publicJwk.kid = KID
  publicJwk.alg = 'RS256'
})

// ---------------------------------------------------------------------------
// JWT signing helpers (base64url, no padding)
// ---------------------------------------------------------------------------

function b64url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlJson(obj: unknown): string {
  return b64url(new TextEncoder().encode(JSON.stringify(obj)))
}

interface SignOpts {
  alg?: string
  kid?: string | null
  payload: Record<string, unknown>
  tamper?: boolean
}

async function signJwt({
  alg = 'RS256',
  kid = KID,
  payload,
  tamper,
}: SignOpts): Promise<string> {
  const header: Record<string, unknown> = { alg, typ: 'JWT' }
  if (kid !== null) header.kid = kid
  const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`
  const sig = new Uint8Array(
    await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      keyPair.privateKey,
      new TextEncoder().encode(signingInput)
    )
  )
  if (tamper) sig[0] ^= 0xff // flip a byte → signature no longer verifies
  return `${signingInput}.${b64url(sig)}`
}

function futureExp(): number {
  return Math.floor(Date.now() / 1000) + 3600
}

function makeRequest(token?: string): Request {
  const headers: Record<string, string> = {}
  if (token !== undefined) headers[CF_ACCESS_JWT_HEADER] = token
  return new Request('https://example.com/api/v1/test', { headers })
}

// ---------------------------------------------------------------------------
// fetch mock — serves the JWKS for the configured team domain
// ---------------------------------------------------------------------------

const realFetch = globalThis.fetch
let fetchCalls = 0
let domainCounter = 0

/** Unique team domain per test → isolates the module-level JWKS cache. */
function freshTeamDomain(): string {
  domainCounter += 1
  return `https://team-${domainCounter}.cloudflareaccess.com`
}

function installJwksFetch(
  opts: { ok?: boolean; throws?: boolean; keys?: unknown } = {}
) {
  globalThis.fetch = mock(async (input: RequestInfo | URL) => {
    fetchCalls += 1
    const url = typeof input === 'string' ? input : input.toString()
    if (!url.includes('/cdn-cgi/access/certs')) return realFetch(input)
    if (opts.throws) throw new Error('network down')
    if (opts.ok === false) {
      return new Response('nope', { status: 500 })
    }
    const keys = opts.keys ?? [publicJwk]
    return new Response(JSON.stringify({ keys }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof globalThis.fetch
}

const MANAGED_KEYS = ['CHM_CF_ACCESS_TEAM_DOMAIN', 'CHM_CF_ACCESS_AUD']
const originalEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  fetchCalls = 0
  for (const k of MANAGED_KEYS) {
    originalEnv[k] = process.env[k]
    delete process.env[k]
  }
})

afterEach(() => {
  globalThis.fetch = realFetch
  for (const k of MANAGED_KEYS) {
    if (originalEnv[k] === undefined) delete process.env[k]
    else process.env[k] = originalEnv[k]
  }
})

/** Configure CF Access env for a fresh team domain and return the issuer. */
function configureAccess(): string {
  const domain = freshTeamDomain()
  process.env.CHM_CF_ACCESS_TEAM_DOMAIN = domain
  process.env.CHM_CF_ACCESS_AUD = AUD
  return domain
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('verifyCfAccess — valid token', () => {
  test('authenticates a correctly signed token and returns the email subject', async () => {
    const iss = configureAccess()
    installJwksFetch()
    const token = await signJwt({
      payload: { aud: AUD, iss, exp: futureExp(), email: 'alice@example.com' },
    })

    const result = await new ProxyAuthProvider().authenticateRequest(
      makeRequest(token)
    )

    expect(result).toEqual({
      authenticated: true,
      subject: 'alice@example.com',
    })
  })

  test('falls back to sub when email is absent', async () => {
    const iss = configureAccess()
    installJwksFetch()
    const token = await signJwt({
      payload: { aud: AUD, iss, exp: futureExp(), sub: 'user-123' },
    })

    const result = await new ProxyAuthProvider().authenticateRequest(
      makeRequest(token)
    )

    expect(result).toEqual({ authenticated: true, subject: 'user-123' })
  })

  test('accepts aud supplied as an array containing the expected tag', async () => {
    const iss = configureAccess()
    installJwksFetch()
    const token = await signJwt({
      payload: { aud: ['other', AUD], iss, exp: futureExp(), email: 'a@b.c' },
    })

    const result = await new ProxyAuthProvider().authenticateRequest(
      makeRequest(token)
    )

    expect(result.authenticated).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Rejection paths — each returns authenticated:false (fail closed)
// ---------------------------------------------------------------------------

describe('verifyCfAccess — rejections', () => {
  test('rejects a tampered signature', async () => {
    const iss = configureAccess()
    installJwksFetch()
    const token = await signJwt({
      payload: { aud: AUD, iss, exp: futureExp(), email: 'a@b.c' },
      tamper: true,
    })

    const result = await new ProxyAuthProvider().authenticateRequest(
      makeRequest(token)
    )

    expect(result.authenticated).toBe(false)
  })

  test('rejects a wrong audience', async () => {
    const iss = configureAccess()
    installJwksFetch()
    const token = await signJwt({
      payload: { aud: 'wrong-aud', iss, exp: futureExp(), email: 'a@b.c' },
    })

    expect(
      (await new ProxyAuthProvider().authenticateRequest(makeRequest(token)))
        .authenticated
    ).toBe(false)
  })

  test('rejects a wrong issuer', async () => {
    configureAccess()
    installJwksFetch()
    const token = await signJwt({
      payload: {
        aud: AUD,
        iss: 'https://evil.example',
        exp: futureExp(),
        email: 'a@b.c',
      },
    })

    expect(
      (await new ProxyAuthProvider().authenticateRequest(makeRequest(token)))
        .authenticated
    ).toBe(false)
  })

  test('rejects an expired token', async () => {
    const iss = configureAccess()
    installJwksFetch()
    const token = await signJwt({
      payload: {
        aud: AUD,
        iss,
        exp: Math.floor(Date.now() / 1000) - 10,
        email: 'a@b.c',
      },
    })

    expect(
      (await new ProxyAuthProvider().authenticateRequest(makeRequest(token)))
        .authenticated
    ).toBe(false)
  })

  test('rejects a non-RS256 algorithm (algorithm pinning)', async () => {
    const iss = configureAccess()
    installJwksFetch()
    const token = await signJwt({
      alg: 'HS256',
      payload: { aud: AUD, iss, exp: futureExp(), email: 'a@b.c' },
    })

    expect(
      (await new ProxyAuthProvider().authenticateRequest(makeRequest(token)))
        .authenticated
    ).toBe(false)
  })

  test('rejects a token with no kid in the header', async () => {
    const iss = configureAccess()
    installJwksFetch()
    const token = await signJwt({
      kid: null,
      payload: { aud: AUD, iss, exp: futureExp(), email: 'a@b.c' },
    })

    expect(
      (await new ProxyAuthProvider().authenticateRequest(makeRequest(token)))
        .authenticated
    ).toBe(false)
  })

  test('rejects a malformed token (not three segments)', async () => {
    configureAccess()
    installJwksFetch()

    expect(
      (
        await new ProxyAuthProvider().authenticateRequest(
          makeRequest('not.a.valid.jwt')
        )
      ).authenticated
    ).toBe(false)
  })

  test('rejects when the JWKS fetch returns a non-OK status', async () => {
    const iss = configureAccess()
    installJwksFetch({ ok: false })
    const token = await signJwt({
      payload: { aud: AUD, iss, exp: futureExp(), email: 'a@b.c' },
    })

    expect(
      (await new ProxyAuthProvider().authenticateRequest(makeRequest(token)))
        .authenticated
    ).toBe(false)
  })

  test('rejects when the JWKS fetch throws', async () => {
    const iss = configureAccess()
    installJwksFetch({ throws: true })
    const token = await signJwt({
      payload: { aud: AUD, iss, exp: futureExp(), email: 'a@b.c' },
    })

    expect(
      (await new ProxyAuthProvider().authenticateRequest(makeRequest(token)))
        .authenticated
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Configuration gating + anti-DoS cache behaviour
// ---------------------------------------------------------------------------

describe('verifyCfAccess — config gating and JWKS cache', () => {
  test('is disabled (no token consumed) when team domain / aud are unconfigured', async () => {
    // CF Access env intentionally unset by beforeEach. A token is present but
    // the mechanism must be skipped entirely → fall through to deny.
    installJwksFetch()
    const token = await signJwt({
      payload: { aud: AUD, iss: 'https://x', exp: futureExp(), email: 'a@b.c' },
    })

    const result = await new ProxyAuthProvider().authenticateRequest(
      makeRequest(token)
    )

    expect(result.authenticated).toBe(false)
    expect(fetchCalls).toBe(0) // unconfigured → never fetches JWKS
  })

  test('returns false when the CF Access header is absent', async () => {
    configureAccess()
    installJwksFetch()

    const result = await new ProxyAuthProvider().authenticateRequest(
      makeRequest()
    )

    expect(result.authenticated).toBe(false)
    expect(fetchCalls).toBe(0)
  })

  test('an unknown kid does NOT trigger a second outbound fetch (anti-DoS)', async () => {
    const iss = configureAccess()
    installJwksFetch()
    // First, a valid token warms the cache (one fetch).
    const good = await signJwt({
      payload: { aud: AUD, iss, exp: futureExp(), email: 'a@b.c' },
    })
    await new ProxyAuthProvider().authenticateRequest(makeRequest(good))
    expect(fetchCalls).toBe(1)

    // Then a forged token with an unknown kid must miss the warm cache WITHOUT
    // forcing a refresh — otherwise it's a per-request fetch amplification.
    const forged = await signJwt({
      kid: 'unknown-kid',
      payload: { aud: AUD, iss, exp: futureExp(), email: 'a@b.c' },
    })
    const result = await new ProxyAuthProvider().authenticateRequest(
      makeRequest(forged)
    )

    expect(result.authenticated).toBe(false)
    expect(fetchCalls).toBe(1) // still 1 — no extra fetch for the unknown kid
  })

  test('caches the JWKS across calls with the same kid (one fetch for two valid tokens)', async () => {
    const iss = configureAccess()
    installJwksFetch()
    const t1 = await signJwt({
      payload: { aud: AUD, iss, exp: futureExp(), email: 'a@b.c' },
    })
    const t2 = await signJwt({
      payload: { aud: AUD, iss, exp: futureExp(), email: 'd@e.f' },
    })

    await new ProxyAuthProvider().authenticateRequest(makeRequest(t1))
    await new ProxyAuthProvider().authenticateRequest(makeRequest(t2))

    expect(fetchCalls).toBe(1) // second verification reused the cached key set
  })
})
