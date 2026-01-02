/**
 * Versioned SQL Selection Tests
 *
 * These tests ensure that version-aware query selection works correctly
 * for query configs with multiple SQL variants based on ClickHouse version.
 */

import { describe, expect, it } from '@jest/globals'
import { parseVersion, selectVersionedSql } from '@/lib/clickhouse-version'
import { queries } from '@/lib/query-config'
import { runningQueriesConfig } from '@/lib/query-config/queries/running-queries'

describe('Running Queries Version Selection', () => {
  describe('SQL variant selection', () => {
    it('should select v23.8 query for ClickHouse 23.8', () => {
      const version = parseVersion('23.8.0.0')
      const sql = selectVersionedSql(runningQueriesConfig.sql, version)

      // Should NOT contain peak_threads_usage (added in 24.8)
      expect(sql).not.toContain('peak_threads_usage')
      expect(sql).toContain('FROM system.processes')
    })

    it('should select v23.8 query for ClickHouse 24.1', () => {
      const version = parseVersion('24.1.0.0')
      const sql = selectVersionedSql(runningQueriesConfig.sql, version)

      // 24.1 < 24.8, so should use 23.8 variant
      expect(sql).not.toContain('peak_threads_usage')
    })

    it('should select v23.8 query for ClickHouse 24.7', () => {
      const version = parseVersion('24.7.0.0')
      const sql = selectVersionedSql(runningQueriesConfig.sql, version)

      // 24.7 < 24.8, so should use 23.8 variant
      expect(sql).not.toContain('peak_threads_usage')
    })

    it('should select v24.8 query for ClickHouse 24.8', () => {
      const version = parseVersion('24.8.0.0')
      const sql = selectVersionedSql(runningQueriesConfig.sql, version)

      // Should contain peak_threads_usage (added in 24.8)
      expect(sql).toContain('peak_threads_usage')
      expect(sql).toContain('readable_peak_threads_usage')
      expect(sql).toContain('pct_peak_threads_usage')
    })

    it('should select v24.8 query for ClickHouse 25.1', () => {
      const version = parseVersion('25.1.0.0')
      const sql = selectVersionedSql(runningQueriesConfig.sql, version)

      // 25.1 >= 24.8, so should use 24.8 variant
      expect(sql).toContain('peak_threads_usage')
    })

    it('should fallback to oldest variant when version is null', () => {
      const sql = selectVersionedSql(runningQueriesConfig.sql, null)

      // Should use oldest (23.8) variant as fallback
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

    it('v24.8 query should be valid SQL structure', () => {
      const version = parseVersion('24.8.0.0')
      const sql = selectVersionedSql(runningQueriesConfig.sql, version)

      expect(sql).toContain('SELECT')
      expect(sql).toContain('FROM system.processes')
      expect(sql).toContain('WHERE is_cancelled = 0')
      expect(sql).toContain('ORDER BY elapsed')
    })

    it('both variants should have same base columns', () => {
      const v23 = selectVersionedSql(
        runningQueriesConfig.sql,
        parseVersion('23.8.0.0')
      )
      const v24 = selectVersionedSql(
        runningQueriesConfig.sql,
        parseVersion('24.8.0.0')
      )

      // Common columns
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
    const version = parseVersion('24.8.1.12345')
    const sql = selectVersionedSql(runningQueriesConfig.sql, version)

    // Should match 24.8 variant
    expect(sql).toContain('peak_threads_usage')
  })

  it('should handle exact boundary version', () => {
    // Exactly 24.8.0.0 should match 24.8 variant
    const version = parseVersion('24.8.0.0')
    const sql = selectVersionedSql(runningQueriesConfig.sql, version)

    expect(sql).toContain('peak_threads_usage')
  })

  it('should handle version just below boundary', () => {
    // 24.7.99.99 should NOT match 24.8 variant
    const version = parseVersion('24.7.99.99')
    const sql = selectVersionedSql(runningQueriesConfig.sql, version)

    expect(sql).not.toContain('peak_threads_usage')
  })

  it('should handle very old version', () => {
    const version = parseVersion('22.0.0.0')
    const sql = selectVersionedSql(runningQueriesConfig.sql, version)

    // Should fallback to oldest variant
    expect(sql).not.toContain('peak_threads_usage')
  })

  it('should handle very new version', () => {
    const version = parseVersion('30.0.0.0')
    const sql = selectVersionedSql(runningQueriesConfig.sql, version)

    // Should use newest available variant
    expect(sql).toContain('peak_threads_usage')
  })
})

describe('getSqlForDisplay vs selectVersionedSql', () => {
  // This test documents the difference between display and execution
  it('getSqlForDisplay returns newest, selectVersionedSql uses version', () => {
    const { getSqlForDisplay } = require('@/types/query-config')

    const displaySql = getSqlForDisplay(runningQueriesConfig.sql)
    const executionSql = selectVersionedSql(
      runningQueriesConfig.sql,
      parseVersion('23.8.0.0')
    )

    // Display shows newest (24.8) variant
    expect(displaySql).toContain('peak_threads_usage')

    // Execution for v23.8 uses older variant
    expect(executionSql).not.toContain('peak_threads_usage')
  })
})
