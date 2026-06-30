/**
 * Clerk adapter for the identity sync — one implementation of IdentityProvider.
 *
 * The pure mappers (mapClerkUser/Org/Membership, primaryEmailOf) are exported
 * and unit-tested. The network path (collect) dynamically imports
 * `@clerk/backend` so the SDK never lands in the app bundle — same reason
 * lib/auth/providers/clerk.ts dynamic-imports the Clerk server client.
 */

import type {
  AuthMembershipRow,
  AuthOrgRow,
  AuthUserRow,
  IdentityProvider,
  IdentitySnapshot,
} from '../identity-sync'

import { boolToInt, jsonOrNull, msToSeconds } from '../identity-sync'

// Loosely typed: only the fields read here, which are stable across
// @clerk/backend v2/v3, so a minor SDK shape change won't break the build.
interface ClerkEmailAddress {
  id: string
  emailAddress: string
  verification?: { status?: string | null } | null
}

interface ClerkPhoneNumber {
  id: string
  phoneNumber: string
}

interface ClerkExternalAccount {
  provider?: string | null
}

interface ClerkUserLike {
  id: string
  externalId?: string | null
  primaryEmailAddressId?: string | null
  emailAddresses?: ClerkEmailAddress[]
  primaryPhoneNumberId?: string | null
  phoneNumbers?: ClerkPhoneNumber[]
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  imageUrl?: string | null
  hasImage?: boolean | null
  twoFactorEnabled?: boolean | null
  banned?: boolean | null
  locked?: boolean | null
  externalAccounts?: ClerkExternalAccount[]
  publicMetadata?: Record<string, unknown> | null
  createdAt?: number | null
  updatedAt?: number | null
  lastSignInAt?: number | null
  lastActiveAt?: number | null
}

interface ClerkOrgLike {
  id: string
  name: string
  slug?: string | null
  imageUrl?: string | null
  hasImage?: boolean | null
  createdBy?: string | null
  membersCount?: number | null
  maxAllowedMemberships?: number | null
  adminDeleteEnabled?: boolean | null
  publicMetadata?: Record<string, unknown> | null
  createdAt?: number | null
  updatedAt?: number | null
}

interface ClerkMembershipLike {
  role?: string | null
  permissions?: string[] | null
  publicMetadata?: Record<string, unknown> | null
  createdAt?: number | null
  updatedAt?: number | null
  publicUserData?: { userId?: string | null } | null
}

/** Resolve a user's primary email, falling back to the first address. */
export function primaryEmailOf(user: ClerkUserLike): string | null {
  const addrs = user.emailAddresses ?? []
  if (addrs.length === 0) return null
  const primary = addrs.find((a) => a.id === user.primaryEmailAddressId)
  return (primary ?? addrs[0]).emailAddress ?? null
}

/** 0/1 whether the primary (or first) email is verified; null if no address. */
function primaryEmailVerified(user: ClerkUserLike): number | null {
  const addrs = user.emailAddresses ?? []
  if (addrs.length === 0) return null
  const primary =
    addrs.find((a) => a.id === user.primaryEmailAddressId) ?? addrs[0]
  return boolToInt(primary.verification?.status === 'verified')
}

/** Resolve the primary phone number, falling back to the first. */
function primaryPhoneOf(user: ClerkUserLike): string | null {
  const phones = user.phoneNumbers ?? []
  if (phones.length === 0) return null
  const primary = phones.find((p) => p.id === user.primaryPhoneNumberId)
  return (primary ?? phones[0]).phoneNumber ?? null
}

/** Linked OAuth provider names, with Clerk's `oauth_` prefix stripped. */
function externalAccountProviders(user: ClerkUserLike): string[] {
  return (user.externalAccounts ?? [])
    .map((a) => a.provider ?? '')
    .filter(Boolean)
    .map((p) => p.replace(/^oauth_/, ''))
}

