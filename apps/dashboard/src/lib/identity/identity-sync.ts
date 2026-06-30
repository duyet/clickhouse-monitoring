/**
 * Provider-agnostic identity sync core: normalized row shapes, the
 * IdentityProvider adapter contract, and idempotent SQL generation for the
 * `auth_users` / `auth_organizations` / `auth_org_memberships` tables
 * (migrations 0006 + 0007).
 *
 * Clerk is one adapter (see ./providers/clerk.ts); another upstream can be
 * added by implementing IdentityProvider — the schema and these builders never
 * change. Kept free of I/O so it can be unit-tested and so no provider SDK
 * leaks into app code: the things worth testing live here — timestamp
 * normalization (ms → unix seconds), boolean → 0/1, JSON encoding, and
 * SQL-literal escaping (emails / org names / metadata contain quotes; naive
 * concatenation is an injection bug).
 */

/** A normalized user, independent of which provider it came from. */
export interface AuthUserRow {
  /** Provider's user id (e.g. Clerk `user_*`). */
  externalId: string
  /** App-level external id the provider stores for this user, if any. */
  providerExternalId: string | null
  primaryEmail: string | null
  /** 0/1: primary email verified. */
  emailVerified: number | null
  phoneNumber: string | null
  firstName: string | null
  lastName: string | null
  username: string | null
  imageUrl: string | null
  /** 0/1 */
  hasImage: number | null
  /** 0/1 */
  twoFactorEnabled: number | null
  /** 0/1 */
  banned: number | null
  /** 0/1 */
  locked: number | null
  /** JSON array of linked OAuth providers, e.g. ["google","github"]. */
  externalAccounts: string | null
  /** JSON object of provider public metadata. */
  publicMetadata: string | null
  /** unix seconds */
  createdAt: number | null
  /** unix seconds */
  updatedAt: number | null
  /** unix seconds */
  lastSignInAt: number | null
  /** unix seconds */
  lastActiveAt: number | null
}

/** A normalized organization. */
export interface AuthOrgRow {
  /** Provider's org id (e.g. Clerk `org_*`). */
  externalId: string
  name: string
  slug: string | null
  imageUrl: string | null
  /** 0/1 */
  hasImage: number | null
  createdBy: string | null
  membersCount: number | null
  maxAllowedMemberships: number | null
  /** 0/1 */
  adminDeleteEnabled: number | null
  /** JSON object of provider public metadata. */
  publicMetadata: string | null
  /** unix seconds */
  createdAt: number | null
  /** unix seconds */
  updatedAt: number | null
}

/** A normalized org membership (links a user to an org). */
export interface AuthMembershipRow {
  orgExternalId: string
  userExternalId: string
  role: string | null
  /** JSON array of permission strings. */
  permissions: string | null
  /** JSON object of provider public metadata. */
  publicMetadata: string | null
  /** unix seconds */
  createdAt: number | null
  /** unix seconds */
  updatedAt: number | null
}

/** Everything one provider knows about its users/orgs at sync time. */
export interface IdentitySnapshot {
  users: AuthUserRow[]
  orgs: AuthOrgRow[]
  memberships: AuthMembershipRow[]
  /** Provider-reported totals, used to verify the sync was complete. */
  reportedUserCount: number
  reportedOrgCount: number
}

/**
 * Adapter contract for an upstream identity provider. Implement this to add a
 * new provider; the sync script and SQL builders are otherwise unchanged.
 */
export interface IdentityProvider {
  /** Stable discriminator stored in the `provider` column, e.g. 'clerk'. */
  readonly name: string
  /** Pull the full identity snapshot from the upstream provider. */
  collect(): Promise<IdentitySnapshot>
}

/** Convert an upstream unix-ms timestamp to unix seconds; invalid → null. */
export function msToSeconds(ms: number | null | undefined): number | null {
  if (ms == null || !Number.isFinite(ms)) return null
  return Math.floor(ms / 1000)
}

/** Normalize a boolean to 0/1; null/undefined → null. */
export function boolToInt(value: boolean | null | undefined): number | null {
  if (value == null) return null
  return value ? 1 : 0
}

/**
 * Encode a value as a compact JSON string for storage, or null when there's
 * nothing meaningful to store (null/undefined, empty array, empty object).
 */
export function jsonOrNull(value: unknown): string | null {
  if (value == null) return null
  if (Array.isArray(value) && value.length === 0) return null
  if (
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value as object).length === 0
  ) {
    return null
  }
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

/** Quote a string as a SQL literal, escaping single quotes; null → NULL. */
export function sqlString(value: string | null | undefined): string {
  if (value == null) return 'NULL'
  return `'${value.replace(/'/g, "''")}'`
}

/** Render a number as a SQL literal; null / non-finite → NULL. */
export function sqlNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'NULL'
  return String(value)
}

