/**
 * Host resolution logic for multi-host support
 * Handles both environment-based and database-based host configurations
 */

import type { AuthContext } from './types'

import { isDatabaseConfigured } from './config'

/**
 * ClickHouse host configuration
 */
export interface Host {
  id: string
  name: string
  host: string
  username: string
  source: 'env' | 'database'
}

// Re-export AuthContext for convenience
export type { AuthContext } from './types'

/**
 * Visibility mode for environment-based hosts
 */
export type EnvHostsVisibility = 'all' | 'guest' | 'none'

/**
 * Parses comma-separated environment variables into arrays
 */
function parseEnvList(envValue: string | undefined): string[] {
  if (!envValue) {
    return []
  }

  return envValue
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

/**
 * Gets environment-based host configurations
 */
export function getEnvHosts(): Host[] {
  if (typeof process === 'undefined' || !process.env) {
    return []
  }

  const hosts = parseEnvList(process.env.CLICKHOUSE_HOST)
  const users = parseEnvList(process.env.CLICKHOUSE_USER)
  const names = parseEnvList(process.env.CLICKHOUSE_NAME)

  if (hosts.length === 0) {
    return []
  }

  return hosts.map((host, index) => ({
    id: String(index),
    name: names[index] || `Host ${index}`,
    host,
    username: users[index] || 'default',
    source: 'env' as const,
  }))
}

/**
 * Gets the environment variable visibility mode for hosts
 */
function getEnvHostsVisibility(): EnvHostsVisibility {
  if (typeof process === 'undefined' || !process.env) {
    return 'all'
  }

  const visibility = process.env.ENV_HOSTS_VISIBILITY?.toLowerCase() as
    | EnvHostsVisibility
    | undefined

  return visibility || 'all'
}

/**
 * Determines if environment hosts should be visible to the current user
 */
function shouldShowEnvHosts(ctx: AuthContext): boolean {
  const visibility = getEnvHostsVisibility()

  switch (visibility) {
    case 'all':
      return true
    case 'guest':
      return ctx.session === null
    case 'none':
      return false
    default:
      return false
  }
}

/**
 * Gets all available ClickHouse hosts based on authentication context
 *
 * Host resolution logic:
 * - If database is not configured: return env hosts
 * - If guest (no session): return env hosts based on ENV_HOSTS_VISIBILITY
 * - Otherwise: return env hosts based on visibility setting
 */
export function getHosts(ctx: AuthContext): Host[] {
  const envHosts = getEnvHosts()

  if (!isDatabaseConfigured()) {
    return envHosts
  }

  if (!shouldShowEnvHosts(ctx)) {
    return []
  }

  return envHosts
}

/**
 * Gets a single host by ID
 */
export function getHost(ctx: AuthContext, hostId: string): Host | null {
  const hosts = getHosts(ctx)
  return hosts.find((h) => h.id === hostId) || null
}

/**
 * Checks if a host is accessible by the current user
 */
export function isHostAccessible(ctx: AuthContext, hostId: string): boolean {
  return getHost(ctx, hostId) !== null
}

/**
 * Gets the primary/default host for the current user
 */
export function getPrimaryHost(ctx: AuthContext): Host | null {
  const hosts = getHosts(ctx)
  return hosts[0] || null
}
