/**
 * D1-based migration storage.
 *
 * Tracks applied migrations in a D1 database table.
 * Accepts D1Database as constructor parameter or auto-detects from Cloudflare context.
 */

import type {
  Migration,
  MigrationRecord,
  MigrationStatus,
  MigrationStorage,
} from '../migration-runner'

import { calculateChecksum, getPlatformInfo } from '../utils'

const MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS _migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  applied_at INTEGER NOT NULL,
  checksum TEXT NOT NULL,
  execution_time INTEGER NOT NULL,
  platform TEXT NOT NULL,
  environment TEXT NOT NULL
);
`

export class D1MigrationStorage implements MigrationStorage {
  private db: D1Database | null
  private readonly platformType = 'cloudflare-workers'

  constructor(db?: D1Database) {
    this.db = db || null
  }

  /** Get D1 database binding */
  private async getDb(): Promise<D1Database> {
    if (this.db) return this.db

    try {
      const { getCloudflareContext } = await import('@opennextjs/cloudflare')
      const ctx = await getCloudflareContext()

      if (ctx?.env?.CONVERSATIONS_D1) {
        this.db = ctx.env.CONVERSATIONS_D1 as D1Database
      } else if (ctx?.env?.NEXT_TAG_CACHE_D1) {
        this.db = ctx.env.NEXT_TAG_CACHE_D1 as D1Database
      } else {
        throw new Error('No D1 binding found')
      }
    } catch (error) {
      throw new Error(`Failed to get D1 binding: ${error}`)
    }

    return this.db
  }

  async initialize(): Promise<void> {
    const db = await this.getDb()

    try {
      await db.exec(MIGRATIONS_TABLE)
    } catch (error) {
      throw new Error(`Failed to create migrations table: ${error}`)
    }
  }

  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    const db = await this.getDb()

    try {
      const stmt = db.prepare(
        'SELECT * FROM _migrations ORDER BY applied_at ASC'
      )
      const result = await stmt.all()

      return (result.results || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        status: row.status as MigrationStatus,
        appliedAt: row.applied_at,
        checksum: row.checksum,
        executionTime: row.execution_time,
        platform: row.platform,
        environment: row.environment,
      }))
    } catch {
      return []
    }
  }

  async recordMigration(
    migration: Migration,
    status: MigrationStatus,
    executionTime: number
  ): Promise<void> {
    const db = await this.getDb()
    const platformInfo = getPlatformInfo(this.platformType)
    const checksum = calculateChecksum(migration.sql || '')

    const stmt = db.prepare(
      `INSERT INTO _migrations (id, name, type, status, applied_at, checksum, execution_time, platform, environment)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    )

    await stmt
      .bind(
        migration.id,
        migration.name,
        migration.type,
        status,
        Date.now(),
        checksum,
        executionTime,
        platformInfo.platform,
        platformInfo.environment
      )
      .run()
  }

  async updateStatus(
    migrationId: string,
    status: MigrationStatus
  ): Promise<void> {
    const db = await this.getDb()
    const stmt = db.prepare('UPDATE _migrations SET status = ?1 WHERE id = ?2')
    await stmt.bind(status, migrationId).run()
  }

  async isApplied(migrationId: string): Promise<boolean> {
    const db = await this.getDb()

    try {
      const stmt = db.prepare('SELECT 1 FROM _migrations WHERE id = ?1 LIMIT 1')
      const result = await stmt.bind(migrationId).first()
      return !!result
    } catch {
      return false
    }
  }

  async close(): Promise<void> {
    this.db = null
  }
}
