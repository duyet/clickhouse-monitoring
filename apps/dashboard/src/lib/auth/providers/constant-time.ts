/**
 * Timing-safe secret comparison, shared by the reverse-proxy auth providers
 * (`proxy`, `trusted`).
 *
 * Both providers trust a proxy-supplied identity header ONLY when a shared
 * secret header matches the configured secret. Comparing that secret with a
 * normal `===` leaks length/prefix information through timing; a single
 * constant-time comparator removes that and avoids the two providers drifting
 * apart on a security-critical primitive.
 */

/** Constant-time byte comparison. Returns false immediately on length mismatch. */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false

  let diff = 0
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index]
  }

  return diff === 0
}

/** Constant-time string secret comparison (UTF-8 encoded). */
export function secretsMatch(provided: string, expected: string): boolean {
  const encoder = new TextEncoder()
  return constantTimeEqual(encoder.encode(provided), encoder.encode(expected))
}
