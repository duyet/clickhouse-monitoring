/**
 * Migration system for ClickHouse Monitor.
 *
 * Simplified migration runner supporting D1 (via wrangler) and PostgreSQL.
 * For CF Workers, D1 migrations are handled natively by `wrangler d1 migrations apply`.
 * This runner is primarily used for Node/Docker deployments with PostgreSQL,
 * and as a CLI tool for status/dry-run commands.
 */

// ============================================================================
// Types
// ============================================================================

/** Deployment platform */
export type Platform = 'cloudflare' | 'node' | 'docker'

/** Migration type */
export enum MigrationType {
  /** SQL schema migration (D1 / SQLite) */
  D1_SQL = 'd1-sql',
  /** SQL schema migration (PostgreSQL) */
  POSTGRES_SQL = 'postgres-sql',
  /** Custom TypeScript/JavaScript migration */
  SCRIPT = 'script',
}

/** Migration status */
export enum MigrationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  APPLIED = 'applied',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled-back',
}

/** Platform detection result */
export interface PlatformInfo {
  platform: Platform
  environment: string
  isCloudflare: boolean
}

/** Migration definition */
export interface Migration {
  /** Unique migration identifier (e.g., "0001_conversations") */
  id: string
  /** Human-readable name */
  name: string
  /** Migration type */
  type: MigrationType
  /** SQL content (for SQL migrations) */
  sql?: string
  /** Migration function (for SCRIPT migrations) */
  up?: () => Promise<void>
  /** Rollback function */
  down?: () => Promise<void>
  /** Dependencies (other migration IDs that must run first) */
  dependsOn?: string[]
}

/** Migration state record (persisted) */
export interface MigrationRecord {
  id: string
  name: string
  type: MigrationType
  status: MigrationStatus
  appliedAt: number
  checksum: string
  executionTime: number
  platform: string
  environment: string
}

/** Migration storage interface */
export interface MigrationStorage {
  initialize(): Promise<void>
  getAppliedMigrations(): Promise<MigrationRecord[]>
  recordMigration(
    migration: Migration,
    status: MigrationStatus,
    executionTime: number
  ): Promise<void>
  updateStatus(migrationId: string, status: MigrationStatus): Promise<void>
  isApplied(migrationId: string): Promise<boolean>
  close?(): Promise<void>
}

/** Migration runner options */
export interface MigrationRunnerOptions {
  dryRun?: boolean
  force?: boolean
  target?: string
  rollback?: boolean
  verbose?: boolean
}

/** Migration result */
export interface MigrationResult {
  migration: Migration
  status: MigrationStatus
  executionTime: number
  error?: Error
}

// ============================================================================
// Platform Detection
// ============================================================================

/** Detect the current platform and environment */
export function detectPlatform(): PlatformInfo {
  const env = process.env

  if (env.CLOUDFLARE_WORKERS === '1' || env.MINIFLARE) {
    return {
      platform: 'cloudflare',
      environment: env.NODE_ENV || 'production',
      isCloudflare: true,
    }
  }

  if (env.DOCKER_CONTAINER) {
    return {
      platform: 'docker',
      environment: env.NODE_ENV || 'production',
      isCloudflare: false,
    }
  }

  return {
    platform: 'node',
    environment: env.NODE_ENV || 'development',
    isCloudflare: false,
  }
}

/** Get the appropriate migration storage for the current platform */
export async function getMigrationStorage(
  info?: PlatformInfo
): Promise<MigrationStorage> {
  const platformInfo = info || detectPlatform()

  // Try D1 storage for Cloudflare
  if (platformInfo.isCloudflare) {
    try {
      const { D1MigrationStorage } = await import(
        './storage/d1-migration-storage'
      )
      return new D1MigrationStorage()
    } catch {
      // Fall through
    }
  }

  // Try PostgreSQL storage
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (
    dbUrl &&
    (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))
  ) {
    try {
      const { PostgresMigrationStorage } = await import(
        './storage/postgres-migration-storage'
      )
      return new PostgresMigrationStorage()
    } catch {
      // Fall through
    }
  }

  // Default to local file-based storage
  const { LocalMigrationStorage } = await import(
    './storage/local-migration-storage'
  )
  return new LocalMigrationStorage()
}