export function mapClerkUser(user: ClerkUserLike): AuthUserRow {
  return {
    externalId: user.id,
    providerExternalId: user.externalId ?? null,
    primaryEmail: primaryEmailOf(user),
    emailVerified: primaryEmailVerified(user),
    phoneNumber: primaryPhoneOf(user),
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    username: user.username ?? null,
    imageUrl: user.imageUrl ?? null,
    hasImage: boolToInt(user.hasImage),
    twoFactorEnabled: boolToInt(user.twoFactorEnabled),
    banned: boolToInt(user.banned),
    locked: boolToInt(user.locked),
    externalAccounts: jsonOrNull(externalAccountProviders(user)),
    publicMetadata: jsonOrNull(user.publicMetadata),
    createdAt: msToSeconds(user.createdAt),
    updatedAt: msToSeconds(user.updatedAt),
    lastSignInAt: msToSeconds(user.lastSignInAt),
    lastActiveAt: msToSeconds(user.lastActiveAt),
  }
}

export function mapClerkOrg(org: ClerkOrgLike): AuthOrgRow {
  return {
    externalId: org.id,
    name: org.name,
    slug: org.slug ?? null,
    imageUrl: org.imageUrl ?? null,
    hasImage: boolToInt(org.hasImage),
    createdBy: org.createdBy ?? null,
    membersCount: org.membersCount ?? null,
    maxAllowedMemberships: org.maxAllowedMemberships ?? null,
    adminDeleteEnabled: boolToInt(org.adminDeleteEnabled),
    publicMetadata: jsonOrNull(org.publicMetadata),
    createdAt: msToSeconds(org.createdAt),
    updatedAt: msToSeconds(org.updatedAt),
  }
}

export function mapClerkMembership(
  m: ClerkMembershipLike,
  orgExternalId: string
): AuthMembershipRow | null {
  const userExternalId = m.publicUserData?.userId ?? null
  if (!userExternalId) return null
  return {
    orgExternalId,
    userExternalId,
    role: m.role ?? null,
    permissions: jsonOrNull(m.permissions),
    publicMetadata: jsonOrNull(m.publicMetadata),
    createdAt: msToSeconds(m.createdAt),
    updatedAt: msToSeconds(m.updatedAt),
  }
}

const PAGE_SIZE = 100

/** The Clerk implementation of IdentityProvider. */
export class ClerkIdentityProvider implements IdentityProvider {
  readonly name = 'clerk'

  constructor(
    private readonly secretKey: string,
    private readonly log: (msg: string) => void = () => {}
  ) {}

  async collect(): Promise<IdentitySnapshot> {
    const { createClerkClient } = await import('@clerk/backend')
    const clerk = createClerkClient({ secretKey: this.secretKey })

    const users: AuthUserRow[] = []
    let reportedUserCount = 0
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const page = await clerk.users.getUserList({ limit: PAGE_SIZE, offset })
      reportedUserCount = page.totalCount
      for (const u of page.data) users.push(mapClerkUser(u))
      this.log(`  users: ${users.length}/${reportedUserCount}`)
      if (page.data.length < PAGE_SIZE || users.length >= reportedUserCount) {
        break
      }
    }

    const orgs: AuthOrgRow[] = []
    let reportedOrgCount = 0
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const page = await clerk.organizations.getOrganizationList({
        limit: PAGE_SIZE,
        offset,
      })
      reportedOrgCount = page.totalCount
      for (const o of page.data) orgs.push(mapClerkOrg(o))
      this.log(`  orgs: ${orgs.length}/${reportedOrgCount}`)
      if (page.data.length < PAGE_SIZE || orgs.length >= reportedOrgCount) {
        break
      }
    }

    const memberships: AuthMembershipRow[] = []
    for (const org of orgs) {
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const page = await clerk.organizations.getOrganizationMembershipList({
          organizationId: org.externalId,
          limit: PAGE_SIZE,
          offset,
        })
        let added = 0
        for (const m of page.data) {
          const row = mapClerkMembership(m, org.externalId)
          if (row) {
            memberships.push(row)
            added++
          }
        }
        if (page.data.length < PAGE_SIZE || added === 0) break
      }
    }
    this.log(`  memberships: ${memberships.length}`)

    return { users, orgs, memberships, reportedUserCount, reportedOrgCount }
  }
}
