#!/usr/bin/env bun

/**
 * Automatically set Wrangler secrets from environment file in batch
 * Priority: .env.prod > .env.local
 * Usage: bun run cf:config
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Priority: .env.prod > .env.local
const ENV_FILE_PROD = join(process.cwd(), '.env.prod')
const ENV_FILE_LOCAL = join(process.cwd(), '.env.local')

// Secrets to set (excluding NEXT_PUBLIC_* which are build-time only)
// Note: Variables already in wrangler.toml [vars] should NOT be in this list
// Note: CLICKHOUSE_HOST and CLICKHOUSE_USER are non-sensitive and should be
//       set as [vars] in wrangler.toml or via Cloudflare Dashboard, not secrets.
const SECRET_KEYS = [
  'CLICKHOUSE_PASSWORD',
  // LLM API keys for AI Agent
  'LLM_API_KEY',
  'LLM_API_BASE',
  'OPENROUTER_API_KEY',
  'OPENROUTER_API_BASE',
  'NVIDIA_API_KEY',
  'NVIDIA_API_BASE',
  'ANYROUTER_API_KEY',
  'ANYROUTER_API_BASE',
  // Clerk authentication secret (never commit this)
  'CLERK_SECRET_KEY',
  // HMAC secret for issuing/verifying MCP API keys (shared with MCP worker)
  'CHM_API_KEY_SECRET',
  // LLM_MODEL has a default value and is selected via UI dropdown
  // These are already set in wrangler.toml [vars], so skip them:
  // 'CLICKHOUSE_HOST',
  // 'CLICKHOUSE_USER',
  // 'CLICKHOUSE_MAX_EXECUTION_TIME',
  // 'CLICKHOUSE_DEFAULT_CLUSTER',
  // 'CLICKHOUSE_TABLE_MAX_PARTS_WARN',
  // 'CLICKHOUSE_QUERY_STUCK_DETECTION_MAX_SECONDS',
  'CLICKHOUSE_TZ',
  'CLICKHOUSE_EXCLUDE_USER_DEFAULT',
  'NEXT_QUERY_CACHE_TTL',
]

function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match) {
      const [, key, value] = match
      env[key] = value
    }
  }

  return env
}

async function setSecretsBulk(
  env: Record<string, string>,
  keys: readonly string[],
  configPath?: string
): Promise<boolean> {
  // Create a temporary file with secrets in bulk format
  const tempFile = join(tmpdir(), `wrangler-secrets-${Date.now()}.txt`)

  const secretsToSet: string[] = []
  for (const key of keys) {
    const value = env[key]
    if (value && value !== '') {
      secretsToSet.push(`${key}=${value}`)
    }
  }

  if (secretsToSet.length === 0) {
    console.log('⚠️  No secrets to set')
    return false
  }

  writeFileSync(tempFile, secretsToSet.join('\n'))

  const target = configPath ? ` (config: ${configPath})` : ''
  console.log(`🔐 Setting ${secretsToSet.length} secrets in batch${target}...`)

  try {
    const args = ['secret', 'bulk', tempFile]
    if (configPath) args.push('--config', configPath)
    const proc = Bun.spawn(['wrangler', ...args], {
      stdout: 'inherit',
      stderr: 'inherit',
    })

    const exitCode = await proc.exited
    return exitCode === 0
  } finally {
    try {
      unlinkSync(tempFile)
    } catch {
      // Ignore cleanup errors
    }
  }
}

// Subset of secrets the standalone MCP worker actually consumes — see
// wrangler-mcp.toml and workers/mcp/index.ts.
const MCP_WORKER_SECRET_KEYS = [
  'CLICKHOUSE_PASSWORD',
  'CHM_API_KEY_SECRET',
] as const

async function main() {
  // Determine which env file to use (prefer .env.prod)
  let envFile: string
  if (existsSync(ENV_FILE_PROD)) {
    envFile = ENV_FILE_PROD
    console.log('📋 Reading environment variables from .env.prod...\n')
  } else if (existsSync(ENV_FILE_LOCAL)) {
    envFile = ENV_FILE_LOCAL
    console.log('📋 Reading environment variables from .env.local...\n')
  } else {
    console.error('❌ No .env.prod or .env.local found')
    process.exit(1)
  }

  let envContent = ''
  try {
    envContent = readFileSync(envFile, 'utf-8')
  } catch {
    console.error(`❌ Could not read ${envFile}`)
    process.exit(1)
  }

  const env = parseEnvFile(envContent)
  const envName = envFile.endsWith('.env.prod') ? '.env.prod' : '.env.local'

  console.log(`Found ${Object.keys(env).length} variables in ${envName}`)
  console.log(`Setting ${SECRET_KEYS.length} secrets...\n`)

  // List what will be set
  for (const key of SECRET_KEYS) {
    const value = env[key]
    if (value && value !== '') {
      // Redact sensitive values
      let preview: string
      if (
        key.includes('PASSWORD') ||
        key.includes('SECRET') ||
        key.includes('TOKEN')
      ) {
        preview = '***REDACTED***'
      } else {
        preview = value.length > 30 ? `${value.substring(0, 30)}...` : value
      }
      console.log(`  ${key} = "${preview}"`)
    } else {
      console.log(`  ⚠️  ${key} = (empty, will skip)`)
    }
  }

  console.log()
  const mainOk = await setSecretsBulk(env, SECRET_KEYS)
  if (!mainOk) {
    console.log('\n❌ Failed to set main worker secrets')
    process.exit(1)
  }

  console.log('\n🔌 Setting MCP worker secrets (wrangler-mcp.toml)...')
  const mcpOk = await setSecretsBulk(
    env,
    MCP_WORKER_SECRET_KEYS,
    'wrangler-mcp.toml'
  )
  if (!mcpOk) {
    // On a fresh account the MCP worker may not exist yet — wrangler errors
    // when targeting an unknown worker. Warn instead of failing so the
    // operator can deploy first, then re-run cf:config. cf:deploy runs
    // set-secrets AFTER the deploys, so this path is only hit when invoking
    // cf:config standalone before the first deploy.
    console.warn(
      '\n⚠️  MCP worker secrets push failed (worker may not be deployed yet).\n' +
        '   Run `bun run cf:deploy` first — that pipeline deploys the MCP\n' +
        '   worker and then re-runs this script automatically.\n'
    )
    process.exit(0)
  }

  console.log('\n✅ Done! All secrets set successfully on both workers')
}

main().catch(console.error)
