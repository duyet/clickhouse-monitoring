import {
  parseFeaturesConfig,
  parseLegacyFeatureOverrides,
} from '../features-config'
import { describe, expect, test } from 'bun:test'

describe('parseFeaturesConfig', () => {
  test('empty input returns empty overrides', () => {
    expect(parseFeaturesConfig(undefined)).toEqual({})
    expect(parseFeaturesConfig('')).toEqual({})
    expect(parseFeaturesConfig('   ')).toEqual({})
  })

  test('short alias: auth → access=authenticated', () => {
    const result = parseFeaturesConfig('agent:auth')
    expect(result).toEqual({
      agent: { access: 'authenticated' },
    })
  })

  test('short alias: off → enabled=false', () => {
    const result = parseFeaturesConfig('peerdb:off')
    expect(result).toEqual({
      peerdb: { enabled: false },
    })
  })

  test('short alias: on → enabled=true', () => {
    const result = parseFeaturesConfig('mcp:on')
    expect(result).toEqual({
      mcp: { enabled: true },
    })
  })

  test('short alias: public → access=public', () => {
    const result = parseFeaturesConfig('settings:public')
    expect(result).toEqual({
      settings: { access: 'public' },
    })
  })

  test('multiple features', () => {
    const result = parseFeaturesConfig('agent:auth,peerdb:off,settings:auth')
    expect(result).toEqual({
      agent: { access: 'authenticated' },
      peerdb: { enabled: false },
      settings: { access: 'authenticated' },
    })
  })

  test('explicit key=value: access=authenticated', () => {
    const result = parseFeaturesConfig('agent:access=authenticated')
    expect(result).toEqual({
      agent: { access: 'authenticated' },
    })
  })

  test('explicit key=value: enabled=false', () => {
    const result = parseFeaturesConfig('metrics:enabled=false')
    expect(result).toEqual({
      metrics: { enabled: false },
    })
  })

  test('mixed aliases and explicit', () => {
    const result = parseFeaturesConfig('agent:auth,peerdb:enabled=false')
    expect(result).toEqual({
      agent: { access: 'authenticated' },
      peerdb: { enabled: false },
    })
  })

  test('same feature appears twice — last wins', () => {
    const result = parseFeaturesConfig('agent:public,agent:auth')
    expect(result).toEqual({
      agent: { access: 'authenticated' },
    })
  })

  test('invalid feature ID is skipped', () => {
    const result = parseFeaturesConfig('nonexistent:auth,agent:auth')
    expect(result).toEqual({
      agent: { access: 'authenticated' },
    })
  })

  test('whitespace is trimmed', () => {
    const result = parseFeaturesConfig('  agent:auth  ,  peerdb:off  ')
    expect(result).toEqual({
      agent: { access: 'authenticated' },
      peerdb: { enabled: false },
    })
  })

  test('entry without colon is skipped', () => {
    const result = parseFeaturesConfig('agentauth,peerdb:off')
    expect(result).toEqual({
      peerdb: { enabled: false },
    })
  })
})

describe('parseLegacyFeatureOverrides', () => {
  test('CHM_DISABLED_FEATURES', () => {
    const result = parseLegacyFeatureOverrides((key) =>
      key === 'CHM_DISABLED_FEATURES' ? 'overview,metrics' : undefined
    )
    expect(result).toEqual({
      overview: { enabled: false },
      metrics: { enabled: false },
    })
  })

  test('CHM_AUTH_REQUIRED_FEATURES', () => {
    const result = parseLegacyFeatureOverrides((key) =>
      key === 'CHM_AUTH_REQUIRED_FEATURES' ? 'agent,settings' : undefined
    )
    expect(result).toEqual({
      agent: { access: 'authenticated' },
      settings: { access: 'authenticated' },
    })
  })

  test('CHM_FEATURE_AGENT_ACCESS', () => {
    const result = parseLegacyFeatureOverrides((key) =>
      key === 'CHM_FEATURE_AGENT_ACCESS' ? 'authenticated' : undefined
    )
    expect(result).toEqual({
      agent: { access: 'authenticated' },
    })
  })

  test('CHM_FEATURE_PEERDB_ENABLED=false', () => {
    const result = parseLegacyFeatureOverrides((key) =>
      key === 'CHM_FEATURE_PEERDB_ENABLED' ? 'false' : undefined
    )
    expect(result).toEqual({
      peerdb: { enabled: false },
    })
  })

  test('all legacy mechanisms combined', () => {
    const env: Record<string, string> = {
      CHM_DISABLED_FEATURES: 'docs',
      CHM_AUTH_REQUIRED_FEATURES: 'agent',
      CHM_FEATURE_PEERDB_ENABLED: 'false',
      CHM_FEATURE_SETTINGS_ACCESS: 'authenticated',
    }
    const result = parseLegacyFeatureOverrides((key) => env[key])
    expect(result).toEqual({
      docs: { enabled: false },
      agent: { access: 'authenticated' },
      peerdb: { enabled: false },
      settings: { access: 'authenticated' },
    })
  })

  test('empty env returns empty overrides', () => {
    const result = parseLegacyFeatureOverrides(() => undefined)
    expect(result).toEqual({})
  })
})
