#!/usr/bin/env bun

/**
 * Provision the `cloud.chmonitor.dev → dash.chmonitor.dev` 301 as a Cloudflare
 * edge Redirect Rule (Single Redirect, `http_request_dynamic_redirect` phase).
 *
 * Why an edge rule instead of Next.js middleware:
 *   The dashboard worker serves `cloud.chmonitor.dev`, but its `middleware.ts`
 *   host-redirect never fires for the *prerendered static root* — OpenNext on
 *   Workers returns that asset without invoking the worker, so the middleware
 *   code path is skipped and `/` returns 200 instead of 301. A zone Redirect
 *   Rule runs at the edge BEFORE the worker, so it fires for every path
 *   uniformly, even with `cloud.chmonitor.dev` still attached as a Worker
 *   custom domain (rules precede workers in Cloudflare's order of operations).
 *
 * Idempotent: re-running updates the existing rule (matched by description)
 * and preserves any other dynamic-redirect rules already on the zone.
 *
 * Auth: needs CLOUDFLARE_API_TOKEN with permissions
 *   Zone > Config Rules > Edit  (a.k.a. "Dynamic Redirect" / Rulesets edit)
 *   Zone > Zone > Read
 * Sourced from the environment or, failing that, .env.prod / .env.local
 * (same resolution as scripts/cloudflare-deploy.ts).
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=... bun run scripts/cloudflare-redirect-rule.ts
 *   bun run scripts/cloudflare-redirect-rule.ts --dry-run   # print, don't write
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ENV_FILE_PROD = join(__dirname, '..', 'apps', 'dashboard', '.env.prod')
const ENV_FILE_LOCAL = join(__dirname, '..', 'apps', 'dashboard', '.env.local')

// --- Config -----------------------------------------------------------------

const ZONE_NAME = 'chmonitor.dev'
const FROM_HOST = 'cloud.chmonitor.dev'
const TO_ORIGIN = 'https://dash.chmonitor.dev'
const RULE_DESCRIPTION = `${FROM_HOST} -> dash.chmonitor.dev (301)`
const PHASE = 'http_request_dynamic_redirect'

const DRY_RUN = process.argv.includes('--dry-run')

// --- Env --------------------------------------------------------------------

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

function resolveToken(): string {
  const fromEnv = process.env.CLOUDFLARE_API_TOKEN
  if (fromEnv && fromEnv !== '') return fromEnv
  const token = loadEnvFile().CLOUDFLARE_API_TOKEN
  if (!token || token === '') {
    console.error(
      '❌ CLOUDFLARE_API_TOKEN not set (env, apps/dashboard/.env.prod, or .env.local).\n' +
        '   Needs Zone > Config Rules > Edit + Zone > Zone > Read on ' +
        ZONE_NAME +
        '.'
    )
    process.exit(1)
  }
  return token
}

// --- Cloudflare API ---------------------------------------------------------

const API = 'https://api.cloudflare.com/client/v4'

async function cf<T>(
  token: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const json = (await res.json()) as {
    success: boolean
    result: T
    errors?: { code: number; message: string }[]
  }
  if (!res.ok || !json.success) {
    const detail = (json.errors ?? [])
      .map((e) => `[${e.code}] ${e.message}`)
      .join('; ')
    throw new Error(`CF API ${path} failed (${res.status}): ${detail}`)
  }
  return json.result
}

interface RedirectRule {
  id?: string
  action: string
  action_parameters?: unknown
  expression: string
  description?: string
  enabled?: boolean
}

// The rule we want present. `preserve_query_string` carries `?...` through, so
// the target is just origin + path.
const desiredRule: RedirectRule = {
  action: 'redirect',
  action_parameters: {
    from_value: {
      status_code: 301,
      target_url: {
        expression: `concat("${TO_ORIGIN}", http.request.uri.path)`,
      },
      preserve_query_string: true,
    },
  },
  expression: `(http.host eq "${FROM_HOST}")`,
  description: RULE_DESCRIPTION,
  enabled: true,
}

// Strip server-managed fields so a re-PUT of existing rules is accepted.
function sanitize(rule: RedirectRule): RedirectRule {
  const { id: _id, ...rest } = rule
  return rest
}

async function main() {
  const token = resolveToken()

  console.log(`🔎 Resolving zone id for ${ZONE_NAME}...`)
  const zones = await cf<{ id: string; name: string }[]>(
    token,
    `/zones?name=${ZONE_NAME}`
  )
  const zone = zones[0]
  if (!zone) {
    console.error(`❌ Zone ${ZONE_NAME} not found for this token.`)
    process.exit(1)
  }
  console.log(`   zone id: ${zone.id}`)

  // Read the current dynamic-redirect entrypoint ruleset (404 = none yet).
  let existing: RedirectRule[] = []
  try {
    const ruleset = await cf<{ rules?: RedirectRule[] }>(
      token,
      `/zones/${zone.id}/rulesets/phases/${PHASE}/entrypoint`
    )
    existing = ruleset.rules ?? []
  } catch {
    console.log('   no existing dynamic-redirect ruleset (will create one)')
  }

  const others = existing.filter((r) => r.description !== RULE_DESCRIPTION)
  const alreadyPresent = existing.some(
    (r) => r.description === RULE_DESCRIPTION
  )
  const rules = [...others.map(sanitize), sanitize(desiredRule)]

  console.log(
    `\n${alreadyPresent ? '♻️  Updating' : '➕ Adding'} rule: ${RULE_DESCRIPTION}`
  )
  console.log(`   ${FROM_HOST}/*  →  301  ${TO_ORIGIN}/<path>?<query>`)
  console.log(`   (preserving ${others.length} other dynamic-redirect rule(s))`)

  if (DRY_RUN) {
    console.log('\n--dry-run: payload that would be PUT:')
    console.log(JSON.stringify({ rules }, null, 2))
    return
  }

  await cf(token, `/zones/${zone.id}/rulesets/phases/${PHASE}/entrypoint`, {
    method: 'PUT',
    body: JSON.stringify({ rules }),
  })

  console.log('\n✅ Redirect rule provisioned. Verify with:')
  console.log(`   curl -sI https://${FROM_HOST}  # expect 301 → ${TO_ORIGIN}/`)
}

main().catch((err) => {
  console.error(`❌ ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
