/**
 * Migration system for ClickHouse Monitor.
 *
 * Provides a framework for running database migrations, data transformations,
 * and setup scripts across multiple platforms (Cloudflare Workers, local dev).
 *
 * Features:
 * - Auto-detection of platform and environment
 * - State tracking via migrations table
 * - Support for D1, PostgreSQL, and ClickHouse
 * - Rollback capability
 * - Dry-run mode for testing
 * - Dependency management between migrations
 */

import { spawn } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// ============================================================================
// Types
// ============================================================================

/**
 * Supported platforms
 */
export enum Platform {
  /** Cloudflare Workers (production) */
  CLOUDFLARE_WORKERS = 'cloudflare-workers',
  /** Cloudflare Workers (preview environment) */
  CLOUDFLARE_PREVIEW = 'cloudflare-preview',
  /** Local development with miniflare/wrangler dev */
  LOCAL_DEV = 'local-dev',
  /** Traditional Node.js server */
  NODE_SERVER = 'node-server',
  /** Docker container */
  DOCKER = 'docker',
  /** Unknown platform */
  UNKNOWN = 'unknown',
}

/**
 * Environment type
 */
export enum Environment {
  PRODUCTION = 'production',
  PREVIEW = 'preview',
  DEVELOPMENT = 'development',
  TEST = 'test',
}

/**
 * Migration type
 */
export enum MigrationType {
  /** SQL schema migration (D1) */
  D1_SQL = 'd1-sql',
  /** SQL schema migration (PostgreSQL) */
  POSTGRES_SQL = 'postgres-sql',
  /** SQL schema migration (ClickHouse) */
  CLICKHOUSE_SQL = 'clickhouse-sql',
  /** Data migration/transform */
  DATA = 'data',
  /** Seed data */
  SEED = 'seed',
  /** Custom JavaScript/TypeScript migration */
  SCRIPT = 'script',
}

/**
 * Migration status
 */
export enum MigrationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  APPLIED = 'applied',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled-back',
}

/**
 * Platform detection result
 */
export interface PlatformInfo {
  platform: Platform
  environment: Environment
  isCloudflare: boolean
  isLocal: boolean
  hasWrangler: boolean
}

/**
 * Migration definition
 */
export interface Migration {
  /** Unique migration identifier (e.g., "0001", "0001_init_conversations") */
  id: string
  /** Human-readable name */
  name: string
  /** Migration type */
  type: MigrationType
  /** SQL content (for SQL migrations) */
  sql?: string
  /** Migration script path (for SCRIPT migrations) */
  scriptPath?: string
  /** Migration function (for SCRIPT/DATA migrations) */
  up?: () => Promise<void>
  /** Rollback function */
  down?: () => Promise<void>
  /** Dependencies (other migration IDs that must run first) */
  dependsOn?: string[]
  /** Whether this migration should run automatically */
  autoRun?: boolean
}

/**
 * Migration state record
 */
export interface MigrationRecord {
  id: string
  name: string
  type: MigrationType
  status: MigrationStatus
  appliedAt: number // Unix timestamp
  checksum: string // Content hash for change detection
  executionTime: number // Milliseconds
  platform: string
  environment: string
}

/**
 * Migration registry configuration
 */
export interface MigrationRegistryConfig {
  /** Directory containing migration files */
  migrationsDir: string
  /** Subdirectories for each migration type */
  typeDirs: Record<MigrationType, string>
}

/**
 * Migration storage interface (for state tracking)
 */
export interface MigrationStorage {
  /**
   * Initialize the storage (create migrations table if needed)
   */
  initialize(): Promise<void>

  /**
   * Get all applied migrations
   */
  getAppliedMigrations(): Promise<MigrationRecord[]>

  /**
   * Record a migration as applied
   */
  recordMigration(
    migration: Migration,
    status: MigrationStatus,
    executionTime: number
  ): Promise<void>