// ============================================================================
// Migration Registry
// ============================================================================

/** Default directories for each migration type */
const DEFAULT_TYPE_DIRS: Partial<Record<MigrationType, string>> = {
  [MigrationType.D1_SQL]: 'src/db/conversations-migrations',
  [MigrationType.POSTGRES_SQL]: 'lib/conversation-store/pg-migrations',
}

/**
 * Migration registry - discovers and registers migrations.
 *
 * Supports two modes:
 * 1. Direct registration via `register()` — works everywhere including CF Workers
 * 2. Filesystem discovery via `discover()` — Node/Docker only (uses fs APIs)
 */
export class MigrationRegistry {
  private migrations = new Map<string, Migration>()
  private typeDirs: Partial<Record<MigrationType, string>>

  constructor(typeDirs?: Partial<Record<MigrationType, string>>) {
    this.typeDirs = { ...DEFAULT_TYPE_DIRS, ...typeDirs }
  }

  /**
   * Discover migrations from the filesystem.
   * Only works in Node.js/Docker environments (not CF Workers).
   */
  async discover(): Promise<void> {
    // Dynamic import to avoid bundling fs in CF Workers
    const { readdirSync, readFileSync, statSync } = await import('node:fs')
    const { join } = await import('node:path')

    for (const [type, typeDir] of Object.entries(this.typeDirs)) {
      if (!typeDir) continue
      const dir = join(process.cwd(), typeDir)

      try {
        const stat = statSync(dir)
        if (!stat.isDirectory()) continue
      } catch {
        continue
      }

      const entries = readdirSync(dir)

      for (const entry of entries) {
        if (!entry.endsWith('.sql')) continue

        const match = entry.match(/^(\d+)(?:_([^.]+))?\.(sql)$/)
        if (!match) continue

        const [, id, description] = match
        const migrationId = description ? `${id}_${description}` : id
        const filePath = join(dir, entry)
        const sql = readFileSync(filePath, 'utf-8')

        this.register({
          id: migrationId,
          name: description || `Migration ${id}`,
          type: type as MigrationType,
          sql,
        })
      }
    }
  }

  /** Register a migration directly (works in all environments) */
  register(migration: Migration): void {
    this.migrations.set(migration.id, migration)
  }

  /** Register multiple migrations at once */
  registerAll(migrations: Migration[]): void {
    for (const m of migrations) {
      this.register(m)
    }
  }

  get(id: string): Migration | undefined {
    return this.migrations.get(id)
  }

  getAll(): Migration[] {
    return Array.from(this.migrations.values()).sort((a, b) =>
      a.id.localeCompare(b.id)
    )
  }

  async getPending(appliedIds: Set<string>): Promise<Migration[]> {
    return this.getAll().filter((m) => !appliedIds.has(m.id))
  }
}

// ============================================================================
// Migration Runner
// ============================================================================

export class MigrationRunner {
  private registry: MigrationRegistry
  private storage: MigrationStorage
  private platformInfo: PlatformInfo

  constructor(
    registry: MigrationRegistry,
    storage: MigrationStorage,
    platformInfo?: PlatformInfo
  ) {
    this.registry = registry
    this.storage = storage
    this.platformInfo = platformInfo || detectPlatform()
  }

