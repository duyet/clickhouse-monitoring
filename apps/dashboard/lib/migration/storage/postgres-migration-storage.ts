/**
 * PostgreSQL-based migration storage.
 *
 * Tracks applied migrations in a PostgreSQL table.
 * Uses dynamic import for `postgres` to avoid bundling in CF Workers.
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
  applied_at BIGINT NOT NULL,
  checksum TEXT NOT NULL,
  execution_time BIGINT NOT NULL,
  platform TEXT NOT NULL,
  environment TEXT NOT NULL
);
`

export class PostgresMigrationStorage implements MigrationStorage {
  private sql: any | null = null
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

  /** Get PostgreSQL client (lazy, dynamic import) */
  private async getSql() {
    if (!this.sql) {
      const postgresModule = await import('postgres')
      this.sql = postgresModule.default(this.connectionString, {
        max: 1,
        prepare: false,
      })
    }
    return this.sql
  }

  async initialize(): Promise<void> {
    const sql = await this.getSql()

    try {
      await sql.unsafe(MIGRATIONS_TABLE)
    } catch (error) {
      throw new Error(`Failed to create migrations table: ${error}`)
    }
  }

  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    const sql = await this.getSql()

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
      return []
    }
  }

  async recordMigration(
    migration: Migration,
    status: MigrationStatus,
    executionTime: number
  ): Promise<void> {
    const sql = await this.getSql()
    const platformInfo = getPlatformInfo(this.platformType)
    const checksum = calculateChecksum(migration.sql || '')

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

  async updateStatus(
    migrationId: string,
    status: MigrationStatus
  ): Promise<void> {
    const sql = await this.getSql()

    await sql`
      UPDATE _migrations
      SET status = ${status}
      WHERE id = ${migrationId}
    `
  }

  async isApplied(migrationId: string): Promise<boolean> {
    const sql = await this.getSql()

    const result = await sql`
      SELECT 1 FROM _migrations
      WHERE id = ${migrationId}
      LIMIT 1
    `

    return result.length > 0
  }

  async close(): Promise<void> {
    if (this.sql) {
      await this.sql.end()
      this.sql = null
    }
  }
}
