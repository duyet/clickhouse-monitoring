import { resolveConfig } from '../config/profile'
import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Drift guard for the centralized cloud env config.
 *
 * `.env.production` (+ `.env.preview`) is the SINGLE source of truth for the hosted
 * product's non-secret config — consumed by both the vite client build
 * (vite.config.ts loadDeployEnv) and the worker runtime vars
 * (scripts/patch-wrangler-env.ts). wrangler.toml no longer declares [vars].
 *
 * This test exists because a missing CHM_FEATURE_USER_CONNECTIONS_DB once
 * silently disabled per-user connection storage in production
 * ("User connections database storage is not enabled"): the flag was set at
 * client build time but never as a worker runtime var. Keep the contract here.
 */

// src/lib/cloud → apps/dashboard
const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

function parseDotenv(path: string): Record<string, string> {
  if (!existsSync(path)) return {}
  const out: Record<string, string> = {}
  for (const raw of readFileSync(path, 'utf-8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    out[line.slice(0, eq).trim()] = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
  }
  return out
}

describe('.env.production (single source of truth for the hosted product)', () => {
  const cloud = parseDotenv(join(APP_ROOT, '.env.production'))

  test('exists and is non-empty', () => {
    expect(Object.keys(cloud).length).toBeGreaterThan(0)
  })

  test('selects the cloud posture via the single CHM_PROFILE switch', () => {
    // The hosted product is configured by ONE var; the individual mode/auth/
    // feature flags are derived from it (lib/config/profile.ts). Setting the old
    // flags individually is no longer required (or committed).
    expect(cloud.CHM_PROFILE).toBe('cloud')
    const resolved = resolveConfig((k) => cloud[k])
    expect(resolved.cloudMode).toBe(true)
    expect(resolved.authProvider).toBe('clerk')
    expect(resolved.clerkPublicRead).toBe(true)
    expect(resolved.userConnectionsDb).toBe(true)
  })

  test('never commits secrets (those go through set-secrets.ts)', () => {
    const forbidden = [
      'CLICKHOUSE_PASSWORD',
      'CLERK_SECRET_KEY',
      'CHM_USER_CONNECTIONS_ENCRYPTION_KEY',
      'CHM_API_KEY_SECRET',
      'AGENTSTATE_API_KEY',
      'LLM_API_KEY',
      'OPENROUTER_API_KEY',
    ]
    for (const key of forbidden) expect(cloud[key]).toBeUndefined()
    // No obviously-secret token values committed.
    for (const value of Object.values(cloud)) {
      expect(value.startsWith('sk_')).toBe(false)
      expect(value.startsWith('as_live')).toBe(false)
    }
  })

  test('OSS-clean: no platform-specific identity committed', () => {
    // The repo is generic/OSS — chmonitor's own Clerk instance key, private LLM
    // preset, etc. must NOT be committed. They come from GitHub Actions vars (CI)
    // or .env.production.local (local). See vite.config.ts loadDeployEnv.
    const preview = parseDotenv(join(APP_ROOT, '.env.preview'))
    for (const env of [cloud, preview]) {
      // No Clerk publishable key (pk_live / pk_test) baked into git.
      expect(env.CHM_CLERK_PUBLISHABLE_KEY).toBeUndefined()
      for (const value of Object.values(env)) {
        expect(value.startsWith('pk_live')).toBe(false)
        expect(value.startsWith('pk_test')).toBe(false)
      }
    }
    // Committed LLM model is a PUBLIC preset, never a private @preset/<name>.
    expect(cloud.LLM_MODEL ?? '').not.toContain('@preset/')
    expect(preview.LLM_MODEL ?? '').not.toContain('@preset/')
  })
})