  /** Run all pending migrations */
  async run(options: MigrationRunnerOptions = {}): Promise<MigrationResult[]> {
    const {
      dryRun = false,
      force = false,
      target,
      rollback = false,
      verbose = false,
    } = options

    try {
      await this.storage.initialize()

      const appliedRecords = await this.storage.getAppliedMigrations()
      const appliedIds = new Set(appliedRecords.map((r) => r.id))

      let pending: Migration[]
      if (target) {
        const migration = this.registry.get(target)
        if (!migration) throw new Error(`Migration ${target} not found`)
        pending = [migration]
      } else if (rollback) {
        pending = this.registry.getAll().reverse()
      } else {
        pending = await this.registry.getPending(appliedIds)
      }

      if (pending.length === 0) {
        console.log('✅ No pending migrations to run')
        return []
      }

      console.log(`🔄 Found ${pending.length} migration(s) to run`)

      const results: MigrationResult[] = []

      for (const migration of pending) {
        if (!force && !rollback && appliedIds.has(migration.id)) {
          if (verbose)
            console.log(`⊘ Skipping ${migration.id} (already applied)`)
          continue
        }

        const startTime = Date.now()

        try {
          if (dryRun) {
            console.log(`[DRY RUN] Would apply: ${migration.id}`)
            results.push({
              migration,
              status: MigrationStatus.PENDING,
              executionTime: 0,
            })
            continue
          }

          console.log(`▶ Running ${migration.id} (${migration.name})...`)

          // Execute migration
          if (rollback) {
            await this.executeRollback(migration)
          } else {
            await this.executeMigration(migration)
          }

          const executionTime = Date.now() - startTime

          // Record as applied (record first, then status is already set correctly)
          await this.storage.recordMigration(
            migration,
            rollback ? MigrationStatus.ROLLED_BACK : MigrationStatus.APPLIED,
            executionTime
          )

          console.log(`✅ ${migration.id} completed in ${executionTime}ms`)

          results.push({
            migration,
            status: rollback
              ? MigrationStatus.ROLLED_BACK
              : MigrationStatus.APPLIED,
            executionTime,
          })
        } catch (error) {
          const executionTime = Date.now() - startTime

          // Record failure (use recordMigration, not updateStatus)
          try {
            await this.storage.recordMigration(
              migration,
              MigrationStatus.FAILED,
              executionTime
            )
          } catch {
            // Best effort — storage might be unavailable
          }

          console.error(`❌ ${migration.id} failed: ${error}`)

          results.push({
            migration,
            status: MigrationStatus.FAILED,
            executionTime,
            error: error as Error,
          })

          break // Stop on first error
        }
      }

      return results
    } finally {
      if (this.storage.close) {
        await this.storage.close()
      }
    }
  }

  private async executeMigration(migration: Migration): Promise<void> {
    switch (migration.type) {
      case MigrationType.D1_SQL:
        if (!migration.sql)
          throw new Error(`SQL migration ${migration.id} has no SQL content`)
        await this.executeD1Sql(migration.sql)
        break

      case MigrationType.POSTGRES_SQL:
        if (!migration.sql)
          throw new Error(`SQL migration ${migration.id} has no SQL content`)
        await this.executePostgresSql(migration.sql)
        break

      case MigrationType.SCRIPT:
        if (!migration.up)
          throw new Error(
            `Script migration ${migration.id} has no up() function`
          )
        await migration.up()
        break

      default:
        throw new Error(`Unknown migration type: ${migration.type}`)
    }
  }

  private async executeRollback(migration: Migration): Promise<void> {
    if (!migration.down) {
      throw new Error(`Migration ${migration.id} does not support rollback`)
    }
    await migration.down()
  }

  /**
   * Execute SQL on D1 database.
   * Uses Cloudflare D1 binding when available.
   */
  private async executeD1Sql(sql: string): Promise<void> {
    try {
      const { getCloudflareContext } = await import('@opennextjs/cloudflare')
      const ctx = await getCloudflareContext()

      const db =
        (ctx?.env?.CONVERSATIONS_D1 as D1Database) ||
        (ctx?.env?.NEXT_TAG_CACHE_D1 as D1Database)

      if (!db) {
        throw new Error('No D1 binding found')
      }

      await db.exec(sql)
    } catch (error) {
      if (error instanceof Error && error.message === 'No D1 binding found') {
        throw error
      }
      throw new Error(`D1 SQL execution failed: ${error}`)
    }
  }

  /** Execute SQL on PostgreSQL database */
  private async executePostgresSql(sql: string): Promise<void> {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error('DATABASE_URL not set for PostgreSQL migration')
    }

    const postgresModule = await import('postgres')
    const sqlClient = postgresModule.default(url)

