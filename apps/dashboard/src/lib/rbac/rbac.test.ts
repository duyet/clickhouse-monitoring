// Tests for the RBAC scaffold.
// Key invariant: community / RBAC-disabled = all-access (fail-open to free).
// RBAC enforcement only activates under enterprise edition with rbac feature on.

import {
  COMMUNITY_ROLE,
  canPerform,
  hasPermission,
  type Permission,
  type Role,
} from './rbac'
import { describe, expect, test } from 'bun:test'

// ---------------------------------------------------------------------------
// hasPermission
// ---------------------------------------------------------------------------
describe('hasPermission', () => {
  test("wildcard '*' permissions grant everything", () => {
    const permissions: Permission[] = [
      'query:read',
      'query:kill',
      'config:write',
      'cluster:admin',
      'table:read',
      'table:write',
      'metric:read',
      'insight:write',
    ]
    for (const p of permissions) {
      expect(hasPermission(COMMUNITY_ROLE, p)).toBe(true)
    }
  })

  test('explicit allow-list includes a granted permission', () => {
    const role: Role = {
      id: 'viewer',
      name: 'Viewer',
      permissions: ['query:read', 'metric:read', 'table:read'],
    }
    expect(hasPermission(role, 'query:read')).toBe(true)
    expect(hasPermission(role, 'metric:read')).toBe(true)
    expect(hasPermission(role, 'table:read')).toBe(true)
  })

  test('explicit allow-list excludes a missing permission', () => {
    const role: Role = {
      id: 'viewer',
      name: 'Viewer',
      permissions: ['query:read', 'metric:read'],
    }
    expect(hasPermission(role, 'query:kill')).toBe(false)
    expect(hasPermission(role, 'config:write')).toBe(false)
    expect(hasPermission(role, 'cluster:admin')).toBe(false)
  })

  test('empty permission list denies everything', () => {
    const role: Role = {
      id: 'empty',
      name: 'Empty',
      permissions: [],
    }
    expect(hasPermission(role, 'query:read')).toBe(false)
    expect(hasPermission(role, 'cluster:admin')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// canPerform — community / RBAC-disabled (fail-open to free)
// ---------------------------------------------------------------------------
describe('canPerform — community edition (rbac disabled)', () => {
  const communityEnv = { CHM_EDITION: 'community' }

  test('fail-open: default env → cluster:admin allowed', () => {
    // The most critical assertion: no env = community = all-access.
    expect(canPerform('cluster:admin')).toBe(true)
  })

  test('fail-open: community edition → all permissions allowed', () => {
    const permissions: Permission[] = [
      'query:read',
      'query:kill',
      'config:write',
      'cluster:admin',
      'table:read',
      'table:write',
      'metric:read',
      'insight:write',
    ]
    for (const p of permissions) {
      expect(canPerform(p, { runtimeEnv: communityEnv })).toBe(true)
    }
  })

  test('fail-open: community edition + restrictive role → still allowed', () => {
    // Even if a restrictive role is provided, community edition is all-access.
    const restrictiveRole: Role = {
      id: 'readonly',
      name: 'Read Only',
      permissions: ['query:read'],
    }
    expect(
      canPerform('cluster:admin', {
        role: restrictiveRole,
        runtimeEnv: communityEnv,
      })
    ).toBe(true)
    expect(
      canPerform('config:write', {
        role: restrictiveRole,
        runtimeEnv: communityEnv,
      })
    ).toBe(true)
  })

  test('fail-open: junk/unset CHM_EDITION → all-access', () => {
    expect(canPerform('cluster:admin', { runtimeEnv: {} })).toBe(true)
    expect(
      canPerform('cluster:admin', { runtimeEnv: { CHM_EDITION: 'junk' } })
    ).toBe(true)
    expect(
      canPerform('cluster:admin', { runtimeEnv: { CHM_EDITION: '' } })
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// canPerform — enterprise edition with rbac enabled
// ---------------------------------------------------------------------------
describe('canPerform — enterprise edition (rbac enabled)', () => {
  const enterpriseEnv = { CHM_EDITION: 'enterprise' }

  test('COMMUNITY_ROLE (wildcard) grants everything under enterprise', () => {
    expect(canPerform('cluster:admin', { runtimeEnv: enterpriseEnv })).toBe(
      true
    )
    expect(canPerform('config:write', { runtimeEnv: enterpriseEnv })).toBe(true)
  })

  test('restrictive role denies a missing permission under enterprise', () => {
    const viewerRole: Role = {
      id: 'viewer',
      name: 'Viewer',
      permissions: ['query:read', 'metric:read', 'table:read'],
    }
    expect(
      canPerform('cluster:admin', {
        role: viewerRole,
        runtimeEnv: enterpriseEnv,
      })
    ).toBe(false)
    expect(
      canPerform('config:write', {
        role: viewerRole,
        runtimeEnv: enterpriseEnv,
      })
    ).toBe(false)
    expect(
      canPerform('query:kill', {
        role: viewerRole,
        runtimeEnv: enterpriseEnv,
      })
    ).toBe(false)
  })

  test('restrictive role grants a listed permission under enterprise', () => {
    const viewerRole: Role = {
      id: 'viewer',
      name: 'Viewer',
      permissions: ['query:read', 'metric:read', 'table:read'],
    }
    expect(
      canPerform('query:read', {
        role: viewerRole,
        runtimeEnv: enterpriseEnv,
      })
    ).toBe(true)
    expect(
      canPerform('metric:read', {
        role: viewerRole,
        runtimeEnv: enterpriseEnv,
      })
    ).toBe(true)
  })
})
