/**
 * Role-based access control (RBAC) and permission management
 * Defines roles, permissions, and permission checking logic
 */

/**
 * Available roles in the system
 * - owner: Full control over organization, billing, and members
 * - admin: Administrative operations, member management, query control
 * - member: Standard user with query execution and read access
 * - viewer: Read-only access to dashboards and data
 * - guest: Limited read-only access (unauthenticated or guest user)
 */
export type Role = 'owner' | 'admin' | 'member' | 'viewer' | 'guest'

/**
 * All available permissions in the system
 * Maps permission string to list of roles that can perform it
 */
export const permissions = {
  'view:dashboard': ['owner', 'admin', 'member', 'viewer', 'guest'],
  'view:tables': ['owner', 'admin', 'member', 'viewer', 'guest'],
  'view:queries': ['owner', 'admin', 'member', 'viewer', 'guest'],
  'view:clusters': ['owner', 'admin', 'member', 'viewer', 'guest'],
  'execute:query': ['owner', 'admin', 'member', 'guest'],
  'kill:query': ['owner', 'admin', 'member'],
  'manage:hosts': ['owner', 'admin'],
  'invite:members': ['owner', 'admin'],
  'change:roles': ['owner'],
  'manage:settings': ['owner', 'admin'],
  'manage:billing': ['owner'],
  'delete:org': ['owner'],
} as const

/**
 * All available permissions as a type
 */
export type Permission = keyof typeof permissions

/**
 * Checks if a role has permission to perform an action
 *
 * @param role - The role to check
 * @param permission - The permission to verify
 * @returns True if the role has the permission, false otherwise
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const allowedRoles = permissions[permission] as readonly Role[] | undefined
  if (!allowedRoles) {
    return false
  }

  return allowedRoles.includes(role)
}

/**
 * Gets all permissions available to a specific role
 *
 * @param role - The role to get permissions for
 * @returns Array of permission strings available to this role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  const rolePermissions: Permission[] = []

  for (const [permission, allowedRoles] of Object.entries(permissions)) {
    if ((allowedRoles as readonly Role[]).includes(role)) {
      rolePermissions.push(permission as Permission)
    }
  }

  return rolePermissions
}

/**
 * Gets the role hierarchy level (higher number = more permissions)
 * Useful for comparing roles
 *
 * @param role - The role to get hierarchy level for
 * @returns Numeric hierarchy level
 */
export function getRoleHierarchy(role: Role): number {
  const hierarchy: Record<Role, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
    guest: 0,
  }

  return hierarchy[role]
}

/**
 * Checks if one role is higher in the hierarchy than another
 *
 * @param role1 - The first role
 * @param role2 - The second role (to compare against)
 * @returns True if role1 has higher hierarchy than role2
 */
export function isRoleHigherThan(role1: Role, role2: Role): boolean {
  return getRoleHierarchy(role1) > getRoleHierarchy(role2)
}

/**
 * Checks if one role is equal or higher in the hierarchy than another
 *
 * @param role1 - The first role
 * @param role2 - The second role (to compare against)
 * @returns True if role1 has equal or higher hierarchy than role2
 */
export function isRoleEqualOrHigherThan(role1: Role, role2: Role): boolean {
  return getRoleHierarchy(role1) >= getRoleHierarchy(role2)
}

/**
 * Gets human-readable description for a role
 *
 * @param role - The role to get description for
 * @returns Description string
 */
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    owner: 'Full control over organization, billing, and members',
    admin: 'Administrative operations and member management',
    member: 'Can execute queries and view dashboards',
    viewer: 'Read-only access to dashboards and data',
    guest: 'Limited read-only access without authentication',
  }

  return descriptions[role]
}

/**
 * Gets all available roles
 *
 * @returns Array of all role strings
 */
export function getAllRoles(): Role[] {
  return ['owner', 'admin', 'member', 'viewer', 'guest']
}

/**
 * Gets editable roles (roles that can be assigned to organization members)
 * Owner role cannot be assigned by other owners; guest is not assignable
 *
 * @returns Array of assignable role strings
 */
export function getAssignableRoles(): Exclude<Role, 'owner' | 'guest'>[] {
  return ['admin', 'member', 'viewer']
}
