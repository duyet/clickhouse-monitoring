/**
 * Auto-migration middleware.
 *
 * Runs pending migrations on first API request using singleton pattern.
 * For CF Workers: checks D1 directly via binding.
 * For Node/Docker: uses PostgreSQL storage backend.
 */

import {
  detectPlatform,
  getMigrationStorage,
  MigrationRegistry,
  MigrationRunner,
  MigrationType,
} from './migration-runner'

let migrationPromise: Promise<void> | null = null
let migrationComplete = false

/**
 * Known migrations for direct registration (no filesystem access needed).
 * This enables auto-migration in CF Workers where fs APIs are unavailable.
 */
const KNOWN_MIGRATIONS = [
  {
    id: '0001_conversations',
    name: 'conversations',
    type: MigrationType.D1_SQL,
    sql: [
      'CREATE TABLE IF NOT EXISTS conversations (',
      '  id TEXT PRIMARY KEY,',
      '  user_id TEXT NOT NULL,',
      "  title TEXT NOT NULL DEFAULT 'New Conversation',",
      "  messages TEXT NOT NULL DEFAULT '[]',",
      '  message_count INTEGER NOT NULL DEFAULT 0,',
      '  model TEXT,',
      '  provider TEXT,',
      '  host_id INTEGER,',
      '  total_input_tokens INTEGER NOT NULL DEFAULT 0,',
      '  total_output_tokens INTEGER NOT NULL DEFAULT 0,',
      '  total_reasoning_tokens INTEGER NOT NULL DEFAULT 0,',
      '  total_cached_tokens INTEGER NOT NULL DEFAULT 0,',
      '  total_duration_ms INTEGER NOT NULL DEFAULT 0,',
      '  total_cost_usd REAL NOT NULL DEFAULT 0,',
      '  finish_reason TEXT,',
      '  user_rating INTEGER,',
      '  error_count INTEGER NOT NULL DEFAULT 0,',
      "  metadata TEXT NOT NULL DEFAULT '{}',",
      '  created_at INTEGER NOT NULL,',
      '  updated_at INTEGER NOT NULL',
      ');',
      '',
      'CREATE INDEX IF NOT EXISTS idx_conversations_user_updated',
      '  ON conversations(user_id, updated_at DESC);',
      '',
      'CREATE INDEX IF NOT EXISTS idx_conversations_active',
      '  ON conversations(user_id, updated_at DESC)',
      '  WHERE message_count > 0;',
      '',
      'CREATE INDEX IF NOT EXISTS idx_conversations_model',
      '  ON conversations(model, provider)',
      '  WHERE model IS NOT NULL;',
      '',
      'CREATE INDEX IF NOT EXISTS idx_conversations_cost',
      '  ON conversations(user_id, total_cost_usd)',
      '  WHERE total_cost_usd > 0;',
      '',
      'CREATE INDEX IF NOT EXISTS idx_conversations_errors',
      '  ON conversations(user_id, error_count)',
      '  WHERE error_count > 0;',
    ].join('\n'),
  },
]

/**
 * Run migrations automatically on first call.
 * Safe to call multiple times — only executes once per process.
 */
export async function autoMigrate(): Promise<void> {
  if (migrationComplete) return

  if (!migrationPromise) {
    migrationPromise = runMigrations()
  }

  return migrationPromise
}

async function runMigrations(): Promise<void> {
  try {
    const platformInfo = detectPlatform()
    const registry = new MigrationRegistry()

    if (platformInfo.isCloudflare) {
      // In CF Workers, register migrations directly (no fs access)
      registry.registerAll(KNOWN_MIGRATIONS)
    } else {
      // In Node/Docker, discover from filesystem
      try {
        await registry.discover()
      } catch {
        // If filesystem discovery fails, fall back to known migrations
        registry.registerAll(KNOWN_MIGRATIONS)
      }
    }

    const storage = await getMigrationStorage(platformInfo)
    const runner = new MigrationRunner(registry, storage, platformInfo)

    const results = await runner.run({ verbose: false })

    const applied = results.filter((r) => r.status === 'applied')
    if (applied.length > 0) {
      console.log(`[auto-migrate] Applied ${applied.length} migration(s)`)
    }

    migrationComplete = true
  } catch (error) {
    console.error('[auto-migrate] Migration failed:', error)
    // Reset so it retries on next request
    migrationPromise = null
  }
}
