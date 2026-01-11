/**
 * Repository factory and exports
 * Centralizes access to all data repositories
 */

import { AuditLogRepository } from './audit-log'
import { ClickhouseHostRepository } from './clickhouse-host'

// Generic database type that works with both SQLite and Postgres adapters
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDatabase = any

/**
 * Repository collection
 */
export class Repositories {
  readonly clickhouseHost: ClickhouseHostRepository
  readonly auditLog: AuditLogRepository

  constructor(db: DrizzleDatabase) {
    this.clickhouseHost = new ClickhouseHostRepository(db)
    this.auditLog = new AuditLogRepository(db)
  }
}

/**
 * Create repositories instance
 */
export async function createRepositories(): Promise<Repositories> {
  const { getDb } = await import('../index')
  const db = await getDb()
  return new Repositories(db)
}

// Export individual repositories
export { AuditLogRepository } from './audit-log'
export { ClickhouseHostRepository } from './clickhouse-host'
