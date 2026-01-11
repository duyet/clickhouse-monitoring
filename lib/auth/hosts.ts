/**
 * Host resolution logic for multi-host support
 * Handles both environment-based and database-based host configurations
 */

/**
 * ClickHouse host configuration
 */
export interface Host {
  /** Unique host identifier */
  id: string
  /** Display name for the host */
  name: string
  /** ClickHouse server hostname/IP */
  host: string
  /** ClickHouse username */
  username: string
  /** Source of this host configuration */
  source: 'env' | 'database'
}

/**
 * User session information
 */
export interface Session {
  /** User ID */
  userId: string
  /** User email */
  email: string
  /** User role */
  role: 'owner' | 'admin' | 'member' | 'viewer' | 'guest'
}

/**
 * Authentication context for host resolution
 */
export interface AuthContext {
  /** Current user session, null if unauthenticated */
  session: Session | null
  /** Organization ID (for cloud/multi-tenant mode) */
  organizationId?: string
}

/**
 * Visibility mode for environment-based hosts
 */
export type EnvHostsVisibility = 'all' | 'guest' | 'none'

/**
 * Parses comma-separated environment variables into arrays
 * Safely handles empty strings and returns empty arrays
 *
 * @param envValue - Comma-separated string or undefined
 * @returns Array of non-empty values
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
 * Parses CLICKHOUSE_HOST, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD, CLICKHOUSE_NAME
 *
 * @returns Array of hosts from environment variables
 */
export function getEnvHosts(): Host[] {
  if (typeof process === 'undefined' || !process.env) {
    return []
  }

  const hosts = parseEnvList(process.env.CLICKHOUSE_HOST)
  const users = parseEnvList(process.env.CLICKHOUSE_USER)
  const names = parseEnvList(process.env.CLICKHOUSE_NAME)

  // Return empty if no hosts configured
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
 * Defaults to 'all' for backward compatibility
 *
 * @returns Visibility mode
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
 *
 * @param ctx - Authentication context
 * @returns True if env hosts should be visible
 */
function shouldShowEnvHosts(ctx: AuthContext): boolean {
  const visibility = getEnvHostsVisibility()

  switch (visibility) {
    case 'all':
      // Always show env hosts
      return true

    case 'guest':
      // Show only to guests (unauthenticated users)
      return ctx.session === null

    case 'none':
      // Never show env hosts
      return false

    default:
      return false
  }
}

/**
 * Checks if a database is configured
 * Mirrors isAuthEnabled logic but checks database availability
 */
function isDatabaseConfigured(): boolean {
  if (typeof process === 'undefined' || !process.env) {
    return false
  }

  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl) {
    return true
  }

  if (typeof globalThis !== 'undefined' && (globalThis as any).AUTH_DB) {
    return true
  }

  return false
}

/**
 * Gets all available ClickHouse hosts based on authentication context
 *
 * Host resolution logic:
 * - If auth is not enabled: return env hosts
 * - If guest (no session): return env hosts based on ENV_HOSTS_VISIBILITY
 * - If cloud mode + authenticated: return ONLY database hosts (no env hosts)
 * - If self-hosted + authenticated: return env + database hosts or database only based on visibility
 *
 * @param ctx - Authentication context
 * @returns Array of available hosts
 */
export function getHosts(ctx: AuthContext): Host[] {
  const envHosts = getEnvHosts()
  const isDatabaseSetup = isDatabaseConfigured()

  // If database is not configured, return env hosts only
  if (!isDatabaseSetup) {
    return envHosts
  }

  // Check visibility settings for both authenticated and unauthenticated users
  if (!shouldShowEnvHosts(ctx)) {
    return []
  }

  // Auth is enabled and env hosts should be shown
  // In this phase, we don't have database adapter yet
  // So we'll return env hosts
  // This will be enhanced in Phase 2 when database hosts are implemented

  return envHosts
}

/**
 * Gets a single host by ID
 *
 * @param ctx - Authentication context
 * @param hostId - Host ID to retrieve
 * @returns The host or null if not found or not accessible
 */
export function getHost(ctx: AuthContext, hostId: string): Host | null {
  const hosts = getHosts(ctx)
  return hosts.find((h) => h.id === hostId) || null
}

/**
 * Checks if a host is accessible by the current user
 *
 * @param ctx - Authentication context
 * @param hostId - Host ID to check
 * @returns True if the host is accessible
 */
export function isHostAccessible(ctx: AuthContext, hostId: string): boolean {
  const host = getHost(ctx, hostId)
  return host !== null
}

/**
 * Gets the primary/default host for the current user
 *
 * @param ctx - Authentication context
 * @returns The first available host or null if none available
 */
export function getPrimaryHost(ctx: AuthContext): Host | null {
  const hosts = getHosts(ctx)
  return hosts.length > 0 ? hosts[0] : null
}
