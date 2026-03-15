#!/usr/bin/env bun

/**
 * One-time setup script for AI agent conversations D1 database.
 *
 * This script:
 * 1. Creates the D1 database if it doesn't exist
 * 2. Extracts the database_id from wrangler output
 * 3. Updates wrangler.toml with the database_id
 * 4. Runs migrations to set up the schema
 *
 * Usage: bun run cf:setup-conversations
 *
 * After running this script, the database is ready for use.
 * Run `bun run cf:migrate-conversations` to apply schema changes.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DATABASE_NAME = 'clickhouse-monitor-conversations'
const WRANGLER_TOML_PATH = join(process.cwd(), 'wrangler.toml')

interface WranglerD1CreateOutput {
  database_id: string
  database_name: string
}

/**
 * Parse wrangler d1 create output to extract database_id
 */
function parseDatabaseId(output: string): string | null {
  // Try to match JSON output
  const jsonMatch = output.match(/\{[^}]*"database_id"\s*:\s*"([^"]+)"/)
  if (jsonMatch) return jsonMatch[1]

  // Try to match plain UUID format
  const uuidMatch = output.match(
    /([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i
  )
  if (uuidMatch) return uuidMatch[1]

  return null
}

/**
 * Update wrangler.toml with the database_id for CONVERSATIONS_D1
 */
function updateWranglerToml(databaseId: string): boolean {
  try {
    const content = readFileSync(WRANGLER_TOML_PATH, 'utf-8')

    // Check if database_id already exists
    if (content.includes(`database_id = "${databaseId}"`)) {
      console.log(`✅ Database ID already set in wrangler.toml`)
      return true
    }

    // Update the main D1 database binding
    const updatedMain = content.replace(
      /(# D1 database for AI agent conversations\s+\[\[d1_databases\]\]\s+binding = "CONVERSATIONS_D1"\s+database_name = "clickhouse-monitor-conversations")(?:\s+migrations_dir = "[^"]*")?/g,
      `$1\nmigrations_dir = "src/db/conversations-migrations"\ndatabase_id = "${databaseId}"`
    )

    // Update the preview environment binding
    const updatedPreview = updatedMain.replace(
      /(# Reuse the same D1 database for AI agent conversations\s+\[\[env\.preview\.d1_databases\]\]\s+binding = "CONVERSATIONS_D1"\s+database_name = "clickhouse-monitor-conversations")(?:\s+migrations_dir = "[^"]*")?/g,
      `$1\nmigrations_dir = "src/db/conversations-migrations"\ndatabase_id = "${databaseId}"`
    )

    writeFileSync(WRANGLER_TOML_PATH, updatedPreview, 'utf-8')
    console.log(`✅ Updated wrangler.toml with database_id: ${databaseId}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to update wrangler.toml: ${error}`)
    return false
  }
}

/**
 * Run wrangler d1 create command
 */
async function createD1Database(): Promise<{
  success: boolean
  databaseId?: string
}> {
  console.log(`🔧 Creating D1 database: ${DATABASE_NAME}\n`)

  const proc = Bun.spawn(
    ['wrangler', 'd1', 'create', DATABASE_NAME, '--json'],
    {
      stdout: 'pipe',
      stderr: 'inherit',
    }
  )

  const output = await new TextDecoder().decode(proc.stdout)
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    // Check if database already exists
    if (
      output.includes('already exists') ||
      output.includes('already created')
    ) {
      console.log(`⚠️  Database ${DATABASE_NAME} may already exist`)
      console.log(`   Checking existing database...\n`)

      // Try to get database info
      const listProc = Bun.spawn(['wrangler', 'd1', 'list', '--json'], {
        stdout: 'pipe',
        stderr: 'inherit',
      })

      const listOutput = await new TextDecoder().decode(listProc.stdout)
      await listProc.exited

      try {
        const databases = JSON.parse(listOutput) as Array<{
          name: string
          uuid: string
        }>
        const existing = databases.find((db) => db.name === DATABASE_NAME)

        if (existing) {
          console.log(`✅ Found existing database: ${existing.uuid}`)
          return { success: true, databaseId: existing.uuid }
        }
      } catch {
        // Fall through to error
      }

      console.error(
        `❌ Failed to create database and couldn't find existing one`
      )
      console.error(`Output: ${output}`)
      return { success: false }
    }

    console.error(`❌ Failed to create D1 database`)
    console.error(`Exit code: ${exitCode}`)
    console.error(`Output: ${output}`)
    return { success: false }
  }

  // Parse database_id from output
  let databaseId: string | null = null

  try {
    const jsonResponse = JSON.parse(output) as
      | WranglerD1CreateOutput
      | { error?: string }
    if ('database_id' in jsonResponse) {
      databaseId = jsonResponse.database_id
    } else if ('error' in jsonResponse) {
      throw new Error(jsonResponse.error)
    }
  } catch {
    databaseId = parseDatabaseId(output)
  }

  if (!databaseId) {
    console.error(`❌ Could not extract database_id from wrangler output`)
    console.error(`Output: ${output}`)
    return { success: false }
  }

  console.log(`✅ Created D1 database: ${DATABASE_NAME}`)
  console.log(`   Database ID: ${databaseId}\n`)

  return { success: true, databaseId }
}

/**
 * Run migrations on the D1 database
 */
async function runMigrations(): Promise<boolean> {
  console.log(`🔄 Running database migrations...\n`)

  const proc = Bun.spawn(
    [
      'wrangler',
      'd1',
      'migrations',
      'apply',
      DATABASE_NAME,
      '--remote',
      '--yes',
    ],
    {
      stdout: 'inherit',
      stderr: 'inherit',
    }
  )

  const exitCode = await proc.exited

  if (exitCode !== 0) {
    console.error(`❌ Failed to run migrations (exit code: ${exitCode})`)
    return false
  }

  console.log(`\n✅ Migrations applied successfully`)
  return true
}

async function main() {
  console.log(`╔════════════════════════════════════════════════════════════╗`)
  console.log(`║  AI Agent Conversations D1 Database - One-Time Setup        ║`)
  console.log(`╚════════════════════════════════════════════════════════════╝`)
  console.log()

  // Step 1: Create D1 database
  const createResult = await createD1Database()
  if (!createResult.success || !createResult.databaseId) {
    console.error(`\n❌ Setup failed. Please check the errors above.`)
    console.error(`\nManual setup steps:`)
    console.error(`  1. Run: wrangler d1 create ${DATABASE_NAME}`)
    console.error(`  2. Copy the database_id from the output`)
    console.error(
      `  3. Add to wrangler.toml under [[d1_databases]] for CONVERSATIONS_D1:`
    )
    console.error(`     database_id = "<your-database-id>"`)
    process.exit(1)
  }

  // Step 2: Update wrangler.toml
  const updated = updateWranglerToml(createResult.databaseId!)
  if (!updated) {
    console.error(
      `\n❌ Failed to update wrangler.toml. Please update manually:`
    )
    console.error(
      `   Add database_id = "${createResult.databaseId}" to the CONVERSATIONS_D1 section`
    )
    process.exit(1)
  }

  // Step 3: Run migrations
  const migrated = await runMigrations()
  if (!migrated) {
    console.warn(`\n⚠️  Database created but migrations failed.`)
    console.warn(`   Run migrations manually: bun run cf:migrate-conversations`)
    process.exit(1)
  }

  console.log()
  console.log(`╔════════════════════════════════════════════════════════════╗`)
  console.log(
    `║  ✅ Setup Complete!                                          ║`
  )
  console.log(`╠════════════════════════════════════════════════════════════╣`)
  console.log(`║  Database: ${DATABASE_NAME.padEnd(47)}║`)
  console.log(`║  Database ID: ${createResult.databaseId!.padEnd(42)}║`)
  console.log(`╠════════════════════════════════════════════════════════════╣`)
  console.log(`║  Next Steps:                                                ║`)
  console.log(
    `║  1. Enable feature flag: NEXT_PUBLIC_FEATURE_CONVERSATION_DB=true ║`
  )
  console.log(
    `║  2. Deploy: bun run cf:deploy                                ║`
  )
  console.log(
    `║  3. Test the /agents page with conversation persistence        ║`
  )
  console.log(`╚════════════════════════════════════════════════════════════╝`)
}

main().catch((error) => {
  console.error(`\n❌ Unexpected error: ${error}`)
  process.exit(1)
})
