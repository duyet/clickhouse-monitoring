/**
 * Server env bridge for ClickHouse access on Cloudflare Workers.
 *
 * `@chm/clickhouse-client` resolves host config from `process.env.CLICKHOUSE_*`
 * (see packages/clickhouse-client/.../env-schema.ts — it reads `process.env`
 * directly and caches the result). In the Next dashboard those vars are present
 * on `process.env` ambiently. In this TanStack Start / Workers app the canonical
 * source is the Worker binding (`import { env } from 'cloudflare:workers'`), so
 * we must copy the CLICKHOUSE_* values onto `process.env` before the first
 * query — otherwise the client sees no hosts.
 *
 * Call `bridgeClickHouseEnv(env)` at the top of every CH-querying route handler,
 * passing the Worker `env` binding. It is idempotent and cheap.
 *
 * NOTE: the client caches the parsed env after first read. The bridge runs
 * before any client call within a request, and Worker isolates are short-lived,
 * so the cache reflects the bound values. If you ever rotate a secret you must
 * redeploy (same constraint as the Next app — see secret-rotation knowledge).
 */

const CLICKHOUSE_ENV_KEYS = [
  'CLICKHOUSE_HOST',
  'CLICKHOUSE_USER',
  'CLICKHOUSE_PASSWORD',
  'CLICKHOUSE_NAME',
  'CLICKHOUSE_MAX_EXECUTION_TIME',
] as const

export type ClickHouseBindings = Record<string, string | undefined>

/**
 * Copy CLICKHOUSE_* values from the Worker `env` binding onto `process.env`
 * so `@chm/clickhouse-client` can read them. Only sets keys that are present
 * on the binding and not already set, to avoid clobbering a local `.dev.vars`
 * / process env during `vite dev` on node.
 */
export function bridgeClickHouseEnv(bindings: ClickHouseBindings): void {
  if (typeof process === 'undefined' || !process.env) return
  for (const key of CLICKHOUSE_ENV_KEYS) {
    const value = bindings[key]
    if (value != null && value !== '' && process.env[key] == null) {
      process.env[key] = value
    }
  }
}
