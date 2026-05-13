import type { AuthProvider } from '@/lib/auth/provider'
import type {
  FeatureOverride,
  FeatureOverrides,
  FeaturePermission,
  Principal,
  PublicFeaturePermissionConfig,
} from './types'

import {
  mergeFeatureOverrides,
  normalizeFeatureAccess,
  normalizeFeatureId,
  resolveFeatureState,
} from './shared'
import { FEATURE_IDS } from './types'
import { auth } from '@clerk/nextjs/server'
import { load as parseYaml } from 'js-yaml'
import { parse as parseToml } from 'smol-toml'
import { isValidAgentApiBearerToken } from '@/lib/auth/agent-api-token'
import { parseAuthProvider } from '@/lib/auth/provider'

export interface AppFeaturePermissionConfig {
  authProvider: AuthProvider
  features: FeatureOverrides
}

export class AppFeaturePermissionConfigError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'AppFeaturePermissionConfigError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseBoolean(value: unknown, name: string): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'boolean') return value

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  }

  throw new AppFeaturePermissionConfigError(
    `Invalid boolean for ${name}. Expected true or false.`
  )
}

function parseFeatureOverride(
  value: unknown,
  feature: string
): FeatureOverride {
  if (!isRecord(value)) {
    throw new AppFeaturePermissionConfigError(
      `Invalid feature config for "${feature}". Expected an object.`
    )
  }

  const override: FeatureOverride = {}
  const enabled = parseBoolean(value.enabled, `features.${feature}.enabled`)
  if (enabled !== undefined) override.enabled = enabled

  if (value.access !== undefined) {
    if (typeof value.access !== 'string') {
      throw new AppFeaturePermissionConfigError(
        `Invalid access for feature "${feature}". Expected a string.`
      )
    }
    try {
      override.access = normalizeFeatureAccess(value.access)
    } catch (error) {
      throw new AppFeaturePermissionConfigError(
        `Invalid access value "${value.access}" for feature "${feature}".`,
        { cause: error }
      )
    }
  }

  return override
}

function parseAuthProviderConfig(value: string, name: string): AuthProvider {
  try {
    return parseAuthProvider(value)
  } catch (error) {
    throw new AppFeaturePermissionConfigError(
      `Invalid auth provider for ${name}.`,
      { cause: error }
    )
  }
}

function parseFeatureOverrides(value: unknown): FeatureOverrides {
  if (value === undefined || value === null) return {}
  if (!isRecord(value)) {
    throw new AppFeaturePermissionConfigError(
      'Invalid features config. Expected an object.'
    )
  }

  let overrides: FeatureOverrides = {}
  for (const [feature, overrideValue] of Object.entries(value)) {
    const id = normalizeFeatureId(feature)
    overrides = mergeFeatureOverrides(overrides, {
      [id]: parseFeatureOverride(overrideValue, feature),
    })
  }

  return overrides
}

function parseFileConfig(value: unknown): Partial<AppFeaturePermissionConfig> {
  if (!value) return {}
  if (!isRecord(value)) {
    throw new AppFeaturePermissionConfigError(
      'Invalid app config file. Expected an object.'
    )
  }

  const config: Partial<AppFeaturePermissionConfig> = {}
  const authConfig = value.auth
  if (isRecord(authConfig) && typeof authConfig.provider === 'string') {
    config.authProvider = parseAuthProviderConfig(
      authConfig.provider,
      'auth.provider'
    )
  }

  config.features = parseFeatureOverrides(value.features)
  return config
}

async function loadConfigFile(): Promise<Partial<AppFeaturePermissionConfig>> {
  const configPath = process.env.CHM_CONFIG_FILE?.trim()
  if (!configPath) return {}

  try {
    const { readFile } = await import('node:fs/promises')
    const raw = await readFile(configPath, 'utf8')
    const lowerPath = configPath.toLowerCase()
    const parsed =
      lowerPath.endsWith('.toml') || lowerPath.endsWith('.tml')
        ? parseToml(raw)
        : parseYaml(raw)

    return parseFileConfig(parsed)
  } catch (error) {
    if (error instanceof AppFeaturePermissionConfigError) {
      throw error
    }

    throw new AppFeaturePermissionConfigError(
      `Failed to load CHM_CONFIG_FILE at ${configPath}.`,
      { cause: error }
    )
  }
}

