/**
 * PostgreSQL-based migration storage.
 *
 * Tracks applied migrations in a PostgreSQL table.
 * Used when DATABASE_URL is configured.
 */

import type {
  Migration,
  MigrationRecord,
  MigrationStatus,
  MigrationStorage,
} from '../migration-runner'

import { calculateChecksum, getPlatformInfo } from '../utils'
import postgres from 'postgres'

const MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS _migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  applied_at BIGINT NOT NULL,
  checksum TEXT NOT NULL,
  execution_time BIGINT NOT NULL,
  platform TEXT NOT NULL,
  environment TEXT NOT NULL
);
`

export class PostgresMigrationStorage implements MigrationStorage {
  private sql: ReturnType<typeof postgres> | null = null
  private readonly connectionString: string
  private readonly platformType = 'node-server'

  constructor(connectionString?: string) {
    this.connectionString =
      connectionString ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      ''

    if (!this.connectionString) {
      throw new Error('DATABASE_URL not set for PostgreSQL migration storage')
    }
  }

  /**
   * Get PostgreSQL client
   */
  private getSql() {
    if (!this.sql) {
      this.sql = postgres(this.connectionString, {
        max: 1,
        prepare: false,
      })
    }
    return this.sql
  }

  /**
   * Initialize storage (create migrations table if needed)
   */
  async initialize(): Promise<void> {
    const sql = this.getSql()

    try {
      await sql.unsafe(MIGRATIONS_TABLE)
    } catch (error) {
      throw new Error(`Failed to create migrations table: ${error}`)
    }
  }

  /**
   * Get all applied migrations
   */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    const sql = this.getSql()

    try {
      const rows = (await sql`
        SELECT * FROM _migrations ORDER BY applied_at ASC
      `) as any[]

      return rows.map((row) => ({
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
      // Table might not exist yet
      return []
    }
  }

  /**
   * Record a migration as applied
   */
  async recordMigration(
    migration: Migration,
    status: MigrationStatus,
    executionTime: number
  ): Promise<void> {
    const sql = this.getSql()
    const platformInfo = getPlatformInfo(this.platformType)
    const checksum = calculateChecksum(
      migration.sql || migration.scriptPath || ''
    )

    await sql`
      INSERT INTO _migrations (id, name, type, status, applied_at, checksum, execution_time, platform, environment)
      VALUES (
        ${migration.id},
        ${migration.name},
        ${migration.type},
        ${status},
        ${Date.now()},
        ${checksum},
        ${executionTime},
        ${platformInfo.platform},
        ${platformInfo.environment}
      )
    `
  }

  /**
   * Update migration status
   */
  async updateStatus(
    migrationId: string,
    status: MigrationStatus
  ): Promise<void> {
    const sql = this.getSql()

    await sql`
      UPDATE _migrations
      SET status = ${status}
      WHERE id = ${migrationId}
    `
  }

  /**
   * Check if a migration has been applied
   */
  async isApplied(migrationId: string): Promise<boolean> {
    const sql = this.getSql()

    const result = await sql`
      SELECT 1 FROM _migrations
      WHERE id = ${migrationId}
      LIMIT 1
    `

    return result.length > 0
  }

  /**
   * Close the connection
   */
  async close(): Promise<void> {
    if (this.sql) {
      await this.sql.end()
      this.sql = null
    }
  }
}
