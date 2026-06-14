import type { ConnectionCredentials } from '@/lib/connection-store/types'

import { resolveConnectionSession } from '@/lib/connection-sessions/store'
import {
  type ConnectionSessionPayload,
  connectionFingerprint,
} from '@/lib/connection-sessions/types'

export interface ProxyConnectionInput {
  connection?: {
    host: string
    user: string
    password: string
  }
  sessionToken?: string
}

export async function resolveProxyCredentials(
  input: ProxyConnectionInput,
  userId?: string | null
): Promise<ConnectionCredentials | null> {
  if (input.sessionToken) {
    const session = await resolveConnectionSession(
      input.sessionToken,
      undefined,
      userId
    )
    return session?.credentials ?? null
  }

  if (input.connection?.host && input.connection.user) {
    const password =
      typeof input.connection.password === 'string'
        ? input.connection.password
        : ''
    return {
      host: input.connection.host,
      user: input.connection.user,
      password,
    }
  }

  return null
}

export function toSessionPayload(
  credentials: ConnectionCredentials
): ConnectionSessionPayload {
  return {
    credentials,
    fingerprint: connectionFingerprint(credentials),
  }
}
