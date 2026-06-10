#!/usr/bin/env bun

/**
 * Patch the generated wrangler.json with routes, vars, and worker name.
 *
 * @cloudflare/vite-plugin generates dist/server/wrangler.json during build,
 * but strips [[routes]] and [vars]. Additionally, Wrangler REJECTS env
 * sections in "redirected" (tool-generated) configs, so we can't use --env.
 * Instead, this script patches the top-level config directly for each target.
 *
 * IMPORTANT: If wrangler.toml routes/vars change, update the objects below.
 *
 * Usage:
 *   bun scripts/patch-wrangler-env.ts              # patch production values
 *   bun scripts/patch-wrangler-env.ts --env preview # patch preview values
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

// --- Shared vars (keep in sync with wrangler.toml) ---
// Deployment-specific values (ClickHouse host/user/name, OpenRouter referer)
// are read from the environment at deploy time and fall back to public
// localhost defaults. CI injects the real values from repo secrets (see the
// "Patch wrangler config" step in .github/workflows/cloudflare.yml); the
// committed defaults keep the public repo free of any private homelab info.
const SHARED_VARS = {
  CLICKHOUSE_HOST: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  CLICKHOUSE_USER: process.env.CLICKHOUSE_USER || 'default',
  CLICKHOUSE_NAME: process.env.CLICKHOUSE_NAME || 'localhost',
  CLICKHOUSE_MAX_EXECUTION_TIME: '60',
  CLOUDFLARE_WORKERS: '1',
  OPENROUTER_REFERER: process.env.OPENROUTER_REFERER || 'http://localhost:3000',
  OPENROUTER_APP_NAME: 'chmonitor',
  CHM_AUTH_PROVIDER: 'clerk',
  CHM_FEATURE_AGENT_ACCESS: 'authenticated',
  // Public read-only mode: anonymous visitors can view monitoring data; writes
  // (AI agent, KILL QUERY / OPTIMIZE TABLE, arbitrary SQL) still require sign-in.
  CHM_CLERK_PUBLIC_READ: 'true',
}
// NOTE: client auth config (auth provider + Clerk publishable key) is NOT a
// runtime worker var — it is build-time inlined via import.meta.env.VITE_* (see
// vite.config.ts CLIENT_ENV). Only the SERVER-side CHM_AUTH_PROVIDER lives here.

// --- Production config (keep in sync with wrangler.toml top-level) ---
const PROD_CONFIG = {
  name: 'chmonitor-dash-tsr',
  routes: [{ pattern: 'dash-tsr.chmonitor.dev', custom_domain: true }],
  vars: {
    ...SHARED_VARS,
    LLM_MODEL: 'anyrouter:@preset/chmonitor',
  },
}

// --- Preview config (keep in sync with wrangler.toml [env.preview]) ---
const PREVIEW_CONFIG = {
  name: 'preview-chmonitor-dash-tsr',
  routes: [{ pattern: 'preview.dash-tsr.chmonitor.dev', custom_domain: true }],
  vars: {
    ...SHARED_VARS,
    LLM_MODEL: 'anyrouter:z-ai/glm-4.7-flash',
  },
}

// --- Apply patches ---
const config = envName === 'preview' ? PREVIEW_CONFIG : PROD_CONFIG

generated.name = config.name
generated.routes = config.routes
generated.vars = config.vars

// Serve prerendered routes WITHOUT a trailing-slash redirect. The prerender emits
// dir-style output (dist/client/overview/index.html); CF Workers Assets' default
// `auto-trailing-slash` 308-redirects /overview -> /overview/, adding ~55 ms TTFB on
// every page. `drop-trailing-slash` serves /overview/index.html at /overview directly
// (matching the router's trailingSlash:'never'); /overview/ -> /overview. The
// @cloudflare/vite-plugin only sets `assets.directory`, so html_handling is added here.
generated.assets = {
  ...(generated.assets ?? {}),
  html_handling: 'drop-trailing-slash',
}

// Remove any env sections — Wrangler rejects them in redirected configs
delete generated.env

writeFileSync(JSON_PATH, JSON.stringify(generated, null, 2))

console.log(`✅ Patched wrangler.json for ${envName || 'production'}`)
console.log(`   name: ${config.name}`)
console.log(`   routes: ${config.routes.map((r) => r.pattern).join(', ')}`)
console.log(`   vars: ${Object.keys(config.vars).length} keys`)
