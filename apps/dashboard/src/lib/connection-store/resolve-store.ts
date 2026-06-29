import type { ConnectionStore } from './types'

import { D1ConnectionStore } from './d1-store'
import { getUserConnectionsServerConfig } from './server-feature'
import { ConnectionStoreError } from './types'
import { getPlatformBindings } from '@chm/platform'

const D1_BINDING_NAME = 'CHM_CLOUD_D1'
const DATABASE_URL = 'DATABASE_URL'

export async function resolveConnectionStore(): Promise<ConnectionStore> {
  const config = getUserConnectionsServerConfig()
  if (!config.dbStorageEnabled) {
    throw new ConnectionStoreError(
      'User connections database storage is not enabled',
      'NOT_CONFIGURED'
    )
  }

  try {
    const db = getPlatformBindings().getD1Database(D1_BINDING_NAME)
    if (db) {
      return new D1ConnectionStore()
    }
  } catch {
    // not CF
  }

  if (process.env[DATABASE_URL] || process.env.POSTGRES_URL) {
    const { PostgresConnectionStore } = await import('./postgres-store')
    return new PostgresConnectionStore()
  }

  throw new ConnectionStoreError(
    'No database backend configured for user connections',
    'NOT_CONFIGURED'
  )
}

export function isConnectionStoreResolvable(): boolean {
  return getUserConnectionsServerConfig().dbStorageEnabled
}
