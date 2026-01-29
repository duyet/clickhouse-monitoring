/**
 * Database client factory with multi-adapter support
 * Provides type-safe access to the database based on configured adapter
 */

import {
  detectDatabaseAdapter,
  getNormalizedDatabaseUrl,
  isDatabaseConfigured,
} from '@/lib/auth/config'

// Generic database type that works with both SQLite and Postgres adapters
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDatabase = any

let dbInstance: DrizzleDatabase | null = null

/**
 * Get database instance (singleton pattern)
 * Lazy loads and caches the database connection
 */
export async function getDb(): Promise<DrizzleDatabase> {
  if (dbInstance) {
    return dbInstance
  }

  const adapter = detectDatabaseAdapter()

  if (adapter === 'none') {
    throw new Error(
      'No database configured. Set DATABASE_URL environment variable.'
    )
  }

  switch (adapter) {
    case 'sqlite': {
      const { drizzle } = await import('drizzle-orm/better-sqlite3')
      const Database = (await import('better-sqlite3')).default

      const url = getNormalizedDatabaseUrl()
      if (!url) throw new Error('Invalid DATABASE_URL for SQLite')

      dbInstance = drizzle(new Database(url))
      return dbInstance
    }

    case 'postgres': {
      const { drizzle } = await import('drizzle-orm/postgres-js')
      const postgres = (await import('postgres')).default

      const url = getNormalizedDatabaseUrl()
      if (!url) throw new Error('Invalid DATABASE_URL for PostgreSQL')

      dbInstance = drizzle(postgres(url))
      return dbInstance
    }

    case 'libsql': {
      // LibSQL support requires @libsql/client package
      // Install with: bun add @libsql/client
      throw new Error(
        'LibSQL adapter requires @libsql/client package. Install with: bun add @libsql/client'
      )
    }

    case 'd1': {
      // D1 adapter requires Cloudflare environment
      throw new Error('D1 database adapter requires Cloudflare Workers runtime')
    }

    default:
      throw new Error(`Unsupported database adapter: ${adapter}`)
  }
}

/**
 * Get database instance (throws if not configured)
 */
export async function getDbOrThrow(): Promise<DrizzleDatabase> {
  if (!isDatabaseConfigured()) {
    throw new Error('Database not configured')
  }
  return getDb()
}

/**
 * Close database connection (for cleanup)
 */
export async function closeDb(): Promise<void> {
  // Note: Most database adapters handle cleanup automatically
  // but you can call this for explicit cleanup if needed
  dbInstance = null
}

/**
 * Reset database instance (useful for testing)
 */
export function resetDbInstance(): void {
  dbInstance = null
}
