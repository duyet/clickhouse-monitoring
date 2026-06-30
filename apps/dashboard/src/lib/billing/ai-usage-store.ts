/**
 * AI daily usage store — D1 persistence for the per-owner per-day AI request
 * counter consumed by the plan-enforcement gate in the agent route.
 *
 * Reads and writes degrade gracefully: when the CHM_CLOUD_D1 binding is absent
 * (local dev, self-host) or the table does not yet exist, functions return safe
 * defaults (0 / no-op) so OSS deployments are never gated.
 *
 * Schema: see src/db/conversations-migrations/0005_ai_usage_daily.sql
 */

import { getPlatformBindings } from '@chm/platform'

/** Returns the UTC date string 'YYYY-MM-DD' for the given instant. */
export function utcDayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

function getDb() {
  return getPlatformBindings().getD1Database('CHM_CLOUD_D1')
}

/**
 * Return how many AI requests `ownerId` has made today (UTC).
 * Returns 0 when D1 is unavailable or no row exists yet.
 */
export async function getAiUsageToday(
  ownerId: string,
  now: Date = new Date()
): Promise<number> {
  const db = getDb()
  if (!db) return 0
  try {
    const row = await db
      .prepare(
        `SELECT count FROM ai_usage_daily WHERE owner_id = ?1 AND day = ?2`
      )
      .bind(ownerId, utcDayKey(now))
      .first<{ count: number }>()
    return row?.count ?? 0
  } catch {
    return 0
  }
}

/**
 * Atomically increment `ownerId`'s request count for today (UTC).
 * No-op when D1 is unavailable.
 */
export async function incrementAiUsage(
  ownerId: string,
  now: Date = new Date()
): Promise<void> {
  const db = getDb()
  if (!db) return
  try {
    const updatedAt = Math.floor(now.getTime() / 1000)
    await db
      .prepare(
        `INSERT INTO ai_usage_daily (owner_id, day, count, updated_at)
         VALUES (?1, ?2, 1, ?3)
         ON CONFLICT(owner_id, day) DO UPDATE SET
           count      = count + 1,
           updated_at = excluded.updated_at`
      )
      .bind(ownerId, utcDayKey(now), updatedAt)
      .run()
  } catch {
    // Swallow: a missing table or transient D1 error must not break the request.
  }
}
