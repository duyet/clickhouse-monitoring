import {
  mapClerkMembership,
  mapClerkOrg,
  mapClerkUser,
  primaryEmailOf,
} from './clerk'
import { describe, expect, it } from 'bun:test'

describe('primaryEmailOf', () => {
  it('prefers the address matching primaryEmailAddressId', () => {
    expect(
      primaryEmailOf({
        id: 'user_1',
        primaryEmailAddressId: 'e2',
        emailAddresses: [
          { id: 'e1', emailAddress: 'alt@x.com' },
          { id: 'e2', emailAddress: 'primary@x.com' },
        ],
      })
    ).toBe('primary@x.com')
  })

  it('falls back to the first address when no primary id matches', () => {
    expect(
      primaryEmailOf({
        id: 'user_1',
        emailAddresses: [{ id: 'a', emailAddress: 'first@x.com' }],
      })
    ).toBe('first@x.com')
  })

  it('returns null when there are no addresses', () => {
    expect(primaryEmailOf({ id: 'user_1', emailAddresses: [] })).toBeNull()
  })
})

describe('mapClerkUser', () => {
  it('normalizes the full set of fields', () => {
    expect(
      mapClerkUser({
        id: 'user_1',
        externalId: 'app_42',
        primaryEmailAddressId: 'e1',
        emailAddresses: [
          {
            id: 'e1',
            emailAddress: 'me@x.com',
            verification: { status: 'verified' },
          },
        ],
        primaryPhoneNumberId: 'p1',
        phoneNumbers: [{ id: 'p1', phoneNumber: '+15551234' }],
        firstName: 'Ada',
        lastName: 'Lovelace',
        username: 'ada',
        imageUrl: 'https://img/x.png',
        hasImage: true,
        twoFactorEnabled: true,
        banned: false,
        locked: false,
        externalAccounts: [
          { provider: 'oauth_google' },
          { provider: 'oauth_github' },
        ],
        publicMetadata: { tier: 'vip' },
        createdAt: 1_717_000_000_000,
        updatedAt: 1_717_000_500_000,
        lastSignInAt: null,
        lastActiveAt: 1_717_000_900_000,
      })
    ).toEqual({
      externalId: 'user_1',
      providerExternalId: 'app_42',
      primaryEmail: 'me@x.com',
      emailVerified: 1,
      phoneNumber: '+15551234',
      firstName: 'Ada',
      lastName: 'Lovelace',
      username: 'ada',
      imageUrl: 'https://img/x.png',
      hasImage: 1,
      twoFactorEnabled: 1,
      banned: 0,
      locked: 0,
      externalAccounts: '["google","github"]',
      publicMetadata: '{"tier":"vip"}',
      createdAt: 1_717_000_000,
      updatedAt: 1_717_000_500,
      lastSignInAt: null,
      lastActiveAt: 1_717_000_900,
    })
  })

  it('reports an unverified primary email as 0 and no linked accounts as null', () => {
    const row = mapClerkUser({
      id: 'user_2',
      primaryEmailAddressId: 'e1',
      emailAddresses: [
        {
          id: 'e1',
          emailAddress: 'me@x.com',
          verification: { status: 'unverified' },
        },
      ],
    })
    expect(row.emailVerified).toBe(0)
    expect(row.externalAccounts).toBeNull()
    expect(row.publicMetadata).toBeNull()
  })
})

describe('mapClerkOrg', () => {
  it('normalizes org fields including limits and metadata', () => {
    const row = mapClerkOrg({
      id: 'org_1',
      name: 'Acme',
      slug: 'acme',
      imageUrl: null,
      hasImage: false,
      createdBy: 'user_1',
      membersCount: 3,
      maxAllowedMemberships: 5,
      adminDeleteEnabled: true,
      publicMetadata: { plan: 'pro' },
      createdAt: 1_717_000_000_000,
      updatedAt: 1_717_000_000_000,
    })
    expect(row.externalId).toBe('org_1')
    expect(row.membersCount).toBe(3)
    expect(row.maxAllowedMemberships).toBe(5)
    expect(row.adminDeleteEnabled).toBe(1)
    expect(row.publicMetadata).toBe('{"plan":"pro"}')
    expect(row.createdAt).toBe(1_717_000_000)
  })
})

describe('mapClerkMembership', () => {
  it('extracts user id, permissions, and timestamps', () => {
    expect(
      mapClerkMembership(
        {
          role: 'org:admin',
          permissions: ['org:sys_profile:manage'],
          publicMetadata: {},
          createdAt: 1_717_000_000_000,
          updatedAt: 1_717_000_500_000,
          publicUserData: { userId: 'user_9' },
        },
        'org_1'
      )
    ).toEqual({
      orgExternalId: 'org_1',
      userExternalId: 'user_9',
      role: 'org:admin',
      permissions: '["org:sys_profile:manage"]',
      publicMetadata: null,
      createdAt: 1_717_000_000,
      updatedAt: 1_717_000_500,
    })
  })

  it('returns null when there is no userId (deleted user)', () => {
    expect(
      mapClerkMembership({ role: 'org:member', publicUserData: null }, 'org_1')
    ).toBeNull()
  })
})
