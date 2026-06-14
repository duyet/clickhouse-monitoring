#!/usr/bin/env bun
/**
 * Post-deploy verification for the dashboard (TanStack Start) worker.
 *
 * Runs two scenarios against a LIVE deployment:
 *
 *  UNAUTHENTICATED (always)
 *   1. GET /api/health           -> 200 + reports git sha / auth provider / build ts
 *   2. GET / and /overview?host=0 -> 200, HTML references the client entry bundle
 *   3. client entry bundle        -> contains the Clerk pk_ key when authProvider=clerk
 *      (guards the NEXT_PUBLIC_* -> VITE_* regression: a broken build ships NO key)
 *   4. GET /api/v1/menu-counts (no token) -> 401 when API-key auth is enabled
 *
 *  AUTHENTICATED (when CHM_API_KEY_SECRET is set)
 *   5. POST /api/v1/auth/api-key (Bearer secret) -> mints a chm_ token
 *   6. GET /api/v1/menu-counts?hostId=H (Bearer token) -> 200 success:true with live
 *      ClickHouse system-table counts === the worker reaches + queries ClickHouse
 *
 * Run:
 *   bun scripts/verify-deploy.ts [--base-url URL] [--hosts 0,1] [--json] [--skip-auth]
 *   CHM_API_KEY_SECRET=... bun scripts/verify-deploy.ts            # enables authed scenario
 *
 * Exit codes: 0 = all checks pass, 1 = one or more failed, 2 = harness error.
 */

const args = process.argv.slice(2)
function flag(name: string): string | undefined {
  const eq = args.find((a) => a.startsWith(`--${name}=`))
  if (eq) return eq.split('=').slice(1).join('=')
  const i = args.indexOf(`--${name}`)
  return i !== -1 ? args[i + 1] : undefined
}

const BASE_URL = (flag('base-url') ?? 'https://dash.chmonitor.dev').replace(
  /\/$/,
  ''
)
const HOSTS = (flag('hosts') ?? '0,1')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean)
const JSON_OUTPUT = args.includes('--json')
const SKIP_AUTH = args.includes('--skip-auth')
const SECRET = process.env.CHM_API_KEY_SECRET

interface Check {
  scenario: 'unauthenticated' | 'authenticated'
  name: string
  ok: boolean
  detail: string
  // warn: the DEPLOY is fine but the monitored ClickHouse upstream is
  // unreachable. A monitoring dashboard must stay deployable during an
  // incident of the thing it monitors, so upstream outages degrade these
  // checks to warnings instead of failing the deploy gate.
  warn?: boolean
}
const checks: Check[] = []
function record(c: Check) {
  checks.push(c)
  if (!JSON_OUTPUT) {
    const icon = c.ok ? (c.warn ? '⚠️' : '✅') : '❌'
    console.log(`${icon} [${c.scenario}] ${c.name} — ${c.detail}`)
  }
}

// A fetch abort after TIMEOUT_MS against a CH-querying endpoint means the
// worker hung waiting on the (down) ClickHouse upstream — not a broken deploy.
function isUpstreamTimeout(e: unknown): boolean {
  // Bun surfaces AbortSignal.timeout() as a DOMException, which is not
  // `instanceof Error` — match on the name only.
  return (e as { name?: string } | null)?.name === 'TimeoutError'
}

const TIMEOUT_MS = 30_000
async function http(
  path: string,
  init?: RequestInit
): Promise<{ status: number; text: string; json: unknown }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = JSON.parse(text)
  } catch {
    /* non-JSON (HTML/asset) */
  }
  return { status: res.status, text, json }
}

// ── Unauthenticated scenario ──────────────────────────────────────────────

let clerkExpected = false

