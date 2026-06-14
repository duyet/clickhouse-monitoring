import type { BrowserConnection } from '@/lib/types/browser-connection'

import { apiFetch } from '@/lib/swr/api-fetch'

interface SessionCacheEntry {
  token: string
  expiresAt: number
}

const sessionCache = new Map<string, SessionCacheEntry>()

function isExpired(entry: SessionCacheEntry): boolean {
  return entry.expiresAt <= Date.now() + 30_000
}

export async function getBrowserConnectionSessionToken(
  connection: BrowserConnection
): Promise<string> {
  const cached = sessionCache.get(connection.id)
  if (cached && !isExpired(cached)) {
    return cached.token
  }

  const response = await apiFetch('/api/v1/browser-connections/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: connection.host,
      user: connection.user,
      password: connection.password,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to create connection session')
  }

  const json = (await response.json()) as {
    success?: boolean
    data?: { sessionToken: string; expiresAt: number }
    error?: { message?: string }
  }

  if (!json.success || !json.data?.sessionToken) {
    throw new Error(
      json.error?.message ?? 'Failed to create connection session'
    )
  }

  sessionCache.set(connection.id, {
    token: json.data.sessionToken,
    expiresAt: json.data.expiresAt,
  })

  return json.data.sessionToken
}

export function invalidateBrowserConnectionSession(connectionId: string): void {
  sessionCache.delete(connectionId)
}