  /**
   * Update migration status
   */
  updateStatus(migrationId: string, status: MigrationStatus): Promise<void>

  /**
   * Check if a migration has been applied
   */
  isApplied(migrationId: string): Promise<boolean>
}

/**
 * Migration runner options
 */
export interface MigrationRunnerOptions {
  /** Dry run mode (don't actually apply migrations) */
  dryRun?: boolean
  /** Force re-run migrations even if applied */
  force?: boolean
  /** Specific migration to run (instead of all pending) */
  target?: string
  /** Run backwards (rollback) */
  rollback?: boolean
  /** Platform override (for testing) */
  platform?: Platform
  /** Environment override (for testing) */
  environment?: Environment
  /** Verbose output */
  verbose?: boolean
}

/**
 * Migration result
 */
export interface MigrationResult {
  migration: Migration
  status: MigrationStatus
  executionTime: number
  error?: Error
}

// ============================================================================
// Platform Detection
// ============================================================================

/**
 * Detect the current platform and environment
 */
export function detectPlatform(): PlatformInfo {
  const env = process.env

  // Check for Cloudflare Workers
  if (env.CLOUDFLARE_WORKERS === '1') {
    // Detect preview vs production
    if (env.CF_PAGES_BRANCH || env.CF_PAGES_COMMIT_SHA) {
      return {
        platform: Platform.CLOUDFLARE_PREVIEW,
        environment: Environment.PREVIEW,
        isCloudflare: true,
        isLocal: false,
        hasWrangler: false,
      }
    }

    return {
      platform: Platform.CLOUDFLARE_WORKERS,
      environment: Environment.PRODUCTION,
      isCloudflare: true,
      isLocal: false,
      hasWrangler: false,
    }
  }

  // Check for wrangler dev/miniflare
  if (env.MINIFLARE || env.DEV) {
    return {
      platform: Platform.LOCAL_DEV,
      environment: Environment.DEVELOPMENT,
      isCloudflare: false,
      isLocal: true,
      hasWrangler: true,
    }
  }

  // Check for Docker
  if (env.DOCKER_CONTAINER) {
    return {
      platform: Platform.DOCKER,
      environment:
        process.env.NODE_ENV === 'production'
          ? Environment.PRODUCTION
          : Environment.DEVELOPMENT,
      isCloudflare: false,
      isLocal: true,
      hasWrangler: false,
    }
  }

  // Check for Node.js server (default)
  return {
    platform: Platform.NODE_SERVER,
    environment:
      process.env.NODE_ENV === 'production'
        ? Environment.PRODUCTION
        : Environment.DEVELOPMENT,
    isCloudflare: false,
    isLocal: true,
    hasWrangler: false,
  }
}

/**
 * Get the appropriate migration storage for the current platform
 */