    try {
      await sqlClient.unsafe(sql)
    } finally {
      await sqlClient.end()
    }
  }

  /** Get migration status */
  async getStatus(): Promise<{
    pending: Migration[]
    applied: MigrationRecord[]
    platform: PlatformInfo
  }> {
    await this.storage.initialize()

    const applied = await this.storage.getAppliedMigrations()
    const appliedIds = new Set(applied.map((r) => r.id))
    const pending = await this.registry.getPending(appliedIds)

    return { pending, applied, platform: this.platformInfo }
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

export async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'status'

  const registry = new MigrationRegistry()
  await registry.discover()

  const storage = await getMigrationStorage()
  const runner = new MigrationRunner(registry, storage)

  switch (command) {
    case 'status':
    case 'list':
      await cmdStatus(runner)
      break
    case 'migrate':
    case 'up':
      await cmdMigrate(runner, args)
      break
    case 'rollback':
    case 'down':
      await cmdRollback(runner, args)
      break
    case 'dry-run':
      await cmdDryRun(runner)
      break
    default:
      printUsage()
  }
}

async function cmdStatus(runner: MigrationRunner): Promise<void> {
  const status = await runner.getStatus()

  console.log()
  console.log('Migration Status')
  console.log('================')
  console.log(`Platform: ${status.platform.platform}`)
  console.log(`Environment: ${status.platform.environment}`)
  console.log()

  console.log(`Applied Migrations: ${status.applied.length}`)
  if (status.applied.length > 0) {
    console.table(
      status.applied.map((r) => ({
        ID: r.id,
        Name: r.name,
        Type: r.type,
        'Applied At': new Date(r.appliedAt).toISOString(),
      }))
    )
  }

  console.log()
  console.log(`Pending Migrations: ${status.pending.length}`)
  if (status.pending.length > 0) {
    console.table(
      status.pending.map((m) => ({
        ID: m.id,
        Name: m.name,
        Type: m.type,
        Dependencies: m.dependsOn?.join(', ') || 'none',
      }))
    )
  } else {
    console.log('✅ All migrations applied')
  }
}

async function cmdMigrate(
  runner: MigrationRunner,
  args: string[]
): Promise<void> {
  const cmdArgs = args.slice(1)

  const force = cmdArgs.includes('--force')
  const verbose = cmdArgs.includes('--verbose')
  const dryRun = cmdArgs.includes('--dry-run')
  const target = cmdArgs.find((arg) => !arg.startsWith('--'))

  console.log()
  const results = await runner.run({ target, force, verbose, dryRun })

  console.log()
  console.log('Migration Results')
  console.log('=================')

  const succeeded = results.filter((r) => r.status === MigrationStatus.APPLIED)
  const failed = results.filter((r) => r.status === MigrationStatus.FAILED)

  if (succeeded.length > 0) {
    console.log(`✅ Applied: ${succeeded.length}`)
    for (const result of succeeded) {
      console.log(`   ${result.migration.id} (${result.executionTime}ms)`)
    }
  }

  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}`)
    for (const result of failed) {
      console.log(`   ${result.migration.id}: ${result.error?.message}`)
    }
    process.exit(1)
  }

  if (results.length === 0) {
    console.log('✅ No migrations to run')
  }
}

async function cmdRollback(
  runner: MigrationRunner,
  args: string[]
): Promise<void> {
  const target = args[1]

  console.log()
  console.log('⚠️  Rolling back migrations...')
  console.log()

  const results = await runner.run({ target, rollback: true })

  console.log()
  console.log('Rollback Results')
  console.log('================')

  for (const result of results) {
    if (result.status === MigrationStatus.ROLLED_BACK) {
      console.log(`✅ Rolled back: ${result.migration.id}`)
    }
  }
}

async function cmdDryRun(runner: MigrationRunner): Promise<void> {
  console.log()
  console.log('🔍 Dry-run mode (no changes will be made)')
  console.log()

  await runner.run({ dryRun: true, verbose: true })
}

function printUsage(): void {
  console.log(`
Usage: bun run migrate <command> [options]

Commands:
  status, list     Show migration status
  migrate, up      Run pending migrations
  rollback, down   Rollback migrations
  dry-run          Preview migrations without applying

Options:
  --force          Re-run already applied migrations
  --verbose        Show detailed output

Examples:
  bun run migrate status
  bun run migrate up
  bun run migrate up 0001_conversations
  bun run migrate rollback 0001_conversations
  bun run migrate dry-run
`)
}

// Run CLI if called directly
const isMainModule = process.argv[1]?.endsWith('migration-runner.ts')

if (isMainModule) {
  main().catch(console.error)
}
