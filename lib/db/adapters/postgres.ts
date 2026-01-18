/**
 * PostgreSQL Database Adapter
 *
 * Provides PostgreSQL database connection for production deployments.
 * Uses the postgres.js driver for optimal performance.
 */

import * as schema from '../schema'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

export type PostgresDatabase = ReturnType<typeof drizzle>

/**
 * Create a PostgreSQL database connection
 *
 * @param url - PostgreSQL connection URL
 * @param options - Optional postgres.js options
 * @returns Drizzle database instance
 */
export function createPostgresAdapter(
  url: string,
  options?: postgres.Options<Record<string, never>>
): PostgresDatabase {
  const client = postgres(url, {
    // Connection pool settings
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ...options,
  })

  return drizzle(client, { schema })
}

/**
 * Create PostgreSQL connection from environment variable
 *
 * @returns Drizzle database instance
 * @throws Error if DATABASE_URL is not set
 */
export function createPostgresAdapterFromEnv(): PostgresDatabase {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return createPostgresAdapter(url)
}
