/**
 * Authentication module exports
 * Provides authentication configuration, permissions, and host management
 */

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
  type Session,
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
