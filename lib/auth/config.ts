/**
 * Authentication configuration and deployment mode detection
 * Handles environment parsing and auth enablement logic for self-hosted and cloud deployments
 */

/**
 * Supported deployment modes
 * - self-hosted: Auth optional, no multi-tenant support
 * - cloud: Auth required, multi-tenant support
 */
export type DeploymentMode = 'self-hosted' | 'cloud'

/**
 * Supported database adapters for auth backend
 */
export type DatabaseAdapter = 'd1' | 'postgres' | 'libsql' | 'sqlite' | 'none'

/**
 * Authentication configuration
 */
export interface AuthConfig {
  deploymentMode: DeploymentMode
  databaseAdapter: DatabaseAdapter
  isEnabled: boolean
  hasAuthSecret: boolean
  hasOAuthConfig: boolean
}

/**
 * Detects the current deployment mode from environment variables
 * Defaults to 'self-hosted' if not explicitly configured
 *
 * @returns The detected deployment mode
 */
export function getDeploymentMode(): DeploymentMode {
  if (typeof process === 'undefined' || !process.env) {
    return 'self-hosted'
  }

  const mode = process.env.DEPLOYMENT_MODE?.toLowerCase() as
    | DeploymentMode
    | undefined
  if (mode === 'cloud' || mode === 'self-hosted') {
    return mode
  }

  return 'self-hosted'
}

/**
 * Auto-detects the database adapter from DATABASE_URL scheme
 * Also checks for Cloudflare D1 binding in globalThis
 *
 * Scheme detection:
 * - postgres://, postgresql:// → 'postgres'
 * - d1, d1:// → 'd1'
 * - file:, sqlite: → 'sqlite'
 * - libsql:// → 'libsql'
 * - No DATABASE_URL set → 'none' (unless D1 binding exists)
 *
 * @returns The detected database adapter
 */
export function detectDatabaseAdapter(): DatabaseAdapter {
  // Check for Cloudflare D1 binding first
  if (typeof globalThis !== 'undefined' && (globalThis as any).AUTH_DB) {
    return 'd1'
  }

  if (typeof process === 'undefined' || !process.env) {
    return 'none'
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    return 'none'
  }

  const url = databaseUrl.toLowerCase()

  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    return 'postgres'
  }

  if (url.startsWith('d1') || url.startsWith('d1://')) {
    return 'd1'
  }

  if (url.startsWith('file:') || url.startsWith('sqlite:')) {
    return 'sqlite'
  }

  if (url.startsWith('libsql://')) {
    return 'libsql'
  }

  return 'none'
}

/**
 * Checks if authentication is enabled
 *
 * Auth is enabled when ALL of the following are true:
 * - A database adapter is configured (DATABASE_URL set or D1 binding exists)
 * - Either AUTH_SECRET is set OR OAuth provider is configured
 *
 * @returns Whether authentication is enabled
 */
export function isAuthEnabled(): boolean {
  const databaseAdapter = detectDatabaseAdapter()
  if (databaseAdapter === 'none') {
    return false
  }

  if (typeof process === 'undefined' || !process.env) {
    return false
  }

  // Check for AUTH_SECRET
  const hasAuthSecret = !!process.env.AUTH_SECRET

  // Check for OAuth provider configuration (at least one required)
  const hasGithubOAuth = !!(
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
  )
  const hasGoogleOAuth = !!(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  )
  const hasOAuthConfig = hasGithubOAuth || hasGoogleOAuth

  return hasAuthSecret || hasOAuthConfig
}

/**
 * Gets the complete authentication configuration
 *
 * @returns Authentication configuration object
 */
export function getAuthConfig(): AuthConfig {
  return {
    deploymentMode: getDeploymentMode(),
    databaseAdapter: detectDatabaseAdapter(),
    isEnabled: isAuthEnabled(),
    hasAuthSecret: !!(
      typeof process !== 'undefined' && process.env?.AUTH_SECRET
    ),
    hasOAuthConfig:
      !!(
        typeof process !== 'undefined' &&
        process.env &&
        ((process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) ||
          (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET))
      ) || false,
  }
}

/**
 * Checks if the deployment is in cloud mode
 *
 * @returns True if deployment mode is 'cloud'
 */
export function isCloudMode(): boolean {
  return getDeploymentMode() === 'cloud'
}

/**
 * Checks if the deployment is in self-hosted mode
 *
 * @returns True if deployment mode is 'self-hosted'
 */
export function isSelfHosted(): boolean {
  return getDeploymentMode() === 'self-hosted'
}
