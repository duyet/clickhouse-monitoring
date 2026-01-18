/**
 * Authentication module exports
 * Provides authentication configuration, permissions, and host management
 */

// Types exports
export type { Organization, Session, User } from './types'

// Config exports
export {
  type AuthConfig,
  type DatabaseAdapter,
  type DeploymentMode,
  detectDatabaseAdapter,
  getAuthConfig,
  getDeploymentMode,
  isAuthEnabled,
  isCloudMode,
  isSelfHosted,
} from './config'
// Hosts exports
export {
  type AuthContext,
  getEnvHosts,
  getHost,
  getHosts,
  getPrimaryHost,
  type Host,
  isHostAccessible,
} from './hosts'
// Permissions exports
export {
  getAllRoles,
  getAssignableRoles,
  getPermissionsForRole,
  getRoleDescription,
  getRoleHierarchy,
  hasPermission,
  isRoleEqualOrHigherThan,
  isRoleHigherThan,
  type Permission,
  permissions,
  type Role,
} from './permissions'
