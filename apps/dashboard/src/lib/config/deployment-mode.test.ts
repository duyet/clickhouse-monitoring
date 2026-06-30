import {
  modeDefaults,
  parseDeploymentMode,
  resolveConfig,
} from './deployment-mode'
import { describe, expect, test } from 'bun:test'

describe('parseDeploymentMode — fail-closed to self-hosted', () => {
  test('cloud / saas → cloud', () => {
    expect(parseDeploymentMode('cloud')).toBe('cloud')
    expect(parseDeploymentMode('  Cloud ')).toBe('cloud')
    expect(parseDeploymentMode('saas')).toBe('cloud')
  })
  test('unset / empty / junk → self-hosted', () => {
    for (const v of [undefined, null, '', '  ', 'selfhosted', 'oss', 'xyz']) {
      expect(parseDeploymentMode(v)).toBe('oss')
    }
  })
})

describe('modeDefaults — good defaults from the beginning', () => {
  test('self-hosted: full access, no cloud, no per-user storage', () => {
    expect(modeDefaults('oss')).toEqual({
      cloudMode: false,
      authProvider: 'none',
      clerkPublicRead: false,
      userConnectionsDb: false,
      conversationDb: false,
      allowPrivateHosts: false,
    })
  })
  test('cloud: clerk + anon read-only demo + per-user storage', () => {
    expect(modeDefaults('cloud')).toEqual({
      cloudMode: true,
      authProvider: 'clerk',
      clerkPublicRead: true,
      userConnectionsDb: true,
      conversationDb: true,
      allowPrivateHosts: false,
    })
  })
})

describe('resolveConfig — allowPrivateHosts (fail-closed in cloud)', () => {
  const mock = (vars: Record<string, string>) => (k: string) => vars[k]

  test('self-host respects CHM_ALLOW_PRIVATE_HOSTS', () => {
    expect(
      resolveConfig(mock({ CHM_ALLOW_PRIVATE_HOSTS: 'true' })).allowPrivateHosts
    ).toBe(true)
    expect(resolveConfig(mock({})).allowPrivateHosts).toBe(false)
  })

  test('cloud FORCES it off even when the flag is set', () => {
    expect(
      resolveConfig(
        mock({ CHM_DEPLOYMENT_MODE: 'cloud', CHM_ALLOW_PRIVATE_HOSTS: 'true' })
      ).allowPrivateHosts
    ).toBe(false)
    expect(
      resolveConfig(
        mock({ CHM_CLOUD_MODE: 'true', CHM_ALLOW_PRIVATE_HOSTS: '1' })
      ).allowPrivateHosts
    ).toBe(false)
  })
})

describe('resolveConfig — profile default, explicit var overrides', () => {
  const mock = (vars: Record<string, string>) => (k: string) => vars[k]

  test('CHM_DEPLOYMENT_MODE=cloud yields the full cloud posture from ONE var', () => {
    const c = resolveConfig(mock({ CHM_DEPLOYMENT_MODE: 'cloud' }))
    expect(c).toEqual({
      mode: 'cloud',
      cloudMode: true,
      authProvider: 'clerk',
      clerkPublicRead: true,
      userConnectionsDb: true,
      conversationDb: true,
      allowPrivateHosts: false,
    })
  })

  test('default (no vars) is a clean oss deployment', () => {
    const c = resolveConfig(mock({}))
    expect(c.mode).toBe('oss')
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
      mock({
        CHM_DEPLOYMENT_MODE: 'cloud',
        CHM_FEATURE_USER_CONNECTIONS_DB: 'false',
      })
    )
    expect(c.cloudMode).toBe(true)
    expect(c.userConnectionsDb).toBe(false)
  })
})