export function buildUserUpsert(
  provider: string,
  row: AuthUserRow,
  syncedAt: number
): string {
  return (
    `INSERT INTO auth_users (provider, external_id, provider_external_id, ` +
    `primary_email, email_verified, phone_number, first_name, last_name, ` +
    `username, image_url, has_image, two_factor_enabled, banned, locked, ` +
    `external_accounts, public_metadata, created_at, updated_at, ` +
    `last_sign_in_at, last_active_at, synced_at) VALUES (` +
    `${sqlString(provider)}, ${sqlString(row.externalId)}, ` +
    `${sqlString(row.providerExternalId)}, ${sqlString(row.primaryEmail)}, ` +
    `${sqlNumber(row.emailVerified)}, ${sqlString(row.phoneNumber)}, ` +
    `${sqlString(row.firstName)}, ${sqlString(row.lastName)}, ` +
    `${sqlString(row.username)}, ${sqlString(row.imageUrl)}, ` +
    `${sqlNumber(row.hasImage)}, ${sqlNumber(row.twoFactorEnabled)}, ` +
    `${sqlNumber(row.banned)}, ${sqlNumber(row.locked)}, ` +
    `${sqlString(row.externalAccounts)}, ${sqlString(row.publicMetadata)}, ` +
    `${sqlNumber(row.createdAt)}, ${sqlNumber(row.updatedAt)}, ` +
    `${sqlNumber(row.lastSignInAt)}, ${sqlNumber(row.lastActiveAt)}, ` +
    `${sqlNumber(syncedAt)}) ` +
    `ON CONFLICT(provider, external_id) DO UPDATE SET ` +
    `provider_external_id=excluded.provider_external_id, ` +
    `primary_email=excluded.primary_email, ` +
    `email_verified=excluded.email_verified, ` +
    `phone_number=excluded.phone_number, first_name=excluded.first_name, ` +
    `last_name=excluded.last_name, username=excluded.username, ` +
    `image_url=excluded.image_url, has_image=excluded.has_image, ` +
    `two_factor_enabled=excluded.two_factor_enabled, banned=excluded.banned, ` +
    `locked=excluded.locked, external_accounts=excluded.external_accounts, ` +
    `public_metadata=excluded.public_metadata, created_at=excluded.created_at, ` +
    `updated_at=excluded.updated_at, last_sign_in_at=excluded.last_sign_in_at, ` +
    `last_active_at=excluded.last_active_at, synced_at=excluded.synced_at;`
  )
}

export function buildOrgUpsert(
  provider: string,
  row: AuthOrgRow,
  syncedAt: number
): string {
  return (
    `INSERT INTO auth_organizations (provider, external_id, name, slug, ` +
    `image_url, has_image, created_by, members_count, max_allowed_memberships, ` +
    `admin_delete_enabled, public_metadata, created_at, updated_at, synced_at) ` +
    `VALUES (${sqlString(provider)}, ${sqlString(row.externalId)}, ` +
    `${sqlString(row.name)}, ${sqlString(row.slug)}, ${sqlString(row.imageUrl)}, ` +
    `${sqlNumber(row.hasImage)}, ${sqlString(row.createdBy)}, ` +
    `${sqlNumber(row.membersCount)}, ${sqlNumber(row.maxAllowedMemberships)}, ` +
    `${sqlNumber(row.adminDeleteEnabled)}, ${sqlString(row.publicMetadata)}, ` +
    `${sqlNumber(row.createdAt)}, ${sqlNumber(row.updatedAt)}, ` +
    `${sqlNumber(syncedAt)}) ` +
    `ON CONFLICT(provider, external_id) DO UPDATE SET ` +
    `name=excluded.name, slug=excluded.slug, image_url=excluded.image_url, ` +
    `has_image=excluded.has_image, created_by=excluded.created_by, ` +
    `members_count=excluded.members_count, ` +
    `max_allowed_memberships=excluded.max_allowed_memberships, ` +
    `admin_delete_enabled=excluded.admin_delete_enabled, ` +
    `public_metadata=excluded.public_metadata, created_at=excluded.created_at, ` +
    `updated_at=excluded.updated_at, synced_at=excluded.synced_at;`
  )
}

export function buildMembershipUpsert(
  provider: string,
  row: AuthMembershipRow,
  syncedAt: number
): string {
  return (
    `INSERT INTO auth_org_memberships (provider, org_external_id, ` +
    `user_external_id, role, permissions, public_metadata, created_at, ` +
    `updated_at, synced_at) VALUES (` +
    `${sqlString(provider)}, ${sqlString(row.orgExternalId)}, ` +
    `${sqlString(row.userExternalId)}, ${sqlString(row.role)}, ` +
    `${sqlString(row.permissions)}, ${sqlString(row.publicMetadata)}, ` +
    `${sqlNumber(row.createdAt)}, ${sqlNumber(row.updatedAt)}, ` +
    `${sqlNumber(syncedAt)}) ` +
    `ON CONFLICT(provider, org_external_id, user_external_id) DO UPDATE SET ` +
    `role=excluded.role, permissions=excluded.permissions, ` +
    `public_metadata=excluded.public_metadata, created_at=excluded.created_at, ` +
    `updated_at=excluded.updated_at, synced_at=excluded.synced_at;`
  )
}

/** Build the full upsert script for a snapshot (newline-separated statements). */
export function buildSyncSql(
  provider: string,
  snapshot: Pick<IdentitySnapshot, 'users' | 'orgs' | 'memberships'>,
  syncedAt: number
): string {
  const statements: string[] = []
  for (const u of snapshot.users) {
    statements.push(buildUserUpsert(provider, u, syncedAt))
  }
  for (const o of snapshot.orgs) {
    statements.push(buildOrgUpsert(provider, o, syncedAt))
  }
  for (const m of snapshot.memberships) {
    statements.push(buildMembershipUpsert(provider, m, syncedAt))
  }
  return statements.join('\n')
}
