import {
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
} from '../permissions'

describe('lib/auth/permissions', () => {
  describe('permissions object', () => {
    it('should have expected permission keys', () => {
      const keys = Object.keys(permissions)
      expect(keys).toContain('view:dashboard')
      expect(keys).toContain('execute:query')
      expect(keys).toContain('kill:query')
      expect(keys).toContain('manage:hosts')
    })

    it('should have role arrays for all permissions', () => {
      Object.values(permissions).forEach((roles) => {
        expect(Array.isArray(roles)).toBe(true)
        expect(roles.length).toBeGreaterThan(0)
      })
    })
  })

  describe('hasPermission', () => {
    it('should return true for owner with any permission', () => {
      const permissionKeys = Object.keys(permissions) as Permission[]
      permissionKeys.forEach((permission) => {
        expect(hasPermission('owner', permission)).toBe(true)
      })
    })

    it('should return true for allowed role and permission', () => {
      expect(hasPermission('member', 'execute:query')).toBe(true)
      expect(hasPermission('viewer', 'view:dashboard')).toBe(true)
      expect(hasPermission('guest', 'view:dashboard')).toBe(true)
    })

    it('should return false for disallowed role and permission', () => {
      expect(hasPermission('member', 'delete:org')).toBe(false)
      expect(hasPermission('guest', 'kill:query')).toBe(false)
      expect(hasPermission('viewer', 'kill:query')).toBe(false)
    })

    it('should correctly evaluate permission hierarchy', () => {
      // Owner > Admin > Member > Viewer > Guest
      expect(hasPermission('owner', 'manage:billing')).toBe(true)
      expect(hasPermission('admin', 'manage:billing')).toBe(false)
      expect(hasPermission('member', 'manage:billing')).toBe(false)

      expect(hasPermission('admin', 'manage:hosts')).toBe(true)
      expect(hasPermission('member', 'manage:hosts')).toBe(false)

      expect(hasPermission('member', 'execute:query')).toBe(true)
      expect(hasPermission('viewer', 'execute:query')).toBe(false)
    })
  })

  describe('getPermissionsForRole', () => {
    it('should return non-empty array for all roles', () => {
      getAllRoles().forEach((role) => {
        const perms = getPermissionsForRole(role)
        expect(Array.isArray(perms)).toBe(true)
        expect(perms.length).toBeGreaterThan(0)
      })
    })

    it('should return more permissions for higher roles', () => {
      const ownerPerms = getPermissionsForRole('owner').length
      const adminPerms = getPermissionsForRole('admin').length
      const memberPerms = getPermissionsForRole('member').length

      expect(ownerPerms).toBeGreaterThanOrEqual(adminPerms)
      expect(adminPerms).toBeGreaterThanOrEqual(memberPerms)
    })

    it('should only include permissions the role has', () => {
      const viewerPerms = getPermissionsForRole('viewer')
      viewerPerms.forEach((perm) => {
        expect(hasPermission('viewer', perm)).toBe(true)
      })

      const memberPerms = getPermissionsForRole('member')
      memberPerms.forEach((perm) => {
        expect(hasPermission('member', perm)).toBe(true)
      })
    })

    it('should not include permissions the role lacks', () => {
      const viewerPerms = getPermissionsForRole('viewer')
      expect(viewerPerms).not.toContain('delete:org')
      expect(viewerPerms).not.toContain('manage:billing')
      expect(viewerPerms).not.toContain('kill:query')
    })
  })

  describe('getRoleHierarchy', () => {
    it('should have correct hierarchy levels', () => {
      expect(getRoleHierarchy('owner')).toBe(4)
      expect(getRoleHierarchy('admin')).toBe(3)
      expect(getRoleHierarchy('member')).toBe(2)
      expect(getRoleHierarchy('viewer')).toBe(1)
      expect(getRoleHierarchy('guest')).toBe(0)
    })

    it('should have descending values for role hierarchy', () => {
      expect(getRoleHierarchy('owner')).toBeGreaterThan(
        getRoleHierarchy('admin')
      )
      expect(getRoleHierarchy('admin')).toBeGreaterThan(
        getRoleHierarchy('member')
      )
      expect(getRoleHierarchy('member')).toBeGreaterThan(
        getRoleHierarchy('viewer')
      )
      expect(getRoleHierarchy('viewer')).toBeGreaterThan(
        getRoleHierarchy('guest')
      )
    })
  })

  describe('isRoleHigherThan', () => {
    it('should return true when first role is higher', () => {
      expect(isRoleHigherThan('owner', 'admin')).toBe(true)
      expect(isRoleHigherThan('admin', 'member')).toBe(true)
      expect(isRoleHigherThan('owner', 'guest')).toBe(true)
    })

    it('should return false when first role is not higher', () => {
      expect(isRoleHigherThan('admin', 'owner')).toBe(false)
      expect(isRoleHigherThan('member', 'admin')).toBe(false)
      expect(isRoleHigherThan('guest', 'owner')).toBe(false)
    })

    it('should return false when roles are equal', () => {
      expect(isRoleHigherThan('owner', 'owner')).toBe(false)
      expect(isRoleHigherThan('member', 'member')).toBe(false)
    })
  })

  describe('isRoleEqualOrHigherThan', () => {
    it('should return true when first role is higher or equal', () => {
      expect(isRoleEqualOrHigherThan('owner', 'admin')).toBe(true)
      expect(isRoleEqualOrHigherThan('owner', 'owner')).toBe(true)
      expect(isRoleEqualOrHigherThan('admin', 'member')).toBe(true)
    })

    it('should return false when first role is lower', () => {
      expect(isRoleEqualOrHigherThan('admin', 'owner')).toBe(false)
      expect(isRoleEqualOrHigherThan('member', 'admin')).toBe(false)
    })
  })

  describe('getRoleDescription', () => {
    it('should return non-empty description for all roles', () => {
      getAllRoles().forEach((role) => {
        const desc = getRoleDescription(role)
        expect(typeof desc).toBe('string')
        expect(desc.length).toBeGreaterThan(0)
      })
    })

    it('should have descriptive text for each role', () => {
      expect(getRoleDescription('owner')).toContain('organization')
      expect(getRoleDescription('admin')).toContain('Administrative')
      expect(getRoleDescription('member')).toContain('execute')
      expect(getRoleDescription('viewer')).toContain('Read-only')
    })
  })

  describe('getAllRoles', () => {
    it('should return all role types', () => {
      const roles = getAllRoles()
      expect(roles).toContain('owner')
      expect(roles).toContain('admin')
      expect(roles).toContain('member')
      expect(roles).toContain('viewer')
      expect(roles).toContain('guest')
    })

    it('should have exactly 5 roles', () => {
      expect(getAllRoles().length).toBe(5)
    })
  })

  describe('getAssignableRoles', () => {
    it('should not include owner or guest', () => {
      const assignable = getAssignableRoles()
      expect(assignable).not.toContain('owner')
      expect(assignable).not.toContain('guest')
    })

    it('should include admin, member, and viewer', () => {
      const assignable = getAssignableRoles()
      expect(assignable).toContain('admin')
      expect(assignable).toContain('member')
      expect(assignable).toContain('viewer')
    })

    it('should have exactly 3 assignable roles', () => {
      expect(getAssignableRoles().length).toBe(3)
    })
  })
})