function splitFeatureList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseEnvFeatureOverrides(): FeatureOverrides {
  let overrides: FeatureOverrides = {}

  for (const feature of splitFeatureList(process.env.CHM_DISABLED_FEATURES)) {
    const id = normalizeFeatureId(feature)
    overrides = mergeFeatureOverrides(overrides, {
      [id]: { enabled: false },
    })
  }

  for (const feature of splitFeatureList(
    process.env.CHM_AUTH_REQUIRED_FEATURES
  )) {
    const id = normalizeFeatureId(feature)
    overrides = mergeFeatureOverrides(overrides, {
      [id]: { access: 'authenticated' },
    })
  }

  for (const feature of FEATURE_IDS) {
    const envKey = `CHM_FEATURE_${feature.toUpperCase()}`
    const enabled = parseBoolean(
      process.env[`${envKey}_ENABLED`],
      `${envKey}_ENABLED`
    )
    const access = process.env[`${envKey}_ACCESS`]

    const override: FeatureOverride = {}
    if (enabled !== undefined) override.enabled = enabled
    if (access !== undefined && access !== '') {
      override.access = normalizeFeatureAccess(access)
    }

    if (Object.keys(override).length > 0) {
      overrides = mergeFeatureOverrides(overrides, { [feature]: override })
    }
  }

  return overrides
}

function parseEnvAuthProvider(): AuthProvider | undefined {
  const raw =
    process.env.CHM_AUTH_PROVIDER ?? process.env.NEXT_PUBLIC_AUTH_PROVIDER
  if (raw === undefined || raw === '') return undefined
  return parseAuthProviderConfig(raw, 'CHM_AUTH_PROVIDER')
}

export async function getAppFeaturePermissionConfig(): Promise<AppFeaturePermissionConfig> {
  const fileConfig = await loadConfigFile()
  const envAuthProvider = parseEnvAuthProvider()
  const envFeatureOverrides = parseEnvFeatureOverrides()

  return {
    authProvider: envAuthProvider ?? fileConfig.authProvider ?? 'none',
    features: mergeFeatureOverrides(
      fileConfig.features ?? {},
      envFeatureOverrides
    ),
  }
}

async function getRequestPrincipal(
  config: AppFeaturePermissionConfig
): Promise<Principal> {
  if (config.authProvider !== 'clerk') {
    return 'anonymous'
  }

  try {
    const authResult = await auth()
    return authResult.userId ? 'authenticated' : 'anonymous'
  } catch {
    return 'anonymous'
  }
}

export async function getPublicFeaturePermissionConfig(): Promise<PublicFeaturePermissionConfig> {
  const config = await getAppFeaturePermissionConfig()
  const principal = await getRequestPrincipal(config)

  return {
    authProvider: config.authProvider,
    principal,
    features: config.features,
  }
}

function jsonFeatureError(
  status: number,
  code: string,
  message: string,
  headers?: HeadersInit
) {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
      },
    }),
    {
      status,
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
    }
  )
}

async function isAuthenticatedRequest(
  request: Request,
  config: AppFeaturePermissionConfig,
  options: { allowAgentBearerToken?: boolean } = {}
): Promise<boolean> {
  if (
    options.allowAgentBearerToken &&
    (await isValidAgentApiBearerToken(request))
  ) {
    return true
  }

  if (config.authProvider !== 'clerk') {
    return false
  }

  try {
    const authResult = await auth()
    return Boolean(authResult.userId)
  } catch {
    return false
  }
}

export async function authorizeFeatureRequest(
  permission: FeaturePermission | undefined,
  request: Request,
  options: { allowAgentBearerToken?: boolean } = {}
): Promise<Response | null> {
  if (!permission) return null

  let config: AppFeaturePermissionConfig
  try {
    config = await getAppFeaturePermissionConfig()
  } catch (error) {
    if (error instanceof AppFeaturePermissionConfigError) {
      return jsonFeatureError(
        500,
        'INVALID_FEATURE_PERMISSION_CONFIG',
        error.message
      )
    }

    throw error
  }

  const state = resolveFeatureState(permission, config)
  if (!state.enabled) {
    return jsonFeatureError(
      404,
      'FEATURE_DISABLED',
      `Feature "${permission.feature}" is disabled.`
    )
  }

  if (state.access === 'public') {
    return null
  }

  if (await isAuthenticatedRequest(request, config, options)) {
    return null
  }

  return jsonFeatureError(
    401,
    'AUTHENTICATION_REQUIRED',
    `Feature "${permission.feature}" requires authentication.`,
    { 'www-authenticate': 'Bearer' }
  )
}
