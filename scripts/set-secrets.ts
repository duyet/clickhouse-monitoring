#!/usr/bin/env bun
/**
 * Automatically set Wrangler secrets from .env.local in batch
 * Usage: bun run cf:config
 */

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const ENV_FILE = join(process.cwd(), '.env.local')

// Secrets to set (excluding NEXT_PUBLIC_* which are build-time only)
// Note: Variables already in wrangler.toml [vars] should NOT be in this list
const SECRET_KEYS = [
  'CLICKHOUSE_HOST',
  'CLICKHOUSE_USER',
  'CLICKHOUSE_PASSWORD',
  // These are already set in wrangler.toml [vars], so skip them:
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

async function setSecretsBulk(env: Record<string, string>): Promise<boolean> {
  // Create a temporary file with secrets in bulk format
  const tempFile = join(tmpdir(), `wrangler-secrets-${Date.now()}.txt`)

  const secretsToSet: string[] = []
  for (const key of SECRET_KEYS) {
    const value = env[key]
    if (value && value !== '') {
      secretsToSet.push(`${key}=${value}`)
    }
  }

  if (secretsToSet.length === 0) {
    console.log('⚠️  No secrets to set')
    return false
  }

  // Write secrets to temp file
  writeFileSync(tempFile, secretsToSet.join('\n'))

  console.log(`🔐 Setting ${secretsToSet.length} secrets in batch...`)

  try {
    // Use wrangler secret bulk with the temp file
    const proc = Bun.spawn(['wrangler', 'secret', 'bulk', tempFile], {
      stdout: 'inherit',
      stderr: 'inherit',
    })

    const exitCode = await proc.exited
    return exitCode === 0
  } finally {
    // Clean up temp file
    try {
      unlinkSync(tempFile)
    } catch {
      // Ignore cleanup errors
    }
  }
}

async function main() {
  console.log('📋 Reading environment variables from .env.local...\n')

  let envContent = ''
  try {
    envContent = readFileSync(ENV_FILE, 'utf-8')
  } catch {
    console.error(`❌ Could not read ${ENV_FILE}`)
    process.exit(1)
  }

  const env = parseEnvFile(envContent)

  console.log(`Found ${Object.keys(env).length} variables in .env.local`)
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
  const ok = await setSecretsBulk(env)

  if (ok) {
    console.log('\n✅ Done! All secrets set successfully')
  } else {
    console.log('\n❌ Failed to set secrets')
    process.exit(1)
  }
}

main().catch(console.error)
