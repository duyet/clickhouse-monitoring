/**
 * Database Adapters
 *
 * Re-exports all database adapter implementations.
 * Each adapter provides database connection for a specific backend.
 */

export {
  createD1Adapter,
  createD1AdapterFromGlobal,
  type D1DrizzleDatabase,
  isD1Available,
} from './d1'
export {
  createPostgresAdapter,
  createPostgresAdapterFromEnv,
  type PostgresDatabase,
} from './postgres'
export {
  createDefaultSqliteAdapter,
  createSqliteAdapter,
  type SqliteDatabase,
} from './sqlite'
