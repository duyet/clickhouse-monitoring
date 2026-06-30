// Deployment mode — the ONE high-level switch that picks good defaults.
//
// Goal: an operator configures a working deployment with a single var
// (`CHM_DEPLOYMENT_MODE`) plus the auth-specific secrets, instead of hand-setting
// the 8+ overlapping mode/auth/feature flags. Every individual flag still exists
// as an OVERRIDE, but with a sane per-mode default it rarely needs to be set.
//
//   oss (default)                cloud (dash.chmonitor.dev)
//   ──────────────────────────   ─────────────────────────────────────────────
//   operator's real CLICKHOUSE   env hosts are a PUBLIC READ-ONLY DEMO
//   hosts, full access           (e.g. `duet-ubuntu`) owned by the ANON visitor
//   auth: none (or clerk/        auth: clerk; anonymous = full read-only demo,
//         trusted if set)        signed-in = blank workspace they populate
//   no per-user storage          per-user (D1) ClickHouse connections on
//
// Design invariant (mirrors lib/cloud, lib/edition): FAIL-CLOSED to oss. An
// unset / empty / unrecognised CHM_DEPLOYMENT_MODE resolves to oss, so the
// open-source build is never degraded and cloud behaviour is strictly opt-in.
//
// ►► To change what a mode defaults to, edit ONE place: MODE_DEFAULTS below. ◄◄

import { type AuthProvider, parseAuthProvider } from '@/lib/auth/provider'

export const DEPLOYMENT_MODES = ['oss', 'cloud'] as const
export type DeploymentMode = (typeof DEPLOYMENT_MODES)[number]

/**
 * Parse a raw env string into a deployment mode. `cloud` / `saas` select cloud;
 * `oss` / `self-hosted` / anything else → oss (fail-closed). Never throws.
 */
export function parseDeploymentMode(
  value: string | null | undefined
): DeploymentMode {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'cloud' || normalized === 'saas') return 'cloud'
  return 'oss'
}

/**
 * The set of defaults a deployment mode resolves to — the "good defaults from
 * the beginning". A mode alone yields a correct, coherent deployment.
 */
export interface ModeDefaults {
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
  /**
   * Allow connecting to private / LAN / loopback / Tailscale (CGNAT) ClickHouse
   * hosts through the connection form. Self-host only — FORCED off in cloud mode
   * (multi-tenant SSRF safety), regardless of the explicit flag.
   */
  allowPrivateHosts: boolean
}

/**
 * SINGLE SOURCE OF TRUTH for per-mode defaults. To tune what `oss` or `cloud`
 * ships with, edit here — every reader (vite client build + server) derives from
 * this map via resolveConfig().
 */
const MODE_DEFAULTS: Record<DeploymentMode, ModeDefaults> = {
  oss: {
    cloudMode: false,
    authProvider: 'none',
    clerkPublicRead: false,
    userConnectionsDb: false,
    conversationDb: false,
    allowPrivateHosts: false,
  },
  cloud: {
    cloudMode: true,
    authProvider: 'clerk',
    clerkPublicRead: true,
    userConnectionsDb: true,
    conversationDb: true,
    allowPrivateHosts: false,
  },
}

export function modeDefaults(mode: DeploymentMode): ModeDefaults {
  return MODE_DEFAULTS[mode]
}

// ---------------------------------------------------------------------------
// Resolution: per-mode default, then explicit-var override.
// ---------------------------------------------------------------------------

type EnvGetter = (key: string) => string | undefined

function parseBool(value: string | undefined): boolean | undefined {
  if (value === undefined || value === '') return undefined
  const n = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on', 'cloud'].includes(n)) return true
  if (['0', 'false', 'no', 'off'].includes(n)) return false
  return undefined
}

export interface ResolvedConfig extends ModeDefaults {
  mode: DeploymentMode
}

/**
 * Resolve the effective config from the deployment mode plus explicit overrides.
 * Each explicit var (when set) wins over the mode default; otherwise the default
 * applies. Pure — pass any env getter (worker binding, process.env, a mock).
 */
export function resolveConfig(getEnv: EnvGetter): ResolvedConfig {
  const mode = parseDeploymentMode(getEnv('CHM_DEPLOYMENT_MODE'))
  const d = modeDefaults(mode)

  const cloudMode = parseBool(getEnv('CHM_CLOUD_MODE')) ?? d.cloudMode
  const authRaw = getEnv('CHM_AUTH_PROVIDER')
  const authProvider = authRaw ? parseAuthProvider(authRaw) : d.authProvider
  const clerkPublicRead =
    parseBool(getEnv('CHM_CLERK_PUBLIC_READ')) ?? d.clerkPublicRead
  const userConnectionsDb =
    parseBool(getEnv('CHM_FEATURE_USER_CONNECTIONS_DB')) ?? d.userConnectionsDb
  const conversationDb =
    parseBool(getEnv('CHM_FEATURE_CONVERSATION_DB')) ?? d.conversationDb
  // Fail-closed: cloud ALWAYS blocks private hosts, the flag can't override it.
  const allowPrivateHosts =
    !cloudMode &&
    (parseBool(getEnv('CHM_ALLOW_PRIVATE_HOSTS')) ?? d.allowPrivateHosts)

  return {
    mode,
    cloudMode,
    authProvider,
    clerkPublicRead,
    userConnectionsDb,
    conversationDb,
    allowPrivateHosts,
  }
}
