/**
 * End-to-end verification of the identity sync against the REAL migration
 * schema, without any network or secret. Applies migrations 0006 + 0007 to an
 * in-memory SQLite DB, runs the full Clerk-adapter → buildSyncSql → execute
 * path, and asserts row counts + idempotency + field round-trip.
 *
 * This is the automated form of the manual local-D1 check and guards against
 * schema/SQL drift: if a column is added to a migration but missed in a
 * builder (or vice-versa), the INSERT throws here.
 */

import { buildSyncSql } from './identity-sync'
import {
  mapClerkMembership,
  mapClerkOrg,
  mapClerkUser,
} from './providers/clerk'
import { Database } from 'bun:sqlite'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const MIGRATIONS_DIR = join(
  import.meta.dir,
  '..',
  '..',
  'db',
  'conversations-migrations'
)

function applyMigrations(db: Database) {
  for (const file of [
    '0006_auth_identities.sql',
    '0007_auth_identity_details.sql',
  ]) {
    db.exec(readFileSync(join(MIGRATIONS_DIR, file), 'utf-8'))
  }
}

// A fake provider's raw payload — exercises the Clerk mappers too (quotes,
// OAuth accounts, verified email, an org with a member, and a membership whose
// user was deleted, which must be skipped).
function clerkSnapshot() {
  const users = [
    mapClerkUser({
      id: 'user_1',
      primaryEmailAddressId: 'e1',
      emailAddresses: [
        {
          id: 'e1',
          emailAddress: "o'brien@x.com",
          verification: { status: 'verified' },
        },
      ],
      firstName: "O'Brien",
      externalAccounts: [{ provider: 'oauth_github' }],
      publicMetadata: { tier: 'vip' },
      createdAt: 1_000_000_000_000,
      updatedAt: 1_000_000_500_000,
      hasImage: true,
    }),
    mapClerkUser({
      id: 'user_2',
      emailAddresses: [{ id: 'e9', emailAddress: 'plain@x.com' }],
      createdAt: 1_000_000_100_000,
    }),
  ]
  const orgs = [
    mapClerkOrg({
      id: 'org_1',
      name: "Bob's Co",
      slug: 'bob',
      membersCount: 1,
      maxAllowedMemberships: 5,
      adminDeleteEnabled: true,
      createdAt: 1_000_000_000_000,
    }),
  ]
  const memberships = [
    mapClerkMembership(
      {
        role: 'org:admin',
        permissions: ['org:sys_profile:manage'],
        createdAt: 1_000_000_000_000,
        publicUserData: { userId: 'user_1' },
      },
      'org_1'
    ),
    // Deleted user — no userId — must be dropped by the mapper.
    mapClerkMembership({ role: 'org:member', publicUserData: null }, 'org_1'),
  ].filter((m): m is NonNullable<typeof m> => m !== null)

  return { users, orgs, memberships, reportedUserCount: 2, reportedOrgCount: 1 }
}

describe('identity sync (integration, real schema)', () => {
  let db: Database

  beforeAll(() => {
    db = new Database(':memory:')
    applyMigrations(db)
  })

  afterAll(() => db.close())

  it('applies generated SQL against the migrated schema and counts match', () => {
    const snap = clerkSnapshot()
    const sql = buildSyncSql('clerk', snap, 1_700_000_000)
    db.exec(sql)

    const count = (t: string) =>
      (
        db
          .query(`SELECT count(*) AS n FROM ${t} WHERE provider='clerk'`)
          .get() as {
          n: number
        }
      ).n

    expect(count('auth_users')).toBe(snap.users.length) // 2
    expect(count('auth_organizations')).toBe(snap.orgs.length) // 1
    expect(count('auth_org_memberships')).toBe(snap.memberships.length) // 1 (deleted-user dropped)
  })

  it('is idempotent — re-running keeps the same row counts', () => {
    const snap = clerkSnapshot()
    db.exec(buildSyncSql('clerk', snap, 1_700_000_001))
    const users = (
      db
        .query("SELECT count(*) AS n FROM auth_users WHERE provider='clerk'")
        .get() as { n: number }
    ).n
    expect(users).toBe(2)
  })

  it('round-trips escaped strings, booleans, JSON, and ms→s timestamps', () => {
    const row = db
      .query(
        `SELECT primary_email, first_name, email_verified, has_image,
                external_accounts, public_metadata, created_at
         FROM auth_users WHERE provider='clerk' AND external_id='user_1'`
      )
      .get() as Record<string, unknown>

    expect(row.primary_email).toBe("o'brien@x.com")
    expect(row.first_name).toBe("O'Brien")
    expect(row.email_verified).toBe(1)
    expect(row.has_image).toBe(1)
    expect(row.external_accounts).toBe('["github"]')
    expect(row.public_metadata).toBe('{"tier":"vip"}')
    expect(row.created_at).toBe(1_000_000_000) // ms floored to seconds
  })

  it('stores the org limit + membership permissions', () => {
    const org = db
      .query(
        `SELECT name, max_allowed_memberships, admin_delete_enabled
         FROM auth_organizations WHERE provider='clerk' AND external_id='org_1'`
      )
      .get() as Record<string, unknown>
    expect(org.name).toBe("Bob's Co")
    expect(org.max_allowed_memberships).toBe(5)
    expect(org.admin_delete_enabled).toBe(1)

    const m = db
      .query(
        `SELECT permissions FROM auth_org_memberships
         WHERE provider='clerk' AND org_external_id='org_1'`
      )
      .get() as Record<string, unknown>
    expect(m.permissions).toBe('["org:sys_profile:manage"]')
  })
})
