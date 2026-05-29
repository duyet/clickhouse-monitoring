export function getBearerToken(auth: string | null): string | null {
  if (!auth) return null

  const [scheme, ...tokenParts] = auth.trim().split(/\s+/)
  if (scheme?.toLowerCase() !== 'bearer') return null

  const token = tokenParts.join(' ').trim()
  return token || null
}
