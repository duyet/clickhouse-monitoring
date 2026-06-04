/**
 * Reverse-proxy auth provider.
 *
 * Authenticates requests that arrive through a TRUSTED reverse proxy (the proxy
 * does the real login; the worker trusts the proxy's verdict). Two independent
 * mechanisms are supported; the first that succeeds authenticates the request:
 *
 *   (a) Cloudflare Access — a signed `Cf-Access-Jwt-Assertion` JWT, verified
 *       cryptographically against the team's JWKS. This needs no shared secret
 *       because the signature is the proof.
 *
 *   (b) Trusted header + shared secret — the proxy sets an identity header and
 *       a shared-secret header; we trust the identity ONLY when the secret
 *       matches (constant-time).
 *
 * SECURITY: mechanism (b) is unsafe WITHOUT the shared secret. On a
 * publicly-reachable worker any client can forge `X-Forwarded-User`, so header
 * trust is gated on `CHM_PROXY_AUTH_SECRET` being set and matched. Never enable
 * proxy auth on a publicly-reachable worker that strips neither header nor
 * checks the secret — only put it behind a proxy that overwrites these headers.
 */

import type { AuthResult, ServerAuthProvider } from './types'

const CF_ACCESS_JWT_HEADER = 'Cf-Access-Jwt-Assertion'
const DEFAULT_SHARED_SECRET_HEADER = 'X-Chm-Proxy-Secret'
const DEFAULT_IDENTITY_HEADER = 'X-Forwarded-User'
// Cache JWKS keys for ~1h to avoid fetching certs on every request.
const JWKS_TTL_MS = 60 * 60 * 1000

interface CachedKey {
  key: CryptoKey
  expiresAt: number
}

// In-module JWKS cache keyed by JWT `kid`. Cleared on TTL expiry per kid.
const jwksCache = new Map<string, CachedKey>()

function unb64url(input: string): Uint8Array<ArrayBuffer> | null {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  try {
    const binary = atob(padded)
    // Allocate an explicitly ArrayBuffer-backed view so the bytes satisfy
    // crypto.subtle's BufferSource (Uint8Array.from widens to ArrayBufferLike).
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  } catch {
    return null
  }
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false

  let diff = 0
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index]
  }

  return diff === 0
}

interface JwtParts {
  header: { kid?: string; alg?: string }
  payload: Record<string, unknown>
  signingInput: Uint8Array<ArrayBuffer>
  signature: Uint8Array<ArrayBuffer>
}

function decodeJwt(token: string): JwtParts | null {
  const segments = token.split('.')
  if (segments.length !== 3) return null
  const [headerEnc, payloadEnc, sigEnc] = segments

  const headerBytes = unb64url(headerEnc)
  const payloadBytes = unb64url(payloadEnc)
  const signature = unb64url(sigEnc)
  if (!headerBytes || !payloadBytes || !signature) return null

  try {
    const header = JSON.parse(new TextDecoder().decode(headerBytes)) as {
      kid?: string
      alg?: string
    }
    const payload = JSON.parse(
      new TextDecoder().decode(payloadBytes)
    ) as Record<string, unknown>
    return {
      header,
      payload,
      signingInput: new TextEncoder().encode(`${headerEnc}.${payloadEnc}`),
      signature,
    }
  } catch {
    return null
  }
}

interface Jwk extends JsonWebKey {
  kid?: string
}

async function getVerificationKey(
  teamDomain: string,
  kid: string
): Promise<CryptoKey | null> {
  const cached = jwksCache.get(kid)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.key
  }

  let res: Response
  try {
    res = await fetch(`${teamDomain}/cdn-cgi/access/certs`, {
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    return null
  }
  if (!res.ok) return null

  let jwks: { keys?: Jwk[] }
  try {
    jwks = (await res.json()) as { keys?: Jwk[] }
  } catch {
    return null
  }

  const jwk = jwks.keys?.find((k) => k.kid === kid)
  if (!jwk) return null

  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    )
    jwksCache.set(kid, { key, expiresAt: Date.now() + JWKS_TTL_MS })
    return key
  } catch {
    return null
  }
}

/**
 * Verify a Cloudflare Access JWT. Returns the authenticated principal, or null
 * when the header is absent, Access is unconfigured, or verification fails.
 */
async function verifyCfAccess(request: Request): Promise<AuthResult | null> {
  const teamDomain = process.env.CHM_CF_ACCESS_TEAM_DOMAIN
  const expectedAud = process.env.CHM_CF_ACCESS_AUD
  // Access is opt-in: skip this mechanism entirely when unconfigured.
  if (!teamDomain || !expectedAud) return null

  const token = request.headers.get(CF_ACCESS_JWT_HEADER)
  if (!token) return null

  const issuer = teamDomain.replace(/\/$/, '')

  const parts = decodeJwt(token)
  if (!parts || parts.header.alg !== 'RS256' || !parts.header.kid) {
    return { authenticated: false }
  }

  const key = await getVerificationKey(issuer, parts.header.kid)
  if (!key) return { authenticated: false }

  let verified: boolean
  try {
    verified = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      parts.signature,
      parts.signingInput
    )
  } catch {
    return { authenticated: false }
  }
  if (!verified) return { authenticated: false }

  const { aud, iss, exp, email, sub } = parts.payload as {
    aud?: string | string[]
    iss?: string
    exp?: number
    email?: string
    sub?: string
  }

  const audList = Array.isArray(aud) ? aud : aud ? [aud] : []
  if (!audList.includes(expectedAud)) return { authenticated: false }
  if (iss !== issuer) return { authenticated: false }
  if (typeof exp !== 'number' || exp <= Math.floor(Date.now() / 1000)) {
    return { authenticated: false }
  }

  return { authenticated: true, subject: email ?? sub }
}

/**
 * Verify a trusted identity header gated by a shared secret. Returns the
 * principal when the secret matches AND a non-empty identity header is present;
 * null when the shared secret is unconfigured (mechanism disabled) or absent.
 */
function verifyTrustedHeader(request: Request): AuthResult | null {
  const sharedSecret = process.env.CHM_PROXY_AUTH_SECRET
  // Header trust is unsafe without a shared secret — disable the mechanism.
  if (!sharedSecret) return null

  const secretHeader =
    process.env.CHM_PROXY_SHARED_SECRET_HEADER ?? DEFAULT_SHARED_SECRET_HEADER
  const provided = request.headers.get(secretHeader)
  if (!provided) return null

  const encoder = new TextEncoder()
  if (
    !constantTimeEqual(encoder.encode(provided), encoder.encode(sharedSecret))
  ) {
    return { authenticated: false }
  }

  const identityHeader =
    process.env.CHM_PROXY_AUTH_HEADER ?? DEFAULT_IDENTITY_HEADER
  const subject = request.headers.get(identityHeader)
  if (!subject) return { authenticated: false }

  return { authenticated: true, subject }
}

export class ProxyAuthProvider implements ServerAuthProvider {
  async authenticateRequest(request: Request): Promise<AuthResult> {
    // Try Cloudflare Access first; its signed JWT is self-proving.
    const cfAccess = await verifyCfAccess(request)
    if (cfAccess?.authenticated) return cfAccess

    // Then the trusted header + shared secret.
    const trustedHeader = verifyTrustedHeader(request)
    if (trustedHeader?.authenticated) return trustedHeader

    return { authenticated: false }
  }
}
