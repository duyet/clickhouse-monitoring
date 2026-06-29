// Cloud (SaaS) deployment mode. Now derived from the deployment profile
// (lib/config/profile.ts) when `CHM_CLOUD_MODE` is not set explicitly.
//
// ONE codebase serves two products:
//   - Self-hosted / OSS (Docker, Kubernetes, Cloudflare Workers): the operator's
//     `CLICKHOUSE_HOST` env vars are THEIR real hosts, full access, no sign-in
//     required. This is the default and is never degraded.
//   - Cloud (dash.chmonitor.dev): the env hosts are a PUBLIC, READ-ONLY DEMO
//     (e.g. `duet-ubuntu`) that anonymous visitors can explore. When a visitor
//     signs in they get a clean, empty workspace — the demo is hidden and they
//     connect their own ClickHouse via per-user (D1) connections.
//
// Design invariant (mirrors lib/edition): FAIL-CLOSED to self-hosted. An unset,
// empty, or unrecognised CHM_CLOUD_MODE / VITE_CLOUD_MODE resolves to NOT cloud,
// so the open-source build behaves exactly as before. Cloud behaviour is purely
// additive and only switches on when a deployment explicitly opts in.

import { parseProfile } from '@/lib/config/profile'

/**
 * Parse a raw env string into a cloud-mode boolean.
 *
 * Only the exact string `'true'` / `'1'` / `'cloud'` (case-insensitive, trimmed)
 * enables cloud mode. Everything else — undefined, empty, whitespace, junk —
 * resolves to `false`. Never throws.
 */
export function parseCloudMode(value: string | null | undefined): boolean {
  const normalized = value?.trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'cloud'
}

/**
 * Client-safe: resolved at build time from `VITE_CLOUD_MODE`
 * (inlined in vite.config.ts CLIENT_ENV). Use in React components / hooks.
 */
export function isCloudModeClient(): boolean {
  return parseCloudMode(import.meta.env.VITE_CLOUD_MODE)
}

/**
 * Server-side: runtime `CHM_CLOUD_MODE` wins, falling back to the build-time
 * `VITE_CLOUD_MODE`. Pass the Cloudflare `env` binding on the edge; defaults to
 * `process.env` on Node.
 */
export function isCloudModeServer(
  runtimeEnv?: Record<string, string | undefined>
): boolean {
  const source =
    runtimeEnv ?? (typeof process !== 'undefined' ? process.env : {})
  const explicit = source.CHM_CLOUD_MODE ?? import.meta.env.VITE_CLOUD_MODE
  if (explicit !== undefined && explicit !== '') return parseCloudMode(explicit)
  // Derived from the deployment profile: CHM_PROFILE=cloud → cloud mode, so the
  // single profile var is enough (no need to also set CHM_CLOUD_MODE).
  return (
    parseProfile(source.CHM_PROFILE ?? import.meta.env.VITE_PROFILE) === 'cloud'
  )
}
