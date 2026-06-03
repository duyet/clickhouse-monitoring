#!/usr/bin/env bun

/**
 * Patch the generated wrangler.json with routes and env sections.
 *
 * @cloudflare/vite-plugin generates dist/server/wrangler.json during build,
 * but strips [env.*] sections and [[routes]]. This script injects them back
 * so `wrangler deploy --env <name>` works correctly.
 *
 * IMPORTANT: If wrangler.toml routes/vars/env sections change, update the
 * objects below to match.
 *
 * Usage:
 *   bun scripts/patch-wrangler-env.ts              # production routes + vars
 *   bun scripts/patch-wrangler-env.ts --env preview # env.preview only
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const envFlag = process.argv.find((a) => a === '--env')
const envName = envFlag ? process.argv[process.argv.indexOf(envFlag) + 1] : null

const JSON_PATH = join(ROOT, 'dist', 'server', 'wrangler.json')

if (!existsSync(JSON_PATH)) {
  console.error(`❌ Generated config not found: ${JSON_PATH}`)
  console.error('   Run `bun run build` first.')
  process.exit(1)
}

const generated = JSON.parse(readFileSync(JSON_PATH, 'utf-8'))
let patched = 0

// --- Production routes and vars (keep in sync with wrangler.toml) ---
const PROD_ROUTES = [{ pattern: 'dash-tsr.chmonitor.dev', custom_domain: true }]

const PROD_VARS = {
  CLICKHOUSE_HOST:
    'https://duet-ubuntu.dingo-mora.ts.net,https://openclaw.dingo-mora.ts.net',
  CLICKHOUSE_USER: 'duyet,monitoring',
  CLICKHOUSE_NAME: 'duet-ubuntu,duyet-agent',
  CLICKHOUSE_MAX_EXECUTION_TIME: '60',
  CLOUDFLARE_WORKERS: '1',
  LLM_MODEL: 'anyrouter:@preset/chmonitor',
  OPENROUTER_REFERER: 'https://clickhouse.duyet.net',
  OPENROUTER_APP_NAME: 'chmonitor',
  CHM_AUTH_PROVIDER: 'clerk',
  NEXT_PUBLIC_AUTH_PROVIDER: 'clerk',
  CHM_FEATURE_AGENT_ACCESS: 'authenticated',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_Y2xlcmsuY2htb25pdG9yLmRldiQ',
}

// --- Preview env (keep in sync with wrangler.toml [env.preview]) ---
const PREVIEW_ENV = {
  name: 'preview-chmonitor-dash-tsr',
  routes: [{ pattern: 'preview.dash-tsr.chmonitor.dev', custom_domain: true }],
  vars: {
    ...PROD_VARS,
    LLM_MODEL: 'anyrouter:z-ai/glm-4.7-flash',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      'pk_test_bWFnbmV0aWMtcmF5LTkwLmNsZXJrLmFjY291bnRzLmRldiQ',
  },
}

// --- Apply patches ---
if (envName === 'preview') {
  if (!generated.env) generated.env = {}
  generated.env.preview = PREVIEW_ENV
  patched++
  console.log('✅ Patched env.preview into generated wrangler.json')
} else if (!envName) {
  // Production: patch top-level routes and vars
  generated.routes = PROD_ROUTES
  generated.vars = PROD_VARS
  patched += 2
  console.log('✅ Patched top-level routes into generated wrangler.json')
  console.log('✅ Patched top-level vars into generated wrangler.json')

  // Also patch env sections if they exist in the config above
  if (!generated.env) generated.env = {}
  generated.env.preview = PREVIEW_ENV
  patched++
  console.log('✅ Patched env.preview into generated wrangler.json')
}

writeFileSync(JSON_PATH, JSON.stringify(generated, null, 2))
console.log(`\n📝 Patched ${patched} section(s) into generated wrangler.json`)
