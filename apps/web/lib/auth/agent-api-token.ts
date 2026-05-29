import { getBearerToken } from '@/lib/auth/bearer-token'

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false

  let diff = 0
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index]
  }

  return diff === 0
}

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input)
  )
  return new Uint8Array(digest)
}

export async function isValidAgentApiBearerToken(
  request: Request
): Promise<boolean> {
  const expectedToken = process.env.AGENT_API_TOKEN
  if (!expectedToken) {
    return false
  }

  const providedToken = getBearerToken(request.headers.get('authorization'))
  if (!providedToken) {
    return false
  }

  const [expectedHash, providedHash] = await Promise.all([
    sha256(expectedToken),
    sha256(providedToken),
  ])

  return constantTimeEqual(expectedHash, providedHash)
}