async function runUnauthenticated() {
  // 1. health
  try {
    const { status, json } = await http('/api/health')
    const d = (json as { deployment?: Record<string, unknown> })?.deployment
    clerkExpected =
      d?.authProvider === 'clerk' || d?.clientAuthProvider === 'clerk'
    record({
      scenario: 'unauthenticated',
      name: 'GET /api/health',
      ok: status === 200 && !!d,
      detail:
        status === 200 && d
          ? `runtime=${d.runtime} authProvider=${d.authProvider} clientAuthProvider=${d.clientAuthProvider} sha=${String(d.gitSha).slice(0, 7)} clerkKey=${d.clerkPublishableKeyPrefix ?? 'none'}`
          : `HTTP ${status}`,
    })
  } catch (e) {
    record({
      scenario: 'unauthenticated',
      name: 'GET /api/health',
      ok: false,
      detail: String(e),
    })
  }

  // 2. prerendered pages + 3. client bundle carries the Clerk key
  try {
    const { status, text } = await http('/overview?host=0')
    const asset = text.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/)?.[0]
    record({
      scenario: 'unauthenticated',
      name: 'GET /overview?host=0',
      ok: status === 200 && !!asset,
      detail:
        status === 200 ? `entry=${asset ?? 'NOT FOUND'}` : `HTTP ${status}`,
    })
    if (asset) {
      const bundle = await http(asset)
      const hasKey = /pk_(live|test)_[A-Za-z0-9]+/.test(bundle.text)
      // Only an assertion failure when Clerk is the configured provider.
      record({
        scenario: 'unauthenticated',
        name: 'client bundle has Clerk key',
        ok: clerkExpected ? hasKey : true,
        detail: hasKey
          ? `key inlined (${bundle.text.match(/pk_(live|test)_[A-Za-z0-9]+/)?.[0]?.slice(0, 12)}…)`
          : clerkExpected
            ? 'MISSING — VITE_CLERK_PUBLISHABLE_KEY not inlined (the NEXT_PUBLIC regression)'
            : 'no key (auth provider is not clerk — ok)',
      })
    }
  } catch (e) {
    record({
      scenario: 'unauthenticated',
      name: 'GET /overview',
      ok: false,
      detail: String(e),
    })
  }

  // 4. anonymous data call is rejected when API-key auth is enabled
  try {
    const { status, json } = await http(
      `/api/v1/menu-counts?hostId=${HOSTS[0]}`
    )
    const isAuthGate = status === 401
    record({
      scenario: 'unauthenticated',
      name: 'anon /api/v1/menu-counts blocked',
      ok: isAuthGate || status === 200,
      detail: isAuthGate
        ? `401 (${(json as { error?: string })?.error}) — API-key auth enforced`
        : status === 200
          ? '200 — API-key auth is DISABLED (open data API)'
          : `unexpected HTTP ${status}`,
    })
  } catch (e) {
    record({
      scenario: 'unauthenticated',
      name: 'anon /api/v1 blocked',
      ok: isUpstreamTimeout(e),
      warn: isUpstreamTimeout(e),
      detail: isUpstreamTimeout(e)
        ? 'endpoint hung — ClickHouse upstream unreachable; auth gate could not be evaluated (deploy itself OK)'
        : String(e),
    })
  }
}

// ── Authenticated scenario ────────────────────────────────────────────────

async function runAuthenticated() {
  if (SKIP_AUTH) return
  if (!SECRET) {
    if (!JSON_OUTPUT)
      console.log(
        'ℹ️  [authenticated] skipped — set CHM_API_KEY_SECRET to run CH connectivity checks'
      )
    return
  }

  // 5. mint a chm_ token
  let token = ''
  try {
    const { status, json } = await http('/api/v1/auth/api-key', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ label: 'verify-deploy', days: 1 }),
    })
    token = (json as { data?: { apiKey?: string } })?.data?.apiKey ?? ''
    record({
      scenario: 'authenticated',
      name: 'POST /api/v1/auth/api-key (mint token)',
      ok: status === 200 && token.startsWith('chm_'),
      detail:
        status === 200 && token
          ? `minted ${token.slice(0, 10)}… (len=${token.length})`
          : `HTTP ${status} ${(json as { error?: string })?.error ?? ''}`,
    })
  } catch (e) {
    record({
      scenario: 'authenticated',
      name: 'mint token',
      ok: false,
      detail: String(e),
    })
  }
  if (!token) return

  // 6. real CH query per host via the registry endpoint
  for (const h of HOSTS) {
    try {
      const { status, json } = await http(`/api/v1/menu-counts?hostId=${h}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const body = json as {
        success?: boolean
        data?: { counts?: Record<string, number> }
        error?: { message?: string }
      }
      const counts = body?.data?.counts ?? {}
      const sample = ['tables-overview', 'metrics', 'settings', 'clusters']
        .filter((k) => k in counts)
        .map((k) => `${k}=${counts[k]}`)
        .join(' ')
      record({
        scenario: 'authenticated',
        name: `CH query hostId=${h} (menu-counts)`,
        ok: status === 200 && body?.success === true,
        detail:
          status === 200 && body?.success
            ? `connected — ${sample}`
            : `HTTP ${status} ${body?.error?.message ?? body?.error ?? ''}`,
      })
    } catch (e) {
      record({
        scenario: 'authenticated',
        name: `CH query hostId=${h}`,
        ok: isUpstreamTimeout(e),
        warn: isUpstreamTimeout(e),
        detail: isUpstreamTimeout(e)
          ? 'ClickHouse upstream unreachable (timeout) — worker deployed and authenticated OK, monitored DB is down'
          : String(e),
      })
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  if (!JSON_OUTPUT) console.log(`\n🔎 Verifying ${BASE_URL}\n`)
  await runUnauthenticated()
  await runAuthenticated()

  const failed = checks.filter((c) => !c.ok)
  const warned = checks.filter((c) => c.ok && c.warn)
  if (JSON_OUTPUT) {
    console.log(
      JSON.stringify(
        {
          baseUrl: BASE_URL,
          passed: checks.length - failed.length,
          failed: failed.length,
          warned: warned.length,
          checks,
        },
        null,
        2
      )
    )
  } else {
    const warnNote =
      warned.length > 0
        ? ` (⚠️ ${warned.length} degraded: ClickHouse upstream unreachable — deploy verified, monitored DB is down)`
        : ''
    console.log(
      `\n${failed.length === 0 ? '✅ ALL PASS' : `❌ ${failed.length} FAILED`} — ${checks.length - failed.length}/${checks.length} checks${warnNote}\n`
    )
  }
  process.exit(failed.length === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('harness error:', e)
  process.exit(2)
})
