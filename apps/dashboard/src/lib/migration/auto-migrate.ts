/**
 * Conversation-store auto-migration — TanStack Start / Cloudflare no-op.
 *
 * The Next/OpenNext app migrated the CHM_CLOUD_D1 schema programmatically at
 * request time (`@chm/platform` + a migration runner). On the TanStack Start worker
 * the D1 schema is instead applied out-of-band at deploy time via
 * `wrangler d1 migrations apply` (the `migrations_dir` declared on the binding), so
 * the runtime path is intentionally a no-op. Callers still `await autoMigrate()`
 * before touching the store; this keeps that contract without the OpenNext coupling.
 */
export async function autoMigrate(): Promise<void> {
  // Intentionally empty — schema managed by `wrangler d1 migrations apply`.
}
