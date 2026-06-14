// Node-build shim for the `cloudflare:workers` virtual module.
//
// Aliased in vite.config.ts when BUILD_TARGET=node so the API routes'
//   import { env } from 'cloudflare:workers'
// resolves here under Node instead of the workerd built-in.
//
// On workerd, `env` is the Worker bindings object (process.env is NOT
// populated). On Node there are no bindings — env vars live on process.env —
// so we expose process.env under the same `env` name. The routes read only
// string-valued keys (CLICKHOUSE_HOST/USER/PASSWORD/NAME, APP_VERSION, etc.)
// and treat env as Record<string, string | undefined>, which is exactly
// process.env's shape.
//
// NOTE: only `env` is shimmed. Any new `cloudflare:workers` import a future
// route adds (WorkerEntrypoint, DurableObject, …) must be re-exported here for
// the Node target, or it will break the node build.
// Guard `process` — it may be undefined if this module is ever evaluated in a
// browser/client context (the Node target only aliases this server-side, but
// defensive against accidental client bundling).
export const env: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? process.env : {}
