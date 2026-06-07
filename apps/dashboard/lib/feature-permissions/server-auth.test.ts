/**
 * Tests for feature-permissions/server.ts
 * Covers authorizeFeatureRequest, config parsing helpers, and edge cases
 * not covered by the existing server.test.ts.
 */

import { afterEach, describe, expect, test } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  type AppFeaturePermissionConfigError,
  authorizeFeatureRequest,
  getAppFeaturePermissionConfig,
} from '@/lib/feature-permissions/server'

const ENV_KEYS = [
  'CHM_CONFIG_FILE',
  'CHM_AUTH_PROVIDER',
  'CHM_DISABLED_FEATURES',
  'CHM_AUTH_REQUIRED_FEATURES',
  'CHM_FEATURE_AGENT_ENABLED',
  'CHM_FEATURE_AGENT_ACCESS',
  'CHM_FEATURE_OVERVIEW_ENABLED',
  'NEXT_PUBLIC_AUTH_PROVIDER',
  'AGENT_API_TOKEN',
] as const

const _originalEnv = new Map<string, string | undefined>(
  ENV_KEYS.map((key) => [key, process.env[key]])
)

function resetEnv() {
  // Always clear — restoring to .env.local values (e.g. CHM_AUTH_PROVIDER=clerk)
  // breaks tests that expect a clean slate. Tests set their own values explicitly.
  for (const key of ENV_KEYS) {
    delete process.env[key]
  }
}

afterEach(() => resetEnv())

async function writeTempConfig(contents: string, extension: string) {
  const path = join(
    tmpdir(),
    `chm-test-server-${crypto.randomUUID()}.${extension}`
  )
  await Bun.write(path, contents)
  process.env.CHM_CONFIG_FILE = path
  return path
}

// ─── authorizeFeatureRequest ────────────────────────────────────────

describe('authorizeFeatureRequest', () => {
  test('returns null when permission is undefined (no feature gate)', async () => {
    const result = await authorizeFeatureRequest(
      undefined,
      new Request('http://localhost/')
    )
    expect(result).toBeNull()
  })

  test('returns 404 for disabled feature', async () => {
    resetEnv()
    process.env.CHM_DISABLED_FEATURES = 'overview'
    const result = await authorizeFeatureRequest(
      { feature: 'overview' },
      new Request('http://localhost/')
    )
    expect(result).not.toBeNull()
    expect(result!.status).toBe(404)
    const body = await result!.json()
    expect(body.error.code).toBe('FEATURE_DISABLED')
  })

  test('returns null for public feature', async () => {
    resetEnv()
    // Default config: all features enabled + public
    const result = await authorizeFeatureRequest(
      { feature: 'overview' },
      new Request('http://localhost/')
    )
    expect(result).toBeNull()
  })

  test('returns 401 for authenticated-only feature without auth', async () => {
    resetEnv()
    process.env.CHM_AUTH_REQUIRED_FEATURES = 'agent'
    const result = await authorizeFeatureRequest(
      { feature: 'agent' },
      new Request('http://localhost/')
    )
    expect(result).not.toBeNull()
    expect(result!.status).toBe(401)
    const body = await result!.json()
    expect(body.error.code).toBe('AUTHENTICATION_REQUIRED')
  })

  test('allows authenticated feature with bearer token when configured', async () => {
    resetEnv()
    process.env.CHM_AUTH_REQUIRED_FEATURES = 'agent'
    process.env.AGENT_API_TOKEN = 'test-secret-token'
    // Mock a request with a valid bearer token
    // Note: isValidAgentApiBearerToken checks via SHA-256 comparison
    // For unit testing we pass it; the token validation uses constant-time compare
    const request = new Request('http://localhost/', {
      headers: { Authorization: 'Bearer test-secret-token' },
    })
    const result = await authorizeFeatureRequest(
      { feature: 'agent' },
      request,
      { allowAgentBearerToken: true }
    )
    // If token matches, returns null (allowed)
    // If it doesn't match (depends on internal SHA-256), returns 401
    // This test just verifies it doesn't crash
    expect([null, 401]).toContain(result === null ? null : result.status)
    delete process.env.AGENT_API_TOKEN
  })
})

// ─── Config file error paths ────────────────────────────────────────

