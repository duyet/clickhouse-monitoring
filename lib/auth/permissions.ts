/**
 * Role-based access control (RBAC) and permission management
 */

/**
 * Available roles in the system (ordered by hierarchy level)
 */
export type Role = 'owner' | 'admin' | 'member' | 'viewer' | 'guest'

/**
 * Role hierarchy levels (higher = more permissions)
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
  guest: 0,
}

/**
 * Role descriptions for display
 */
const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: 'Full control over organization, billing, and members',
  admin: 'Administrative operations and member management',
  member: 'Can execute queries and view dashboards',
  viewer: 'Read-only access to dashboards and data',
  guest: 'Limited read-only access without authentication',
}

/**
 * All available permissions mapped to allowed roles
 */
export const permissions: Record<string, readonly Role[]> = {
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
}

export type Permission = keyof typeof permissions

/**
 * Checks if a role has permission to perform an action
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const allowedRoles = permissions[permission] as readonly Role[] | undefined
  return allowedRoles?.includes(role) ?? false
}

/**
 * Gets all permissions available to a specific role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return Object.entries(permissions)
    .filter(([, allowedRoles]) => allowedRoles.includes(role))
    .map(([permission]) => permission as Permission)
}

/**
 * Gets the role hierarchy level (higher number = more permissions)
 */
export function getRoleHierarchy(role: Role): number {
  return ROLE_HIERARCHY[role]
}

/**
 * Checks if role1 is higher in the hierarchy than role2
 */
export function isRoleHigherThan(role1: Role, role2: Role): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2]
}

/**
 * Checks if role1 is equal or higher in the hierarchy than role2
 */
export function isRoleEqualOrHigherThan(role1: Role, role2: Role): boolean {
  return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2]
}

/**
 * Gets human-readable description for a role
 */
export function getRoleDescription(role: Role): string {
  return ROLE_DESCRIPTIONS[role]
}

/**
 * Gets all available roles
 */
export function getAllRoles(): Role[] {
  return ['owner', 'admin', 'member', 'viewer', 'guest']
}

/**
 * Gets roles that can be assigned to organization members
 * (owner role cannot be assigned; guest is not assignable)
 */
export function getAssignableRoles(): Exclude<Role, 'owner' | 'guest'>[] {
  return ['admin', 'member', 'viewer']
}
