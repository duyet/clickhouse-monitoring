#!/usr/bin/env bun

/**
 * Unified Cloudflare Workers deploy script.
 *
 * Works identically in CI and local — uses the same commands and env vars.
 *
 * Auth (must have one):
 *   - CLOUDFLARE_API_TOKEN env var (recommended for both CI and local)
 *   - wrangler login (local fallback via OAuth)
 *
 * Usage:
 *   bun run cf:deploy
 *
 * Env vars required at deploy time (set via CI secrets or .env.prod/local):
 *   CLICKHOUSE_PASSWORD, CLERK_SECRET_KEY, etc.
 *
 * Env vars at build time (set in wrangler.toml [vars] or CI):
 *   CLICKHOUSE_HOST, CLICKHOUSE_USER, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, etc.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const ENV_FILE_PROD = join(__dirname, '..', '.env.prod')
const ENV_FILE_LOCAL = join(__dirname, '..', '.env.local')

type Step = [string, string, string, string[]]

const STEPS: Step[] = [
  ['📦', 'Building for Cloudflare', 'bun', ['run', 'cf:build']],
  ['🚀', 'Deploying to Cloudflare', 'wrangler', ['deploy', '--minify']],
  [
    '🗄️',
    'Populating remote cache',
    'opennextjs-cloudflare',
    ['populateCache', 'remote'],
  ],
]

function loadEnvFile(): Record<string, string> {
  const file = existsSync(ENV_FILE_PROD)
    ? ENV_FILE_PROD
    : existsSync(ENV_FILE_LOCAL)
      ? ENV_FILE_LOCAL
      : null

  if (!file) return {}

  const vars: Record<string, string> = {}
  for (const line of readFileSync(file, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match) vars[match[1]] = match[2]
  }
  return vars
}

function runStep([icon, label, cmd, args]: Step): void {
  console.log(`\n${icon}  ${label}...`)

  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env },
    shell: true,
  })

  if (result.status !== 0) {
    console.error(`\n❌ ${label} failed (exit code ${result.status})`)
    process.exit(result.status ?? 1)
  }
}

function main(): void {
  const envFile = loadEnvFile()

  // Merge env file vars into process env (env file vars don't override existing)
  for (const [key, value] of Object.entries(envFile)) {
    if (!(key in process.env) && value) {
      process.env[key] = value
    }
  }

  // Warn if no auth method is available
  if (!process.env.CLOUDFLARE_API_TOKEN) {
    console.warn(
      '⚠️  CLOUDFLARE_API_TOKEN not set — relying on wrangler login OAuth.\n'
    )
    console.warn(
      '   Recommended: set CLOUDFLARE_API_TOKEN in .env.prod or CI secrets'
    )
    console.warn('   for consistent auth across CI and local.\n')
  }

  for (const step of STEPS) {
    runStep(step)
  }

  console.log('\n✅ Deploy complete!')
}

main()
