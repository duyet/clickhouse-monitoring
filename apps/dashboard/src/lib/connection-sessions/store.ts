import type { ConnectionSessionPayload } from './types'

import { SESSION_TTL_MS } from './types'
import { getPlatformBindings } from '@chm/platform'
import {
  decryptCredentials,
  encryptCredentials,
} from '@/lib/connection-store/crypto'

interface SessionRow {
  token: string
  encrypted_payload: string
  user_id: string | null
  fingerprint: string
  expires_at: number
  created_at: number
}

/** In-memory fallback for local dev without D1. */
const memorySessions = new Map<
  string,
  {
    payload: ConnectionSessionPayload
    userId: string | null
    expiresAt: number
  }
>()

function pruneMemorySessions(): void {
  const now = Date.now()
  for (const [token, session] of memorySessions) {
    if (session.expiresAt <= now) memorySessions.delete(token)
  }
}

function getD1(): D1Database | null {
  try {
    return getPlatformBindings().getD1Database('CHM_CLOUD_D1') ?? null
  } catch {
    return null
  }
}

export async function createConnectionSession(
  payload: ConnectionSessionPayload,
  userId: string | null
): Promise<{ token: string; expiresAt: number }> {
  const token = crypto.randomUUID()
  const now = Date.now()
  const expiresAt = now + SESSION_TTL_MS
  const encrypted = await encryptCredentials({
    host: payload.credentials.host,
    user: payload.credentials.user,
    password: payload.credentials.password,
  })

  const db = getD1()
  if (db) {
    await db
      .prepare(
        `INSERT INTO connection_sessions
         (token, encrypted_payload, user_id, fingerprint, expires_at, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
      .bind(token, encrypted, userId, payload.fingerprint, expiresAt, now)
      .run()
    return { token, expiresAt }
  }

  pruneMemorySessions()
  memorySessions.set(token, { payload, userId, expiresAt })
  return { token, expiresAt }
}

export async function resolveConnectionSession(
  token: string,
  expectedFingerprint?: string,
  expectedUserId?: string | null
): Promise<ConnectionSessionPayload | null> {
  const db = getD1()
  if (db) {
    const row = await db
      .prepare(
        `SELECT token, encrypted_payload, user_id, fingerprint, expires_at, created_at
         FROM connection_sessions WHERE token = ?1`
      )
      .bind(token)
      .first<SessionRow>()

    if (!row || row.expires_at <= Date.now()) {
      if (row) {
        await db
          .prepare(`DELETE FROM connection_sessions WHERE token = ?1`)
          .bind(token)
          .run()
      }
      return null
    }

    if (expectedUserId && row.user_id && row.user_id !== expectedUserId) {
      return null
    }
    if (expectedFingerprint && row.fingerprint !== expectedFingerprint) {
      return null
    }

    const credentials = await decryptCredentials(row.encrypted_payload)
    return { credentials, fingerprint: row.fingerprint }
  }

  pruneMemorySessions()
  const session = memorySessions.get(token)
  if (!session || session.expiresAt <= Date.now()) {
    memorySessions.delete(token)
    return null
  }

  if (expectedUserId && session.userId && session.userId !== expectedUserId) {
    return null
  }
  if (
    expectedFingerprint &&
    session.payload.fingerprint !== expectedFingerprint
  ) {
    return null
  }

  return session.payload
}

export async function revokeConnectionSessionsForFingerprint(
  fingerprint: string
): Promise<void> {
  const db = getD1()
  if (db) {
    await db
      .prepare(`DELETE FROM connection_sessions WHERE fingerprint = ?1`)
      .bind(fingerprint)
      .run()
    return
  }

  for (const [token, session] of memorySessions) {
    if (session.payload.fingerprint === fingerprint) {
      memorySessions.delete(token)
    }
  }
}
