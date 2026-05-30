import { afterEach, describe, expect, test } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getAppFeaturePermissionConfig } from '@/lib/feature-permissions/server'
import {
  isFeatureAllowed,
  resolveFeatureState,
} from '@/lib/feature-permissions/shared'

const ENV_KEYS = [
  'CHM_CONFIG_FILE',
  'CHM_AUTH_PROVIDER',
  'CHM_DISABLED_FEATURES',
  'CHM_AUTH_REQUIRED_FEATURES',
  'CHM_FEATURE_AGENT_ACCESS',
  'CHM_FEATURE_METRICS_ENABLED',
  'CHM_FEATURE_SETTINGS_ACCESS',
  'NEXT_PUBLIC_AUTH_PROVIDER',
] as const

const originalEnv = new Map<string, string | undefined>(
  ENV_KEYS.map((key) => [key, process.env[key]])
)

function resetEnv() {
  for (const key of ENV_KEYS) {
    const value = originalEnv.get(key)
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

afterEach(() => {
  resetEnv()
})

async function writeTempConfig(contents: string, extension: string) {
  const path = join(
    tmpdir(),
    `clickhouse-monitor-feature-permissions-${crypto.randomUUID()}.${extension}`
  )
  await Bun.write(path, contents)
  process.env.CHM_CONFIG_FILE = path
  return path
}

describe('feature permission config', () => {
  test('loads sparse TOML overrides and leaves missing features allowed', async () => {
    await writeTempConfig(
      `
[features.agent]
access = "authenticated"

[features.metrics]
enabled = false
`,
      'toml'
    )

    const config = await getAppFeaturePermissionConfig()

    expect(config.features.agent?.access).toBe('authenticated')
    expect(config.features.metrics?.enabled).toBe(false)
    expect(resolveFeatureState({ feature: 'settings' }, config)).toEqual({
      enabled: true,
      access: 'public',
    })
  })

  test('treats guest access as public access', async () => {
    await writeTempConfig(
      `
[features.metrics]
enabled = true
access = "guest"
`,
      'toml'
    )

    const config = await getAppFeaturePermissionConfig()

    expect(config.features.metrics).toEqual({
      enabled: true,
      access: 'public',
    })
  })

  test('environment overrides file values', async () => {
    await writeTempConfig(
      `
[features.metrics]
enabled = false

[features.settings]
access = "public"
`,
      'toml'
    )

    process.env.CHM_FEATURE_METRICS_ENABLED = 'true'
    process.env.CHM_FEATURE_SETTINGS_ACCESS = 'authenticated'
    process.env.CHM_AUTH_REQUIRED_FEATURES = 'agent'

    const config = await getAppFeaturePermissionConfig()

    expect(config.features.metrics?.enabled).toBe(true)
    expect(config.features.settings?.access).toBe('authenticated')
    expect(config.features.agent?.access).toBe('authenticated')
  })

  test('omitted permission allows access', () => {
    expect(
      isFeatureAllowed(undefined, {
        authProvider: 'none',
        principal: 'anonymous',
        features: {},
      })
    ).toBe(true)
  })

  test('hides interaction-gated feature from anonymous when auth is enabled', () => {
    // The agent renders for everyone but requires sign-in to use. With an auth
    // provider active and an anonymous visitor, the menu entry must be hidden.
    expect(
      isFeatureAllowed(
        { feature: 'agent', interactionGated: true },
        { authProvider: 'clerk', principal: 'anonymous', features: {} }
      )
    ).toBe(false)
  })

  test('shows interaction-gated feature to authenticated users', () => {
    expect(
      isFeatureAllowed(
        { feature: 'agent', interactionGated: true },
        { authProvider: 'clerk', principal: 'authenticated', features: {} }
      )
    ).toBe(true)
  })

  test('shows interaction-gated feature when no auth provider is configured', () => {
    // Without auth, every visitor is anonymous but no sign-in is possible, so
    // the feature is fully usable and must stay visible.
    expect(
      isFeatureAllowed(
        { feature: 'agent', interactionGated: true },
        { authProvider: 'none', principal: 'anonymous', features: {} }
      )
    ).toBe(true)
  })

  test('loads YAML overrides', async () => {
    await writeTempConfig(
      `
auth:
  provider: clerk
features:
  insights:
    enabled: false
`,
      'yaml'
    )

    const config = await getAppFeaturePermissionConfig()

    expect(config.authProvider).toBe('clerk')
    expect(config.features.insights?.enabled).toBe(false)
  })
})
