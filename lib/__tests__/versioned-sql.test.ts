/**
 * Versioned SQL Selection Tests
 *
 * These tests ensure that version-aware query selection works correctly
 * for query configs with multiple SQL variants based on ClickHouse version.
 */

import { describe, expect, it } from 'bun:test'
import { parseVersion, selectVersionedSql } from '@/lib/clickhouse-version'
import { queries } from '@/lib/query-config'
import { runningQueriesConfig } from '@/lib/query-config/queries/running-queries'

describe('Running Queries Version Selection', () => {
  describe('SQL variant selection', () => {
    it('should select v23.8 query for ClickHouse 23.8', () => {
      const version = parseVersion('23.8.0.0')
      const sql = selectVersionedSql(runningQueriesConfig.sql, version)

      // peak_threads_usage is NOT available in ClickHouse 24.x (removed)
      expect(sql).not.toContain('peak_threads_usage')
      expect(sql).toContain('FROM system.processes')
    })

    it('should select query for ClickHouse 24.1', () => {
      const version = parseVersion('24.1.0.0')
      const sql = selectVersionedSql(runningQueriesConfig.sql, version)

      // peak_threads_usage is NOT available in ClickHouse 24.x
      expect(sql).not.toContain('peak_threads_usage')
    })

    it('should select query for ClickHouse 24.7', () => {
      const version = parseVersion('24.7.0.0')
      const sql = selectVersionedSql(runningQueriesConfig.sql, version)

      // peak_threads_usage is NOT available in ClickHouse 24.x
      expect(sql).not.toContain('peak_threads_usage')
    })

    it('should select query for ClickHouse 24.8', () => {
      const version = parseVersion('24.8.0.0')
      const sql = selectVersionedSql(runningQueriesConfig.sql, version)

      // peak_threads_usage is NOT available in ClickHouse 24.x
      expect(sql).not.toContain('peak_threads_usage')
      expect(sql).not.toContain('readable_peak_threads_usage')
      expect(sql).not.toContain('pct_peak_threads_usage')
    })

    it('should select query for ClickHouse 24.1', () => {
      const version = parseVersion('24.1.0.0')
      const sql = selectVersionedSql(runningQueriesConfig.sql, version)

      // peak_threads_usage is NOT available in ClickHouse 24.x
      expect(sql).not.toContain('peak_threads_usage')
      expect(sql).not.toContain('readable_peak_threads_usage')
      expect(sql).not.toContain('pct_peak_threads_usage')
    })

    it('should select query for ClickHouse 25.1', () => {
      const version = parseVersion('25.1.0.0')
      const sql = selectVersionedSql(runningQueriesConfig.sql, version)

      // peak_threads_usage is NOT available in ClickHouse 24.x+
      expect(sql).not.toContain('peak_threads_usage')
    })

    it('should fallback to oldest variant when version is null', () => {
      const sql = selectVersionedSql(runningQueriesConfig.sql, null)

      // Should use oldest variant as fallback (no peak_threads_usage)
      expect(sql).not.toContain('peak_threads_usage')
    })
  })

  describe('SQL structure validation', () => {
    it('v23.8 query should be valid SQL structure', () => {
      const version = parseVersion('23.8.0.0')
      const sql = selectVersionedSql(runningQueriesConfig.sql, version)

      expect(sql).toContain('SELECT')
      expect(sql).toContain('FROM system.processes')
      expect(sql).toContain('WHERE is_cancelled = 0')
      expect(sql).toContain('ORDER BY elapsed')
    })

    it('v24.1 query should be valid SQL structure', () => {
      const version = parseVersion('24.1.0.0')
      const sql = selectVersionedSql(runningQueriesConfig.sql, version)

      expect(sql).toContain('SELECT')
      expect(sql).toContain('FROM system.processes')
      expect(sql).toContain('WHERE is_cancelled = 0')
      expect(sql).toContain('ORDER BY elapsed')
    })

    it('both versions should have same base columns (single query now)', () => {
      const v23 = selectVersionedSql(
        runningQueriesConfig.sql,
        parseVersion('23.8.0.0')
      )
      const v24 = selectVersionedSql(
        runningQueriesConfig.sql,
        parseVersion('24.1.0.0')
      )

      // Common columns (same query for all versions now)
      const commonColumns = [
        'query_id as query_detail',
        'readable_elapsed',
        'readable_read_rows',
        'readable_written_rows',
        'readable_memory_usage',
        'progress',
        'launched_merges',
      ]

      for (const col of commonColumns) {
        expect(v23).toContain(col)
        expect(v24).toContain(col)
      }
    })
  })
})

