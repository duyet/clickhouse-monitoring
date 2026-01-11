/**
 * SQLite Database Adapter
 *
 * Provides SQLite/better-sqlite3 database connection for local development
 * and self-hosted deployments.
 */

import * as schema from '../schema'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

export type SqliteDatabase = ReturnType<typeof drizzle>

/**
 * Create a SQLite database connection
 *
 * @param url - File path to the SQLite database
 * @returns Drizzle database instance
 */
export function createSqliteAdapter(url: string): SqliteDatabase {
  const sqlite = new Database(url)

  // Enable WAL mode for better concurrency
  sqlite.pragma('journal_mode = WAL')

  return drizzle(sqlite, { schema })
}

/**
 * Create SQLite database with default path
 *
 * @param filename - Database filename (default: 'auth.db')
 * @returns Drizzle database instance
 */
export function createDefaultSqliteAdapter(
  filename = 'auth.db'
): SqliteDatabase {
  return createSqliteAdapter(`./data/${filename}`)
}
