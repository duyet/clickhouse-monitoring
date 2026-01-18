/**
 * Cloudflare D1 Database Adapter
 *
 * Provides D1 database connection for Cloudflare Workers deployments.
 * D1 is Cloudflare's serverless SQL database built on SQLite.
 */

import * as schema from '../schema'
import { type DrizzleD1Database, drizzle } from 'drizzle-orm/d1'

export type D1DrizzleDatabase = DrizzleD1Database<typeof schema>

/**
 * Create a D1 database connection
 *
 * @param d1 - D1Database binding from Cloudflare Workers
 * @returns Drizzle database instance
 */
export function createD1Adapter(d1: unknown): D1DrizzleDatabase {
  // D1 binding type is provided by Cloudflare Workers runtime
  // Using 'unknown' here to avoid type dependency issues
  return drizzle(d1 as Parameters<typeof drizzle>[0], { schema })
}

/**
 * Get D1 database from global context
 *
 * This is used when the D1 binding is available in the global scope
 * (e.g., through Cloudflare Workers environment).
 *
 * @returns Drizzle database instance
 * @throws Error if AUTH_DB binding is not available
 */
export function createD1AdapterFromGlobal(): D1DrizzleDatabase {
  const d1 = (globalThis as Record<string, unknown>).AUTH_DB

  if (!d1) {
    throw new Error(
      'D1 database binding (AUTH_DB) not found. ' +
        'Make sure you are running in Cloudflare Workers environment ' +
        'and have configured the D1 binding in wrangler.toml.'
    )
  }

  return createD1Adapter(d1)
}

/**
 * Check if D1 database is available
 *
 * @returns true if AUTH_DB binding exists
 */
export function isD1Available(): boolean {
  return !!(globalThis as Record<string, unknown>).AUTH_DB
}
