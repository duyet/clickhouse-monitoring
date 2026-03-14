/**
 * Local file-based migration storage.
 *
 * Tracks applied migrations in a local JSON file.
 * Used as fallback when no database is available.
 */

import type {
  Migration,
  MigrationRecord,
  MigrationStatus,
  MigrationStorage,
} from '../migration-runner'

import { calculateChecksum, getPlatformInfo } from '../utils'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const MIGRATIONS_FILE = '.migrations.json'
const STATE_DIR = '.migrations'

export class LocalMigrationStorage implements MigrationStorage {
  private readonly stateFilePath: string
  private readonly platformType = 'local'
  private stateCache: MigrationRecord[] | null = null

  constructor() {
    const stateDir = join(process.cwd(), STATE_DIR)
    this.stateFilePath = join(stateDir, MIGRATIONS_FILE)
  }

  /**
   * Initialize storage (create state file and directory if needed)
   */
  async initialize(): Promise<void> {
    const stateDir = join(process.cwd(), STATE_DIR)
    await mkdir(stateDir, { recursive: true })

    try {
      await readFile(this.stateFilePath, 'utf-8')
    } catch {
      await writeFile(this.stateFilePath, '[]', 'utf-8')
    }
  }

  /**
   * Get all applied migrations
   */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    const records = await this.readState()
    return records
  }

  /**
   * Record a migration as applied
   */
  async recordMigration(
    migration: Migration,
    status: MigrationStatus,
    executionTime: number
  ): Promise<void> {
    const records = await this.readState()
    const platformInfo = getPlatformInfo(this.platformType)
    const checksum = calculateChecksum(
      migration.sql || migration.scriptPath || ''
    )

    const record: MigrationRecord = {
      id: migration.id,
      name: migration.name,
      type: migration.type,
      status,
      appliedAt: Date.now(),
      checksum,
      executionTime,
      platform: platformInfo.platform,
      environment: platformInfo.environment,
    }

    records.push(record)
    this.writeState(records)
  }

  /**
   * Update migration status
   */
  async updateStatus(
    migrationId: string,
    status: MigrationStatus
  ): Promise<void> {
    const records = await this.readState()
    const record = records.find((r) => r.id === migrationId)

    if (record) {
      record.status = status
      await this.writeState(records)
    }
  }

  /**
   * Check if a migration has been applied
   */
  async isApplied(migrationId: string): Promise<boolean> {
    const records = await this.readState()
    return records.some((r) => r.id === migrationId)
  }

  /**
   * Read state from file with caching
   */
  private async readState(): Promise<MigrationRecord[]> {
    if (this.stateCache) {
      return this.stateCache
    }

    try {
      const content = await readFile(this.stateFilePath, 'utf-8')
      this.stateCache = JSON.parse(content)
      return this.stateCache ?? []
    } catch {
      return []
    }
  }

  /**
   * Write state to file with cache update
   */
  private async writeState(records: MigrationRecord[]): Promise<void> {
    try {
      await writeFile(
        this.stateFilePath,
        JSON.stringify(records, null, 2),
        'utf-8'
      )
      this.stateCache = records
    } catch (error) {
      throw new Error(`Failed to write migration state: ${error}`)
    }
  }
}
