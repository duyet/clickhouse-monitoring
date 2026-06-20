/**
 * Insight store resolver — selects the persistence backend at runtime.
 *
 * Mirrors `conversation-store/resolve-store.ts`, but with an important policy
 * difference: insight persistence is **additive opt-in**, not flag-gated. The
 * default (`auto`) is ClickHouse — exactly the original behavior — so existing
 * deployments are unaffected. Operators switch backends by setting one env var:
 *
 *   INSIGHTS_STORE_BACKEND = auto | clickhouse | d1 | postgres | agentstate | memory
 *
 * `auto` never silently follows other env (e.g. the presence of DATABASE_URL for
 * conversations does not move insights to Postgres) — switching is always an
 * explicit decision. When an explicitly selected backend is missing its
 * prerequisite (no API key / connection string), we log and fall back to
 * ClickHouse so insight generation keeps working rather than breaking.
 *
 * The resolved store is memoized per process (keyed by the env value) so the
 * Postgres connection pool and AgentState client are created once.
 */

import type { InsightsBackendKind, InsightsStore } from './types'

import { ClickHouseInsightsStore } from './clickhouse-store'
import { MemoryInsightsStore } from './memory-store'
import { ErrorLogger } from '@chm/logger'

const COMPONENT = 'insights-resolve-store'
const warn = (msg: string) =>
  ErrorLogger.logWarning(`[insights-resolve-store] ${msg}`, {
    component: COMPONENT,
  })

const ENV_BACKEND = 'INSIGHTS_STORE_BACKEND'
const ENV_AGENTSTATE_KEY = 'AGENTSTATE_API_KEY'
const ENV_AGENTSTATE_BASE_URL = 'AGENTSTATE_BASE_URL'
const ENV_DATABASE_URL = 'DATABASE_URL'

const VALID: ReadonlySet<string> = new Set([
  'auto',
  'clickhouse',
  'd1',
  'postgres',
  'agentstate',
  'memory',
])

// Memoize per backend value so we don't reopen pools / clients on every call.
let cached: { key: string; store: Promise<InsightsStore> } | null = null

/**
 * Resolve the configured insight store. Memoized; call
 * {@link resetInsightsStoreCache} in tests to force re-resolution.
 */
export function resolveInsightsStore(): Promise<InsightsStore> {
  const raw = (process.env[ENV_BACKEND] ?? 'auto').trim().toLowerCase()
  const key = VALID.has(raw) ? raw : 'auto'

  if (!VALID.has(raw) && raw !== '') {
    warn(`unknown ${ENV_BACKEND}="${raw}", falling back to "auto" (clickhouse)`)
  }

  if (cached && cached.key === key) return cached.store

  // Memoize the in-flight/resolved promise, but DON'T let a rejection stick: if
  // build() rejects (e.g. a transient dynamic-import failure), clear the cache
  // so the next call retries instead of replaying the rejected promise forever.
  const store = build(key as InsightsBackendKind | 'auto').catch((err) => {
    if (cached?.store === store) cached = null
    throw err
  })
  cached = { key, store }
  return store
}

async function build(
  selection: InsightsBackendKind | 'auto'
): Promise<InsightsStore> {
  switch (selection) {
    case 'memory':
      return new MemoryInsightsStore()

    case 'd1': {
      const { D1InsightsStore } = await import('./d1-store')
      return new D1InsightsStore()
    }

    case 'postgres': {
      if (!process.env[ENV_DATABASE_URL]) {
        warn('postgres selected but DATABASE_URL is unset; using clickhouse')
        return new ClickHouseInsightsStore()
      }
      // Dynamic import keeps the Node-only `postgres` package out of the
      // Cloudflare Workers bundle (the CF path uses d1/clickhouse/agentstate).
      const { PostgresInsightsStore } = await import('./postgres-store')
      return new PostgresInsightsStore(process.env[ENV_DATABASE_URL])
    }

    case 'agentstate': {
      const apiKey = process.env[ENV_AGENTSTATE_KEY]
      if (!apiKey) {
        warn(
          'agentstate selected but AGENTSTATE_API_KEY is unset; using clickhouse'
        )
        return new ClickHouseInsightsStore()
      }
      const { AgentStateInsightsStore } = await import('./agentstate-store')
      return new AgentStateInsightsStore({
        apiKey,
        baseUrl: process.env[ENV_AGENTSTATE_BASE_URL],
      })
    }

    default:
      // 'auto' and 'clickhouse' both resolve to ClickHouse (the default).
      return new ClickHouseInsightsStore()
  }
}

/** Test-only: clear the memoized store so the next resolve re-reads env. */
export function resetInsightsStoreCache(): void {
  cached = null
}
