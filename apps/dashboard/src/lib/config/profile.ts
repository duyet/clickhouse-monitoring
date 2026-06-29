// Deployment profile — the ONE high-level switch that picks good defaults.
//
// Goal: an operator should configure a working deployment with a single var
// (`CHM_PROFILE`) plus the auth-specific secrets, instead of hand-setting the
// 8+ overlapping mode/auth/feature flags. Every individual flag still exists as
// an OVERRIDE, but with a sane profile default it rarely needs to be set.
//
//   Self-hosted (OSS, default)   Cloud (dash.chmonitor.dev)
//   ──────────────────────────   ─────────────────────────────────────────────
//   operator's real CLICKHOUSE   env hosts are a PUBLIC READ-ONLY DEMO
//   hosts, full access           (e.g. `duet-ubuntu`) owned by the ANON visitor
//   auth: none (or clerk/        auth: clerk; anonymous = full read-only demo,
//         trusted if set)        signed-in = blank workspace they populate
//   no per-user storage          per-user (D1) ClickHouse connections on
//
// Design invariant (mirrors lib/cloud, lib/edition): FAIL-CLOSED to self-hosted.
// An unset / empty / unrecognised CHM_PROFILE resolves to self-hosted, so the
// OSS build is never degraded and cloud behaviour is strictly opt-in.

import { type AuthProvider, parseAuthProvider } from '@/lib/auth/provider'

export const DEPLOYMENT_PROFILES = ['self-hosted', 'cloud'] as const
export type DeploymentProfile = (typeof DEPLOYMENT_PROFILES)[number]

/**
 * Parse a raw env string into a deployment profile. Only `cloud` / `saas`
 * (case-insensitive, trimmed) selects cloud; everything else → self-hosted.
 * Never throws.
 */
export function parseProfile(
  value: string | null | undefined
): DeploymentProfile {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'cloud' || normalized === 'saas') return 'cloud'
  return 'self-hosted'
}

/**
 * The default each setting falls back to when its own env var is unset. These
 * are the "good defaults from the beginning" — a profile alone yields a correct,
 * coherent deployment.
 */
export interface ProfileDefaults {
  /** Public read-only demo hosts for anon + blank workspace when signed in. */
  cloudMode: boolean
  /** Default auth posture (overridable with CHM_AUTH_PROVIDER). */
  authProvider: AuthProvider
  /** Anonymous visitors may read (but not write) without signing in. */
  clerkPublicRead: boolean
  /** Per-user ClickHouse connection storage (D1/Postgres). */
  userConnectionsDb: boolean
  /** Server-side agent conversation persistence. */
  conversationDb: boolean
}

const PROFILE_DEFAULTS: Record<DeploymentProfile, ProfileDefaults> = {
  'self-hosted': {
    cloudMode: false,
    authProvider: 'none',
    clerkPublicRead: false,
    userConnectionsDb: false,
    conversationDb: false,
  },
  cloud: {
    cloudMode: true,
    authProvider: 'clerk',
    clerkPublicRead: true,
    userConnectionsDb: true,
    conversationDb: true,
  },
}

export function profileDefaults(profile: DeploymentProfile): ProfileDefaults {
  return PROFILE_DEFAULTS[profile]
}

// ---------------------------------------------------------------------------
// Resolution: profile default, then explicit-var override.
// ---------------------------------------------------------------------------

type EnvGetter = (key: string) => string | undefined

function parseBool(value: string | undefined): boolean | undefined {
  if (value === undefined || value === '') return undefined
  const n = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on', 'cloud'].includes(n)) return true
  if (['0', 'false', 'no', 'off'].includes(n)) return false
  return undefined
}

export interface ResolvedConfig extends ProfileDefaults {
  profile: DeploymentProfile
}

/**
 * Resolve the effective config from a profile plus explicit overrides. Each
 * explicit var (when set) wins over the profile default; otherwise the default
 * applies. Pure — pass any env getter (worker binding, process.env, a mock).
 */
export function resolveConfig(getEnv: EnvGetter): ResolvedConfig {
  const profile = parseProfile(getEnv('CHM_PROFILE'))
  const d = profileDefaults(profile)

  const cloudMode = parseBool(getEnv('CHM_CLOUD_MODE')) ?? d.cloudMode
  const authRaw = getEnv('CHM_AUTH_PROVIDER')
  const authProvider = authRaw ? parseAuthProvider(authRaw) : d.authProvider
  const clerkPublicRead =
    parseBool(getEnv('CHM_CLERK_PUBLIC_READ')) ?? d.clerkPublicRead
  const userConnectionsDb =
    parseBool(getEnv('CHM_FEATURE_USER_CONNECTIONS_DB')) ?? d.userConnectionsDb
  const conversationDb =
    parseBool(getEnv('CHM_FEATURE_CONVERSATION_DB')) ?? d.conversationDb

  return {
    profile,
    cloudMode,
    authProvider,
    clerkPublicRead,
    userConnectionsDb,
    conversationDb,
  }
}
