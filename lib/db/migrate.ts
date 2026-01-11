/**
 * Database migration runner
 * Supports SQLite, PostgreSQL, D1, and LibSQL
 * Can be run manually or automatically on startup
 */

import {
  detectDatabaseAdapter,
  getNormalizedDatabaseUrl,
  isAutoMigrationEnabled,
} from '@/lib/auth/config'

export async function runMigrations(): Promise<void> {
  const adapter = detectDatabaseAdapter()

  if (adapter === 'none') {
    console.log('[db] No database configured, skipping migrations')
    return
  }

  const autoMigrate = isAutoMigrationEnabled()
  if (!autoMigrate) {
    console.log('[db] AUTO_MIGRATE=false, skipping migrations')
    return
  }

  console.log(`[db] Running migrations for ${adapter}...`)

  try {
    switch (adapter) {
      case 'sqlite':
        await migrateSqlite()
        break
      case 'postgres':
        await migratePostgres()
        break
      case 'd1':
        console.log('[db] D1 uses wrangler migrations (run at deploy time)')
        break
      case 'libsql':
        await migrateLibsql()
        break
    }
    console.log(`[db] Migrations completed for ${adapter}`)
  } catch (error) {
    console.error(`[db] Migration failed for ${adapter}:`, error)
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
  }
}

async function migrateSqlite(): Promise<void> {
  try {
    const { drizzle } = await import('drizzle-orm/better-sqlite3')
    const { migrate } = await import('drizzle-orm/better-sqlite3/migrator')
    const Database = (await import('better-sqlite3')).default

    const dbUrl = getNormalizedDatabaseUrl()
    if (!dbUrl) throw new Error('DATABASE_URL not configured')

    const sqlite = new Database(dbUrl)
    const db = drizzle(sqlite)

    await migrate(db, { migrationsFolder: './lib/db/migrations' })
    sqlite.close()
  } catch (error) {
    console.error('[db] SQLite migration failed:', error)
    throw error
  }
}

async function migratePostgres(): Promise<void> {
  try {
    const { drizzle } = await import('drizzle-orm/postgres-js')
    const { migrate } = await import('drizzle-orm/postgres-js/migrator')
    const postgres = (await import('postgres')).default

    const dbUrl = getNormalizedDatabaseUrl()
    if (!dbUrl) throw new Error('DATABASE_URL not configured')

    const client = postgres(dbUrl, { max: 1 })
    const db = drizzle(client)

    await migrate(db, { migrationsFolder: './lib/db/migrations' })
    await client.end()
  } catch (error) {
    console.error('[db] PostgreSQL migration failed:', error)
    throw error
  }
}

async function migrateLibsql(): Promise<void> {
  // LibSQL support requires @libsql/client package
  // Install with: bun add @libsql/client
  throw new Error(
    'LibSQL adapter requires @libsql/client package. Install with: bun add @libsql/client'
  )
}

// Run migrations if executed directly
if (import.meta.main) {
  await runMigrations().catch((error) => {
    console.error('Failed to run migrations:', error)
    process.exit(1)
  })
}
