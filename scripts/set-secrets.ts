#!/usr/bin/env bun

/**
 * Automatically set Wrangler secrets from environment file in batch
 * Priority: .env.prod > .env.local
 * Usage: bun run cf:config
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Priority: .env.prod > .env.local
const ENV_FILE_PROD = join(process.cwd(), '.env.prod')
const ENV_FILE_LOCAL = join(process.cwd(), '.env.local')

// The MCP worker now lives at apps/mcp/. Anchor its wrangler config to
// this script's location so it resolves regardless of cwd.
const MCP_WRANGLER_CONFIG = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'apps',
  'mcp',
  'wrangler.toml'
)

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

interface SecretPushResult {
  ok: boolean
  missingWorker: boolean
  stderr: string
}

// Wrangler's error message when a worker doesn't exist yet. Match generously
// — Cloudflare phrases this differently across versions ("worker not found",
// "service not found", "could not find a worker named", etc.).
const MISSING_WORKER_PATTERNS = [
  /worker.{0,12}(?:not\s*found|does\s*not\s*exist)/i,
  /service.{0,12}(?:not\s*found|does\s*not\s*exist)/i,
  /could not find a (worker|service)/i,
  /\[code:?\s*10007\]/i,
]

async function setSecretsBulk(
  env: Record<string, string>,
  keys: readonly string[],
  configPath?: string
): Promise<SecretPushResult> {
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
    return { ok: false, missingWorker: false, stderr: '' }
  }

  writeFileSync(tempFile, secretsToSet.join('\n'))

  const target = configPath ? ` (config: ${configPath})` : ''
  console.log(`🔐 Setting ${secretsToSet.length} secrets in batch${target}...`)

  try {
    const args = ['secret', 'bulk', tempFile]
    if (configPath) args.push('--config', configPath)
    // Pipe stderr so we can classify "worker not found" (benign bootstrap
    // state) vs any other failure (real error, must surface). Mirror stderr
    // to our process stderr so the operator still sees the wrangler output.
    const proc = Bun.spawn(['wrangler', ...args], {
      stdout: 'inherit',
      stderr: 'pipe',
    })

    const stderrText = await new Response(proc.stderr).text()
    process.stderr.write(stderrText)

    const exitCode = await proc.exited
    const ok = exitCode === 0
    const missingWorker =
      !ok && MISSING_WORKER_PATTERNS.some((re) => re.test(stderrText))
    return { ok, missingWorker, stderr: stderrText }
  } finally {
    try {
      unlinkSync(tempFile)
    } catch {
      // Ignore cleanup errors
    }
  }
}

// Subset of secrets the standalone MCP worker actually consumes — see
// apps/mcp/wrangler.toml and apps/mcp/src/index.ts.
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
  const mainResult = await setSecretsBulk(env, SECRET_KEYS)
  if (!mainResult.ok) {
    console.log('\n❌ Failed to set main worker secrets')
    process.exit(1)
  }

  console.log('\n🔌 Setting MCP worker secrets (apps/mcp/wrangler.toml)...')
  const mcpResult = await setSecretsBulk(
    env,
    MCP_WORKER_SECRET_KEYS,
    MCP_WRANGLER_CONFIG
  )
  if (!mcpResult.ok) {
    if (mcpResult.missingWorker) {
      // Benign bootstrap state: operator ran cf:config before the first
      // cf:deploy. cf:deploy itself runs set-secrets AFTER deploying both
      // workers, so this branch never fires from there.
      console.warn(
        '\n⚠️  MCP worker is not deployed yet — secrets push skipped.\n' +
          '   Run `bun run cf:deploy` first; it deploys the MCP worker and\n' +
          '   then re-runs this script automatically.\n'
      )
      process.exit(0)
    }
    // Real failure (auth, network, wrangler bug, etc.). Surface it so
    // cf:deploy aborts and the operator doesn't end up with a deployed but
    // mis-secreted worker.
    console.error(
      '\n❌ Failed to set MCP worker secrets (not a missing-worker error).'
    )
    process.exit(1)
  }

  console.log('\n✅ Done! All secrets set successfully on both workers')
}

main().catch(console.error)
