import { parseProfile, profileDefaults, resolveConfig } from './profile'
import { describe, expect, test } from 'bun:test'

describe('parseProfile — fail-closed to self-hosted', () => {
  test('cloud / saas → cloud', () => {
    expect(parseProfile('cloud')).toBe('cloud')
    expect(parseProfile('  Cloud ')).toBe('cloud')
    expect(parseProfile('saas')).toBe('cloud')
  })
  test('unset / empty / junk → self-hosted', () => {
    for (const v of [undefined, null, '', '  ', 'selfhosted', 'oss', 'xyz']) {
      expect(parseProfile(v)).toBe('self-hosted')
    }
  })
})

describe('profileDefaults — good defaults from the beginning', () => {
  test('self-hosted: full access, no cloud, no per-user storage', () => {
    expect(profileDefaults('self-hosted')).toEqual({
      cloudMode: false,
      authProvider: 'none',
      clerkPublicRead: false,
      userConnectionsDb: false,
      conversationDb: false,
    })
  })
  test('cloud: clerk + anon read-only demo + per-user storage', () => {
    expect(profileDefaults('cloud')).toEqual({
      cloudMode: true,
      authProvider: 'clerk',
      clerkPublicRead: true,
      userConnectionsDb: true,
      conversationDb: true,
    })
  })
})

describe('resolveConfig — profile default, explicit var overrides', () => {
  const mock = (vars: Record<string, string>) => (k: string) => vars[k]

  test('CHM_PROFILE=cloud yields the full cloud posture from ONE var', () => {
    const c = resolveConfig(mock({ CHM_PROFILE: 'cloud' }))
    expect(c).toEqual({
      profile: 'cloud',
      cloudMode: true,
      authProvider: 'clerk',
      clerkPublicRead: true,
      userConnectionsDb: true,
      conversationDb: true,
    })
  })

  test('default (no vars) is a clean self-hosted deployment', () => {
    const c = resolveConfig(mock({}))
    expect(c.profile).toBe('self-hosted')
    expect(c.cloudMode).toBe(false)
    expect(c.authProvider).toBe('none')
  })

  test('OSS operator: just CHM_AUTH_PROVIDER=clerk (or trusted)', () => {
    expect(
      resolveConfig(mock({ CHM_AUTH_PROVIDER: 'clerk' })).authProvider
    ).toBe('clerk')
    expect(
      resolveConfig(mock({ CHM_AUTH_PROVIDER: 'trusted' })).authProvider
    ).toBe('trusted')
  })

  test('explicit var overrides the profile default', () => {
    // Cloud profile but operator forces per-user storage off.
    const c = resolveConfig(
      mock({ CHM_PROFILE: 'cloud', CHM_FEATURE_USER_CONNECTIONS_DB: 'false' })
    )
    expect(c.cloudMode).toBe(true)
    expect(c.userConnectionsDb).toBe(false)
  })
})