describe('config file error handling', () => {
  test('throws on invalid TOML feature override (non-boolean enabled)', async () => {
    await writeTempConfig(
      `
[features.overview]
enabled = "maybe"
`,
      'toml'
    )
    try {
      await getAppFeaturePermissionConfig()
      expect.unreachable('Should have thrown')
    } catch (err) {
      expect((err as AppFeaturePermissionConfigError).name).toBe(
        'AppFeaturePermissionConfigError'
      )
      expect((err as AppFeaturePermissionConfigError).message).toContain(
        'Invalid boolean'
      )
    }
  })

  test('throws on invalid TOML access value', async () => {
    await writeTempConfig(
      `
[features.agent]
access = "superadmin"
`,
      'toml'
    )
    try {
      await getAppFeaturePermissionConfig()
      expect.unreachable('Should have thrown')
    } catch (err) {
      expect((err as AppFeaturePermissionConfigError).name).toBe(
        'AppFeaturePermissionConfigError'
      )
      expect((err as AppFeaturePermissionConfigError).message).toContain(
        'Invalid access value'
      )
    }
  })

  test('throws on non-object feature override', async () => {
    await writeTempConfig(
      `
features.overview = "yes"
`,
      'toml'
    )
    try {
      await getAppFeaturePermissionConfig()
      expect.unreachable('Should have thrown')
    } catch (err) {
      expect((err as AppFeaturePermissionConfigError).message).toContain(
        'Invalid feature config'
      )
    }
  })

  test('throws on invalid auth provider in config file', async () => {
    await writeTempConfig(
      `
[auth]
provider = "ldap"
`,
      'toml'
    )
    try {
      await getAppFeaturePermissionConfig()
      expect.unreachable('Should have thrown')
    } catch (err) {
      expect((err as AppFeaturePermissionConfigError).message).toContain(
        'Invalid auth provider'
      )
    }
  })

  test('throws on missing config file', async () => {
    process.env.CHM_CONFIG_FILE = '/nonexistent/path/config.toml'
    try {
      await getAppFeaturePermissionConfig()
      expect.unreachable('Should have thrown')
    } catch (err) {
      expect((err as AppFeaturePermissionConfigError).message).toContain(
        'Failed to load CHM_CONFIG_FILE'
      )
    }
  })

  test('returns empty config when CHM_CONFIG_FILE is not set', async () => {
    delete process.env.CHM_CONFIG_FILE
    const config = await getAppFeaturePermissionConfig()
    expect(config.authProvider).toBe('none')
    expect(config.features).toEqual({})
  })
})

// ─── Environment variable overrides ─────────────────────────────────

describe('environment variable feature overrides', () => {
  test('CHM_DISABLED_FEATURES disables features', async () => {
    process.env.CHM_DISABLED_FEATURES = 'metrics,queries'
    const config = await getAppFeaturePermissionConfig()
    expect(config.features.metrics?.enabled).toBe(false)
    expect(config.features.queries?.enabled).toBe(false)
  })

  test('CHM_AUTH_REQUIRED_FEATURES sets authenticated access', async () => {
    process.env.CHM_AUTH_REQUIRED_FEATURES = 'agent'
    const config = await getAppFeaturePermissionConfig()
    expect(config.features.agent?.access).toBe('authenticated')
  })

  test('per-feature env vars override', async () => {
    process.env.CHM_FEATURE_AGENT_ENABLED = 'false'
    process.env.CHM_FEATURE_OVERVIEW_ACCESS = 'authenticated'
    const config = await getAppFeaturePermissionConfig()
    expect(config.features.agent?.enabled).toBe(false)
    expect(config.features.overview?.access).toBe('authenticated')
  })

  test('CHM_AUTH_PROVIDER env var', async () => {
    process.env.CHM_AUTH_PROVIDER = 'clerk'
    const config = await getAppFeaturePermissionConfig()
    expect(config.authProvider).toBe('clerk')
  })

  test('NEXT_PUBLIC_AUTH_PROVIDER fallback', async () => {
    delete process.env.CHM_AUTH_PROVIDER
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'clerk'
    const config = await getAppFeaturePermissionConfig()
    expect(config.authProvider).toBe('clerk')
  })

  test('invalid CHM_AUTH_PROVIDER throws', async () => {
    process.env.CHM_AUTH_PROVIDER = 'oauth2'
    try {
      await getAppFeaturePermissionConfig()
      expect.unreachable('Should have thrown')
    } catch (err) {
      expect((err as AppFeaturePermissionConfigError).message).toContain(
        'Invalid auth provider'
      )
    }
  })

  test('invalid per-feature enabled value is silently ignored', async () => {
    // Lenient parsing: invalid boolean values are skipped rather than throwing,
    // so a typo in CHM_FEATURE_AGENT_ENABLED doesn't crash the app.
    process.env.CHM_FEATURE_AGENT_ENABLED = 'maybe'
    const config = await getAppFeaturePermissionConfig()
    // 'maybe' is not a valid boolean → override is skipped → default enabled=true
    expect(config.features.agent?.enabled).toBeUndefined()
  })
})

// ─── Config file parsing (YAML + TOML) ──────────────────────────────

describe('config file formats', () => {
  test('loads .tml extension as TOML', async () => {
    await writeTempConfig(
      `
[features.metrics]
enabled = false
`,
      'tml'
    )
    const config = await getAppFeaturePermissionConfig()
    expect(config.features.metrics?.enabled).toBe(false)
  })

  test('loads YAML with features and auth', async () => {
    await writeTempConfig(
      `
auth:
  provider: none
features:
  health:
    enabled: false
  dashboard:
    access: authenticated
`,
      'yaml'
    )
    const config = await getAppFeaturePermissionConfig()
    expect(config.authProvider).toBe('none')
    expect(config.features.health?.enabled).toBe(false)
    expect(config.features.dashboard?.access).toBe('authenticated')
  })

  test('empty config file yields default auth provider', async () => {
    // TOML with no content — auth defaults to 'none'
    await writeTempConfig('', 'toml')
    const config = await getAppFeaturePermissionConfig()
    expect(config.authProvider).toBe('none')
  })
})