export async function getMigrationStorage(
  info?: PlatformInfo
): Promise<MigrationStorage> {
  const platformInfo = info || detectPlatform()

  // Try D1 storage first (Cloudflare Workers)
  if (platformInfo.isCloudflare || platformInfo.hasWrangler) {
    try {
      const { D1MigrationStorage } = await import(
        './storage/d1-migration-storage'
      )
      return new D1MigrationStorage()
    } catch {
      // Fall through to other storage
    }
  }

  // Try PostgreSQL storage (only for valid postgres connection strings)
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
      // Fall through to local storage
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

/**
 * Default migration directories
 */
const DEFAULT_TYPE_DIRS: Record<MigrationType, string> = {
  [MigrationType.D1_SQL]: 'src/db/migrations',
  [MigrationType.POSTGRES_SQL]: 'lib/conversation-store/pg-migrations',
  [MigrationType.CLICKHOUSE_SQL]: 'src/db/clickhouse-migrations',
  [MigrationType.DATA]: 'src/db/data-migrations',
  [MigrationType.SEED]: 'src/db/seed-migrations',
  [MigrationType.SCRIPT]: 'src/db/script-migrations',
}

/**
 * Migration registry - discovers and registers migrations
 */
export class MigrationRegistry {
  private migrations = new Map<string, Migration>()
  private config: MigrationRegistryConfig

  constructor(config?: Partial<MigrationRegistryConfig>) {
    this.config = {
      migrationsDir: config?.migrationsDir || 'src/db/migrations',
      typeDirs: { ...DEFAULT_TYPE_DIRS, ...config?.typeDirs },
    }
  }

  /**
   * Discover all migrations from the filesystem
   */
  async discover(): Promise<void> {
    const _migrationsDir = join(process.cwd(), this.config.migrationsDir)

    for (const [type, typeDir] of Object.entries(this.config.typeDirs)) {
      const dir = join(process.cwd(), typeDir)

      try {
        const stat = statSync(dir)
        if (!stat.isDirectory()) continue
      } catch {
        continue
      }

      const entries = readdirSync(dir)

      for (const entry of entries) {
        // Skip non-SQL files for now
        if (!entry.endsWith('.sql')) continue

        // Extract migration ID from filename
        // Supports: 0001_description.sql, 0001.sql
        const match = entry.match(/^(\d+)(?:_([^.]+))?\.(sql|ts|js)$/)
        if (!match) continue

        const [, id, description] = match
        const migrationId = description ? `${id}_${description}` : id
        const filePath = join(dir, entry)

        // Read SQL content
        const sql = readFileSync(filePath, 'utf-8')

        // Create migration
        const migration: Migration = {
          id: migrationId,
          name: description || `Migration ${id}`,
          type: type as MigrationType,
          sql,
          scriptPath: filePath,
          autoRun: true,
        }

        this.register(migration)
      }
    }
  }

  /**
   * Register a migration
   */
  register(migration: Migration): void {
    this.migrations.set(migration.id, migration)
  }

  /**
   * Get a migration by ID
   */
  get(id: string): Migration | undefined {
    return this.migrations.get(id)
  }

  /**
   * Get all migrations
   */
  getAll(): Migration[] {
    return Array.from(this.migrations.values()).sort((a, b) =>
      a.id.localeCompare(b.id)
    )
  }

  /**
   * Get pending migrations (not yet applied)
   */
  async getPending(appliedIds: Set<string>): Promise<Migration[]> {
    const all = this.getAll()
    return all.filter((m) => !appliedIds.has(m.id))
  }

  /**
   * Get migrations in dependency order
   */
  getOrderedMigrations(): Migration[] {
    const visited = new Set<string>()
    const result: Migration[] = []

    const visit = (id: string) => {
      if (visited.has(id)) return
      visited.add(id)

      const migration = this.migrations.get(id)
      if (!migration) return

      // Visit dependencies first
      for (const depId of migration.dependsOn || []) {
        visit(depId)
      }

      result.push(migration)
    }

    for (const id of this.migrations.keys()) {
      visit(id)
    }

    return result
  }
}

// ============================================================================
// Migration Runner
// ============================================================================

/**
 * Migration runner - executes migrations in order
 */
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

  /**
   * Run all pending migrations
   */
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

      // Get applied migrations
      const appliedRecords = await this.storage.getAppliedMigrations()
      const appliedIds = new Set(appliedRecords.map((r) => r.id))

      // Get pending migrations
      let pending: Migration[]
      if (target) {
        const migration = this.registry.get(target)
        if (!migration) {
          throw new Error(`Migration ${target} not found`)
        }
        pending = [migration]
      } else if (rollback) {
        // Rollback mode: get applied migrations in reverse order
        const all = this.registry.getAll()
        pending = all.reverse()
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
        // Skip if already applied (unless force)
        if (!force && !rollback && appliedIds.has(migration.id)) {
          if (verbose)
            console.log(`⊘ Skipping ${migration.id} (already applied)`)
          continue
        }

        // Check if auto-run migrations should run
        if (!rollback && !target && migration.autoRun === false) {
          if (verbose) console.log(`⊘ Skipping ${migration.id} (autoRun=false)`)
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

          // Update status to running
          await this.storage.updateStatus(migration.id, MigrationStatus.RUNNING)

          // Execute migration
          if (rollback) {
            await this.executeRollback(migration)
          } else {
            await this.executeMigration(migration)
          }

          const executionTime = Date.now() - startTime

          // Record as applied
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

          await this.storage.updateStatus(migration.id, MigrationStatus.FAILED)

          console.error(`❌ ${migration.id} failed: ${error}`)

          results.push({
            migration,
            status: MigrationStatus.FAILED,
            executionTime,
            error: error as Error,
          })

          // Stop on first error
          break
        }
      }

      return results
    } finally {
      // Cleanup database connections
      if ('close' in this.storage && typeof this.storage.close === 'function') {
        await this.storage.close()
      }
    }
  }

  /**
   * Execute a single migration
   */
  private async executeMigration(migration: Migration): Promise<void> {
    switch (migration.type) {
      case MigrationType.D1_SQL:
      case MigrationType.POSTGRES_SQL:
      case MigrationType.CLICKHOUSE_SQL:
        if (!migration.sql) {
          throw new Error(`SQL migration ${migration.id} has no SQL content`)
        }
        await this.executeSqlMigration(migration)
        break

      case MigrationType.SCRIPT:
      case MigrationType.DATA:
      case MigrationType.SEED:
        if (!migration.up) {
          throw new Error(
            `Script migration ${migration.id} has no up() function`
          )
        }
        await migration.up()
        break

      default:
        throw new Error(`Unknown migration type: ${migration.type}`)
    }
  }

  /**
   * Execute rollback for a migration
   */
  private async executeRollback(migration: Migration): Promise<void> {
    if (!migration.down) {
      throw new Error(`Migration ${migration.id} does not support rollback`)
    }
    await migration.down()
  }

  /**
   * Execute SQL migration (platform-specific)
   */
  private async executeSqlMigration(migration: Migration): Promise<void> {
    const sql = migration.sql!

    // Route to appropriate SQL executor based on type and platform
    if (migration.type === MigrationType.D1_SQL) {
      if (this.platformInfo.isCloudflare || this.platformInfo.hasWrangler) {
        await this.executeD1Sql(sql)
      } else {
        throw new Error(
          `D1 migrations require Cloudflare Workers or wrangler dev`
        )
      }
    } else if (migration.type === MigrationType.POSTGRES_SQL) {
      await this.executePostgresSql(sql)
    } else if (migration.type === MigrationType.CLICKHOUSE_SQL) {
      await this.executeClickhouseSql(sql)
    }
  }

  /**
   * Execute SQL on D1 database
   */
  private async executeD1Sql(sql: string): Promise<void> {
    // Try to use D1 binding from Cloudflare context
    try {
      const { getCloudflareContext } = await import('@opennextjs/cloudflare')
      const ctx = await getCloudflareContext()

      if (ctx?.env?.CONVERSATIONS_D1) {
        const db = ctx.env.CONVERSATIONS_D1 as D1Database
        const stmts = db.exec(sql)
        await stmts
        return
      }

      if (ctx?.env?.NEXT_TAG_CACHE_D1) {
        const db = ctx.env.NEXT_TAG_CACHE_D1 as D1Database
        const stmts = db.exec(sql)
        await stmts
        return
      }
    } catch {
      // Fall through to wrangler command
    }

    // Use wrangler command-line tool
    const proc = spawn(
      'wrangler',
      ['d1', 'execute', 'clickhouse-monitor-conversations', '--command', sql],
      {
        stdio: 'inherit',
      }
    )

    // Wait for process to complete
    await new Promise<void>((resolve, reject) => {
      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`D1 SQL execution failed (exit code: ${code})`))
        }
      })
    })
  }

  /**
   * Execute SQL on PostgreSQL database
   */
  private async executePostgresSql(sql: string): Promise<void> {
    const postgres = await import('postgres')
    const url = process.env.DATABASE_URL

    if (!url) {
      throw new Error(`DATABASE_URL not set for PostgreSQL migration`)
    }

    const sqlClient = postgres.default(url)

    try {
      await sqlClient.unsafe(sql)
    } finally {
      await sqlClient.end()
    }
  }

  /**
   * Execute SQL on ClickHouse database
   */
  private async executeClickhouseSql(_sql: string): Promise<void> {
    // Use ClickHouse client from the project
    // This would need to be implemented based on the project's ClickHouse setup
    throw new Error(`ClickHouse SQL migration not yet implemented`)
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    pending: Migration[]
    applied: MigrationRecord[]
    platform: PlatformInfo
  }> {
    await this.storage.initialize()

    const applied = await this.storage.getAppliedMigrations()
    const appliedIds = new Set(applied.map((r) => r.id))
    const pending = await this.registry.getPending(appliedIds)

    return {
      pending,
      applied,
      platform: this.platformInfo,
    }
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

/**
 * Main CLI entry point
 */
export async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'status'

  // Create registry
  const registry = new MigrationRegistry()
  await registry.discover()

  // Get storage
  const storage = await getMigrationStorage()

  // Create runner
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

    case 'fresh':
      await cmdFresh(runner)
      break

    case 'dry-run':
      await cmdDryRun(runner)
      break

    default:
      printUsage()
  }
}

