#!/usr/bin/env bun

/**
 * Patch the generated wrangler.json with routes and env sections from wrangler.toml.
 *
 * @cloudflare/vite-plugin generates dist/server/wrangler.json during build,
 * but strips [env.*] sections and [[routes]] (routes, vars, etc). This script
 * reads the original wrangler.toml, extracts configs, and injects them into
 * the generated JSON so `wrangler deploy --env <name>` works correctly.
 *
 * Usage:
 *   bun scripts/patch-wrangler-env.ts              # patch production routes + all envs
 *   bun scripts/patch-wrangler-env.ts --env preview # patch only env.preview
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Parse --env flag
const envFlag = process.argv.find((a) => a === '--env')
const envName = envFlag ? process.argv[process.argv.indexOf(envFlag) + 1] : null

const TOML_PATH = join(ROOT, 'wrangler.toml')
const JSON_PATH = join(ROOT, 'dist', 'server', 'wrangler.json')

if (!existsSync(JSON_PATH)) {
  console.error(`❌ Generated config not found: ${JSON_PATH}`)
  console.error('   Run `bun run build` first.')
  process.exit(1)
}

const { parse } = await import('smol-toml')
const toml = parse(readFileSync(TOML_PATH, 'utf-8'))
const generated = JSON.parse(readFileSync(JSON_PATH, 'utf-8'))

let patched = 0

// Patch top-level routes (production custom domains)
if (toml.routes && !envName) {
  generated.routes = toml.routes
  patched++
  console.log(`✅ Patched top-level routes into generated wrangler.json`)
}

// Patch top-level vars (production vars)
if (toml.vars && !envName) {
  generated.vars = toml.vars
  patched++
  console.log(`✅ Patched top-level vars into generated wrangler.json`)
}

// Patch env sections
const tomlEnvs = (toml.env || {}) as Record<string, unknown>
const envNames = envName ? [envName] : Object.keys(tomlEnvs)

if (!generated.env) generated.env = {}

for (const name of envNames) {
  const envConfig = tomlEnvs[name]
  if (!envConfig || typeof envConfig !== 'object') {
    console.warn(`⚠️  env.${name} not found in wrangler.toml, skipping.`)
    continue
  }

  generated.env[name] = envConfig
  patched++
  console.log(`✅ Patched env.${name} into generated wrangler.json`)
}

writeFileSync(JSON_PATH, JSON.stringify(generated, null, 2))

console.log(`\n📝 Patched ${patched} section(s) into generated wrangler.json`)
