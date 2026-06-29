/**
 * Server-side detection of user-connections database storage availability.
 */

import { isEncryptionConfigured } from './crypto'
import { getPlatformBindings } from '@chm/platform'
import { parseProfile } from '@/lib/config/profile'

const D1_BINDING_NAME = 'CONVERSATIONS_D1'
const DATABASE_URL = 'DATABASE_URL'

function readEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key]
  }
  return undefined
}

function isFeatureFlagEnabled(): boolean {
  const value =
    readEnv('CHM_FEATURE_USER_CONNECTIONS_DB') ??
    readEnv('VITE_FEATURE_USER_CONNECTIONS_DB')
  // Explicit flag wins; otherwise default from the deployment profile so
  // `CHM_PROFILE=cloud` enables per-user connections without an extra flag.
  if (value !== undefined && value !== '')
    return value === 'true' || value === '1'
  return parseProfile(readEnv('CHM_PROFILE')) === 'cloud'
}

function isClerkAuth(): boolean {
  const provider =
    readEnv('CHM_AUTH_PROVIDER') ?? readEnv('VITE_AUTH_PROVIDER') ?? 'none'
  return provider === 'clerk' && Boolean(readEnv('CLERK_SECRET_KEY'))
}

function hasDatabaseBackend(): boolean {
  try {
    const db = getPlatformBindings().getD1Database(D1_BINDING_NAME)
    if (db) return true
  } catch {
    // not CF
  }
  return Boolean(
    readEnv(DATABASE_URL) ??
      readEnv('POSTGRES_URL') ??
      readEnv('POSTGRES_PRISMA_URL')
  )
}

export interface UserConnectionsServerConfig {
  dbStorageEnabled: boolean
  requiresAuth: boolean
  encryptionConfigured: boolean
}

export function getUserConnectionsServerConfig(): UserConnectionsServerConfig {
  const encryptionConfigured = isEncryptionConfigured()
  const requiresAuth = true
  const dbStorageEnabled =
    isFeatureFlagEnabled() &&
    isClerkAuth() &&
    hasDatabaseBackend() &&
    encryptionConfigured

  return { dbStorageEnabled, requiresAuth, encryptionConfigured }
}

export function assertUserConnectionsDbEnabled(): void {
  const config = getUserConnectionsServerConfig()
  if (!config.dbStorageEnabled) {
    throw new Error('User connections database storage is not enabled')
  }
}
