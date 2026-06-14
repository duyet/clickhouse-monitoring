import type { ConnectionCredentials } from '@/lib/connection-store/types'

export interface ConnectionSessionPayload {
  credentials: ConnectionCredentials
  fingerprint: string
}

export interface ConnectionSessionRecord {
  token: string
  expiresAt: number
}

export const SESSION_TTL_MS = 15 * 60 * 1000

export function connectionFingerprint(
  credentials: ConnectionCredentials
): string {
  return `${credentials.host}|${credentials.user}`
}
