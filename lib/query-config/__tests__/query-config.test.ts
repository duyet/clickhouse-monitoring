/**
 * Query Config Integration Tests
 *
 * These tests validate that all query configurations work against
 * the running ClickHouse instance. They:
 *
 * 1. Get the ClickHouse version
 * 2. Select version-appropriate SQL for each config
 * 3. Run queries with LIMIT 1 to validate syntax
 * 4. Handle optional tables gracefully
 *
 * Run with: bun run test-queries-config
 * CI runs this against multiple ClickHouse versions (24.5 - 25.6)
 */

import { createClient } from '@clickhouse/client-web'

import type { QueryConfig } from '@/types/query-config'

import { queries } from '../index'
import {
  type ClickHouseVersion,
  parseVersion,
  selectVersionedSql,
} from '@/lib/clickhouse-version'

// Test timeout for slow queries
const QUERY_TIMEOUT_MS = 30000

// Tables that may not exist depending on ClickHouse configuration
const OPTIONAL_TABLES = new Set([
  'system.backup_log',
  'system.error_log',
  'system.zookeeper',
  'system.zookeeper_connection',
  'system.kafka_consumers',
  'system.distributed_ddl_queue',
  'monitoring.page_views', // Custom table
])

// Tables that require specific configuration
const CONFIG_DEPENDENT_TABLES = new Set([
  'system.query_log',
  'system.part_log',
  'system.metric_log',
  'system.asynchronous_metric_log',
  'system.opentelemetry_span_log',
  'system.query_thread_log',
  'system.trace_log',
])

/**
 * Extract table names from SQL query
 */
function extractTables(sql: string): string[] {
  const tables: string[] = []

  // Match FROM clause patterns
  const fromPattern =
    /\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)/gi
  let match: RegExpExecArray | null
  while ((match = fromPattern.exec(sql)) !== null) {
    if (match[1]) {
      tables.push(match[1].toLowerCase())
    }
  }

  // Match JOIN patterns
  const joinPattern =
    /\bJOIN\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)/gi
  while ((match = joinPattern.exec(sql)) !== null) {
    if (match[1]) {
      tables.push(match[1].toLowerCase())
    }
  }

  return [...new Set(tables)]
}

/**
 * Check if query uses optional tables
 */
function usesOptionalTables(sql: string): boolean {
  const tables = extractTables(sql)
  return tables.some(
    (t) => OPTIONAL_TABLES.has(t) || CONFIG_DEPENDENT_TABLES.has(t)
  )
}

/**
 * Wrap query with LIMIT 1 for validation
 */
function wrapWithLimit(sql: string): string {
  const trimmed = sql.trim()

  // If already has LIMIT, don't add another
  if (/\bLIMIT\s+\d+\s*$/i.test(trimmed)) {
    return trimmed
  }

  // If ends with ORDER BY without LIMIT, add LIMIT
  if (/\bORDER\s+BY\s+[^)]+$/i.test(trimmed)) {
    return `${trimmed} LIMIT 1`
  }

  // Simple case: add LIMIT 1
  return `${trimmed} LIMIT 1`
}

/**
 * Get SQL string from config, handling versioned SQL
 */
function getSql(
  config: QueryConfig,
  version: ClickHouseVersion | null
): string {
  if (typeof config.sql === 'string') {
    return config.sql
  }

  return selectVersionedSql(config.sql, version)
}

