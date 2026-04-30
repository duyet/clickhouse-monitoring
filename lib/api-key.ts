import { createHmac, timingSafeEqual } from 'node:crypto'

interface Payload {
  sub: string
  exp: number
  iat: number
}

function getSecret(): string | null {
  return process.env.CHM_API_KEY_SECRET ?? null
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function unb64url(input: string): Buffer {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return Buffer.from(padded, 'base64')
}

export function issueApiKey(sub: string, days = 30): string {
  const secret = getSecret()
  if (!secret) throw new Error('CHM_API_KEY_SECRET is not configured')

  const now = Math.floor(Date.now() / 1000)
  const payload: Payload = { sub, iat: now, exp: now + days * 86400 }
  const payloadEnc = b64url(JSON.stringify(payload))
  const sig = createHmac('sha256', secret).update(payloadEnc).digest()
  return `chm_${payloadEnc}.${b64url(sig)}`
}

export function verifyApiKey(token: string): { valid: boolean; reason?: string; sub?: string } {
  const secret = getSecret()
  if (!secret) return { valid: true }
  if (!token.startsWith('chm_')) return { valid: false, reason: 'invalid prefix' }

  const raw = token.slice(4)
  const [payloadEnc, sigEnc] = raw.split('.')
  if (!payloadEnc || !sigEnc) return { valid: false, reason: 'malformed token' }

  const expected = createHmac('sha256', secret).update(payloadEnc).digest()
  const provided = unb64url(sigEnc)
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return { valid: false, reason: 'bad signature' }
  }

  const payload = JSON.parse(unb64url(payloadEnc).toString('utf8')) as Payload
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp < now) return { valid: false, reason: 'expired' }

  return { valid: true, sub: payload.sub }
}

export function apiKeyAuthEnabled() {
  return Boolean(getSecret())
}
