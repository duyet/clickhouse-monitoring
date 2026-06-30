import type {
  AuthMembershipRow,
  AuthOrgRow,
  AuthUserRow,
} from './identity-sync'

import {
  boolToInt,
  buildMembershipUpsert,
  buildOrgUpsert,
  buildSyncSql,
  buildUserUpsert,
  jsonOrNull,
  msToSeconds,
  sqlNumber,
  sqlString,
} from './identity-sync'
import { describe, expect, it } from 'bun:test'

const userRow: AuthUserRow = {
  externalId: 'user_1',
  providerExternalId: null,
  primaryEmail: 'me@x.com',
  emailVerified: 1,
  phoneNumber: null,
  firstName: "O'Brien",
  lastName: null,
  username: null,
  imageUrl: null,
  hasImage: 0,
  twoFactorEnabled: 1,
  banned: 0,
  locked: 0,
  externalAccounts: '["google"]',
  publicMetadata: null,
  createdAt: 1_717_000_000,
  updatedAt: 1_717_000_000,
  lastSignInAt: null,
  lastActiveAt: null,
}

const orgRow: AuthOrgRow = {
  externalId: 'org_1',
  name: 'Acme',
  slug: 'acme',
  imageUrl: null,
  hasImage: 0,
  createdBy: 'user_1',
  membersCount: 2,
  maxAllowedMemberships: 5,
  adminDeleteEnabled: 1,
  publicMetadata: null,
  createdAt: 1,
  updatedAt: 2,
}

const membershipRow: AuthMembershipRow = {
  orgExternalId: 'org_1',
  userExternalId: 'user_1',
  role: 'org:admin',
  permissions: '["org:sys_profile:manage"]',
  publicMetadata: null,
  createdAt: 1,
  updatedAt: 2,
}

describe('sqlString', () => {
  it('quotes plain strings', () => {
    expect(sqlString('hello')).toBe("'hello'")
  })

  it('escapes embedded single quotes (injection guard)', () => {
    expect(sqlString("Bob's Co'; DROP TABLE auth_users;--")).toBe(
      "'Bob''s Co''; DROP TABLE auth_users;--'"
    )
  })

  it('renders null/undefined as NULL', () => {
    expect(sqlString(null)).toBe('NULL')
    expect(sqlString(undefined)).toBe('NULL')
  })
})

describe('sqlNumber', () => {
  it('renders finite numbers', () => {
    expect(sqlNumber(0)).toBe('0')
    expect(sqlNumber(1717000000)).toBe('1717000000')
  })

  it('renders null / NaN / Infinity as NULL', () => {
    expect(sqlNumber(null)).toBe('NULL')
    expect(sqlNumber(Number.NaN)).toBe('NULL')
    expect(sqlNumber(Number.POSITIVE_INFINITY)).toBe('NULL')
  })
})

describe('msToSeconds', () => {
  it('floors ms to seconds', () => {
    expect(msToSeconds(1_717_000_000_500)).toBe(1_717_000_000)
  })

  it('passes null/undefined/invalid through as null', () => {
    expect(msToSeconds(null)).toBeNull()
    expect(msToSeconds(undefined)).toBeNull()
    expect(msToSeconds(Number.NaN)).toBeNull()
  })
})

describe('boolToInt', () => {
  it('maps booleans to 0/1', () => {
    expect(boolToInt(true)).toBe(1)
    expect(boolToInt(false)).toBe(0)
  })

  it('passes null/undefined through as null', () => {
    expect(boolToInt(null)).toBeNull()
    expect(boolToInt(undefined)).toBeNull()
  })
})

describe('jsonOrNull', () => {
  it('encodes non-empty values', () => {
    expect(jsonOrNull(['google', 'github'])).toBe('["google","github"]')
    expect(jsonOrNull({ tier: 'vip' })).toBe('{"tier":"vip"}')
  })

  it('returns null for empty array / empty object / nullish', () => {
    expect(jsonOrNull([])).toBeNull()
    expect(jsonOrNull({})).toBeNull()
    expect(jsonOrNull(null)).toBeNull()
    expect(jsonOrNull(undefined)).toBeNull()
  })
})

describe('SQL builders', () => {
  const syncedAt = 1_717_999_999
  const provider = 'clerk'

  it('builds an idempotent user upsert keyed on (provider, external_id)', () => {
    const sql = buildUserUpsert(provider, userRow, syncedAt)
    expect(sql).toContain('INSERT INTO auth_users')
    expect(sql).toContain("'clerk'")
    expect(sql).toContain("'O''Brien'") // escaped
    expect(sql).toContain('email_verified')
    expect(sql).toContain('two_factor_enabled')
    expect(sql).toContain('external_accounts')
    expect(sql).toContain('last_active_at')
    expect(sql).toContain('ON CONFLICT(provider, external_id) DO UPDATE SET')
    expect(sql.endsWith(';')).toBe(true)
  })

  it('builds an org upsert with the richer fields', () => {
    const sql = buildOrgUpsert(provider, orgRow, syncedAt)
    expect(sql).toContain('INSERT INTO auth_organizations')
    expect(sql).toContain('max_allowed_memberships')
    expect(sql).toContain('admin_delete_enabled')
    expect(sql).toContain('ON CONFLICT(provider, external_id) DO UPDATE SET')
  })

  it('builds a membership upsert keyed on the full triple', () => {
    const sql = buildMembershipUpsert(provider, membershipRow, syncedAt)
    expect(sql).toContain('INSERT INTO auth_org_memberships')
    expect(sql).toContain('permissions')
    expect(sql).toContain('updated_at')
    expect(sql).toContain(
      'ON CONFLICT(provider, org_external_id, user_external_id) DO UPDATE SET'
    )
  })

  it('joins a full snapshot into one script', () => {
    const sql = buildSyncSql(
      provider,
      { users: [userRow], orgs: [orgRow], memberships: [membershipRow] },
      syncedAt
    )
    const lines = sql.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain('auth_users')
    expect(lines[1]).toContain('auth_organizations')
    expect(lines[2]).toContain('auth_org_memberships')
  })

  it('produces empty string for an empty snapshot', () => {
    expect(
      buildSyncSql(provider, { users: [], orgs: [], memberships: [] }, syncedAt)
    ).toBe('')
  })
})