/**
 * Print migration status
 */
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

/**
 * Run pending migrations
 */
async function cmdMigrate(
  runner: MigrationRunner,
  args: string[]
): Promise<void> {
  // Skip first arg (command name)
  const cmdArgs = args.slice(1)

  const force = cmdArgs.includes('--force')
  const verbose = cmdArgs.includes('--verbose')
  const dryRun = cmdArgs.includes('--dry-run')

  // Find target migration (first arg that's not a flag)
  const target = cmdArgs.find((arg) => !arg.startsWith('--'))

  const options: MigrationRunnerOptions = {
    target,
    force,
    verbose,
    dryRun,
  }

  console.log()
  const results = await runner.run(options)

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

/**
 * Rollback migrations
 */
async function cmdRollback(
  runner: MigrationRunner,
  args: string[]
): Promise<void> {
  // Skip first arg (command name)
  const cmdArgs = args.slice(1)
  const target = cmdArgs[0]

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

/**
 * Reset and run all migrations (fresh start)
 */
async function cmdFresh(_runner: MigrationRunner): Promise<void> {
  console.log()
  console.log('⚠️  WARNING: This will reset all migrations!')
  console.log('   This is a destructive operation.')
  console.log()

  // For now, just warn the user
  console.log('Please manually reset the database and run migrations again.')
  console.log(
    '  wrangler d1 execute clickhouse-monitor-conversations --command "DROP TABLE IF EXISTS _migrations;"'
  )
}

/**
 * Dry-run migration
 */
async function cmdDryRun(runner: MigrationRunner): Promise<void> {
  console.log()
  console.log('🔍 Dry-run mode (no changes will be made)')
  console.log()

  await runner.run({ dryRun: true, verbose: true })
}

/**
 * Print usage information
 */
function printUsage(): void {
  console.log(`
Usage: bun run migrate <command> [options]

Commands:
  status, list     Show migration status
  migrate, up      Run pending migrations
  rollback, down   Rollback migrations
  fresh            Reset and re-run all migrations
  dry-run          Preview migrations without applying

Options:
  --force          Re-run already applied migrations
  --verbose        Show detailed output

Examples:
  bun run migrate status
  bun run migrate up
  bun run migrate up 0001_init_conversations
  bun run migrate rollback 0002_add_indexes
  bun run migrate dry-run
`)
}

// Run CLI if called directly
const isMainModule = process.argv[1]?.endsWith('migration-runner.ts')

if (isMainModule) {
  main().catch(console.error)
}