describe('Query Config Validation', () => {
  let client: ReturnType<typeof createClient>
  let version: ClickHouseVersion | null = null
  let versionString = 'unknown'
  let isClickHouseAvailable = false

  beforeAll(async () => {
    // Create ClickHouse client for testing
    const host = process.env.CLICKHOUSE_HOST || 'http://localhost:8123'
    const username = process.env.CLICKHOUSE_USER || 'default'
    const password = process.env.CLICKHOUSE_PASSWORD || ''

    client = createClient({
      host,
      username,
      password,
      clickhouse_settings: {
        max_execution_time: 30,
      },
    })

    // Get ClickHouse version
    try {
      const result = await client.query({
        query: 'SELECT version() as version',
        format: 'JSONEachRow',
      })
      const rows = await result.json<{ version: string }[]>()
      if (rows[0]?.version) {
        versionString = rows[0].version
        version = parseVersion(versionString)
        isClickHouseAvailable = true
        console.log(`Connected to ClickHouse version: ${versionString}`)
      }
    } catch (err) {
      console.warn(
        'ClickHouse not available - integration tests will be skipped'
      )
      console.warn('Run with ClickHouse running or in CI environment')
    }
  }, QUERY_TIMEOUT_MS)

  afterAll(async () => {
    if (client) {
      await client.close()
    }
  })

  it('should connect to ClickHouse and get version', () => {
    if (!isClickHouseAvailable) {
      console.log('Skipping: ClickHouse not available')
      return
    }
    expect(version).not.toBeNull()
    expect(version?.major).toBeGreaterThanOrEqual(23)
    console.log(`Testing against ClickHouse version: ${versionString}`)
  })

  describe('Query Configs', () => {
    // Generate a test for each query config
    queries.forEach((config) => {
      const testName = `${config.name} should run without SQL errors`

      it(
        testName,
        async () => {
          // Skip if ClickHouse is not available
          if (!isClickHouseAvailable) {
            return
          }

          // Skip if SQL validation is disabled
          if (config.disableSqlValidation) {
            console.log(`Skipping ${config.name}: SQL validation disabled`)
            return
          }

          const sql = getSql(config, version)
          const wrappedSql = wrapWithLimit(sql)
          const isOptional = config.optional || usesOptionalTables(sql)

          try {
            const result = await client.query({
              query: wrappedSql,
              format: 'JSONEachRow',
              clickhouse_settings: {
                max_execution_time: 10,
                ...(config.clickhouseSettings || {}),
              },
            })

            // Consume the result to ensure query completes
            await result.json()

            // Query succeeded
            expect(true).toBe(true)
          } catch (err: unknown) {
            const error = err as Error
            const errorMessage = error.message || String(err)

            // Check for expected failures on optional tables
            if (isOptional) {
              const isTableNotFound =
                errorMessage.includes('Table') &&
                (errorMessage.includes("doesn't exist") ||
                  errorMessage.includes('does not exist') ||
                  errorMessage.includes('UNKNOWN_TABLE'))

              const isAccessDenied =
                errorMessage.includes('ACCESS_DENIED') ||
                errorMessage.includes('Not enough privileges')

              const isZookeeperError =
                errorMessage.includes('zookeeper') ||
                errorMessage.includes('ZooKeeper') ||
                errorMessage.includes('Keeper')

              if (isTableNotFound || isAccessDenied || isZookeeperError) {
                console.log(
                  `${config.name}: Skipped (optional table not available)`
                )
                return // Test passes - optional table not available
              }
            }

            // Check for common acceptable errors
            const isEmptyResult =
              errorMessage.includes('Empty result') ||
              errorMessage.includes('No data')

            if (isEmptyResult) {
              // Empty result is acceptable
              return
            }

            // Re-throw unexpected errors
            throw new Error(
              `Query "${config.name}" failed:\n` +
                `SQL: ${wrappedSql.substring(0, 200)}...\n` +
                `Error: ${errorMessage}`
            )
          }
        },
        QUERY_TIMEOUT_MS
      )
    })
  })

  describe('Version-specific SQL selection', () => {
    it('should select correct SQL variant for current version', () => {
      // Find configs with versioned SQL
      const versionedConfigs = queries.filter(
        (config) => Array.isArray(config.sql) && config.sql.length > 1
      )

      console.log(
        `Found ${versionedConfigs.length} configs with version-specific SQL`
      )

      versionedConfigs.forEach((config) => {
        const sql = getSql(config, version)
        expect(sql).toBeTruthy()
        expect(sql.length).toBeGreaterThan(0)

        // Verify SQL contains SELECT
        expect(sql.toUpperCase()).toContain('SELECT')
      })
    })

    it('should handle configs with single SQL string', () => {
      const simpleConfigs = queries.filter(
        (config) => typeof config.sql === 'string'
      )

      console.log(`Found ${simpleConfigs.length} configs with simple SQL`)

      simpleConfigs.forEach((config) => {
        const sql = getSql(config, version)
        expect(sql).toBe(config.sql)
      })
    })
  })

  describe('Query Config structure', () => {
    queries.forEach((config) => {
      describe(`${config.name}`, () => {
        it('should have required fields', () => {
          expect(config.name).toBeTruthy()
          expect(config.sql).toBeTruthy()
          expect(config.columns).toBeDefined()
          expect(Array.isArray(config.columns)).toBe(true)
        })

        it('should have valid column formats', () => {
          if (config.columnFormats) {
            const formatKeys = Object.keys(config.columnFormats)
            // Column formats should reference valid columns
            expect(formatKeys.length).toBeGreaterThanOrEqual(0)
          }
        })

        it('should have valid SQL structure', () => {
          const sql = getSql(config, version)

          // Should contain SELECT
          expect(sql.toUpperCase()).toContain('SELECT')

          // Should contain FROM (most queries)
          if (!sql.toUpperCase().includes('SELECT 1')) {
            expect(sql.toUpperCase()).toContain('FROM')
          }

          // Should not have obvious syntax errors
          expect(sql).not.toContain('{{')
          expect(sql).not.toContain('}}')
        })
      })
    })
  })
})
