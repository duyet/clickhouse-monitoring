import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Drift guard for the centralized cloud env config.
 *
 * `.env.cloud` (+ `.env.preview`) is the SINGLE source of truth for the hosted
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

describe('.env.cloud (single source of truth for the hosted product)', () => {
  const cloud = parseDotenv(join(APP_ROOT, '.env.cloud'))

  test('exists and is non-empty', () => {
    expect(Object.keys(cloud).length).toBeGreaterThan(0)
  })

  test('enables the SaaS runtime flags the server gates features on', () => {
    // Without these as worker runtime vars the hosted product silently breaks:
    // cloud mode off → demo/host logic wrong; user-connections off → 500s.
    expect(cloud.CHM_CLOUD_MODE).toBe('true')
    expect(cloud.CHM_FEATURE_USER_CONNECTIONS_DB).toBe('true')
    expect(cloud.CHM_AUTH_PROVIDER).toBe('clerk')
    expect(cloud.CHM_CLERK_PUBLIC_READ).toBe('true')
  })

  test('never commits secrets (those go through set-secrets.ts)', () => {
    const forbidden = [
      'CLICKHOUSE_PASSWORD',
      'CLERK_SECRET_KEY',
      'CHM_CONNECTIONS_ENCRYPTION_KEY',
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
    // The Clerk publishable key IS public (pk_) and intentionally committed.
    expect(cloud.CHM_CLERK_PUBLISHABLE_KEY?.startsWith('pk_')).toBe(true)
  })

  test('.env.preview overlays preview-only deltas (pk_test)', () => {
    const preview = parseDotenv(join(APP_ROOT, '.env.preview'))
    expect(preview.CHM_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test')).toBe(true)
  })
})