describe('All Versioned Query Configs', () => {
  const versionedConfigs = queries.filter(
    (config) => Array.isArray(config.sql) && config.sql.length > 1
  )

  describe('Version variant consistency', () => {
    versionedConfigs.forEach((config) => {
      describe(`${config.name}`, () => {
        it('should have valid versioned SQL array', () => {
          expect(Array.isArray(config.sql)).toBe(true)
          expect(
            (config.sql as Array<{ since: string; sql: string }>).length
          ).toBeGreaterThan(0)
        })

        it('should have since versions in chronological order', () => {
          const variants = config.sql as Array<{ since: string; sql: string }>
          const versions = variants.map((v) => parseVersion(v.since))

          // Verify versions are in order (oldest first)
          for (let i = 1; i < versions.length; i++) {
            const prev = versions[i - 1]
            const curr = versions[i]
            // Current should be >= previous
            const isOrdered =
              curr.major > prev.major ||
              (curr.major === prev.major && curr.minor >= prev.minor)
            expect(isOrdered).toBe(true)
          }
        })

        it('should select appropriate SQL for various versions', () => {
          const testVersions = ['23.8.0.0', '24.1.0.0', '24.5.0.0', '25.0.0.0']

          testVersions.forEach((versionStr) => {
            const version = parseVersion(versionStr)
            const sql = selectVersionedSql(config.sql, version)

            expect(sql).toBeTruthy()
            expect(sql.length).toBeGreaterThan(0)
            expect(sql.toUpperCase()).toContain('SELECT')
          })
        })

        it('should fallback gracefully when version is null', () => {
          const sql = selectVersionedSql(config.sql, null)
          expect(sql).toBeTruthy()
          expect(sql.toUpperCase()).toContain('SELECT')
        })
      })
    })
  })
})

describe('Version Selection Edge Cases', () => {
  it('should handle version with build number', () => {
    const version = parseVersion('24.1.1.12345')
    const sql = selectVersionedSql(runningQueriesConfig.sql, version)

    // peak_threads_usage is NOT available in ClickHouse 24.x
    expect(sql).not.toContain('peak_threads_usage')
  })

  it('should handle exact boundary version', () => {
    // Exactly 24.1.0.0 should use the single query (no versioning)
    const version = parseVersion('24.1.0.0')
    const sql = selectVersionedSql(runningQueriesConfig.sql, version)

    expect(sql).not.toContain('peak_threads_usage')
  })

  it('should handle version just below boundary', () => {
    // 24.0.99.99 should use the single query
    const version = parseVersion('24.0.99.99')
    const sql = selectVersionedSql(runningQueriesConfig.sql, version)

    expect(sql).not.toContain('peak_threads_usage')
  })

  it('should handle very old version', () => {
    const version = parseVersion('22.0.0.0')
    const sql = selectVersionedSql(runningQueriesConfig.sql, version)

    // Should fallback to single query (no peak_threads_usage)
    expect(sql).not.toContain('peak_threads_usage')
  })

  it('should handle very new version', () => {
    const version = parseVersion('30.0.0.0')
    const sql = selectVersionedSql(runningQueriesConfig.sql, version)

    // Should use the single query (no peak_threads_usage)
    expect(sql).not.toContain('peak_threads_usage')
  })
})

describe('getSqlForDisplay vs selectVersionedSql', () => {
  // This test documents the behavior with single (non-versioned) query
  it('getSqlForDisplay and selectVersionedSql return same query for single query config', () => {
    const { getSqlForDisplay } = require('@/types/query-config')

    const displaySql = getSqlForDisplay(runningQueriesConfig.sql)
    const executionSql = selectVersionedSql(
      runningQueriesConfig.sql,
      parseVersion('23.8.0.0')
    )

    // Both should return the same single query (no versioning)
    expect(displaySql).not.toContain('peak_threads_usage')
    expect(executionSql).not.toContain('peak_threads_usage')

    // Both queries should be identical
    expect(displaySql).toBe(executionSql)
  })
})
