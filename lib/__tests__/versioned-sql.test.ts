/**
 * Versioned SQL Selection Tests
 *
 * These tests ensure that version-aware query selection works correctly
 * for query configs with multiple SQL variants based on ClickHouse version.
 */

import { describe, expect, it } from 'bun:test'
import { parseVersion, selectVersionedSql } from '@/lib/clickhouse-version'
import { queries } from '@/lib/query-config'
import { queryViewsLogConfig } from '@/lib/query-config/queries/query-views-log'
import { runningQueriesConfig } from '@/lib/query-config/queries/running-queries'
import { ColumnFormat } from '@/types/column-format'

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
      expect(sql).not.toContain('normalized_query_hash')
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

    it('both versions should have same base projection columns', () => {
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
        'query_id,',
        'query,',
        'query_kind,',
        'user,',
        'current_database,',
        'initial_query_id,',
        'address,',
        'port,',
        'interface,',
        'client_name,',
        'client_hostname,',
        'distributed_depth,',
        'elapsed,',
        'read_rows,',
        'read_bytes,',
        'total_rows_approx,',
        'written_rows,',
        'written_bytes,',
        'memory_usage,',
        'peak_memory_usage,',
        'readable_elapsed',
        'readable_read_rows',
        'readable_written_rows',
        'readable_memory_usage',
        'progress',
        'launched_merges',
        'query_id AS action',
        'readable_read_bytes',
        'readable_written_bytes',
        'thread_count',
        'interface_label',
      ]

      for (const col of commonColumns) {
        expect(v23).toContain(col)
        expect(v24).toContain(col)
      }
    })

    it('should avoid SELECT star for the frequently refreshed table', () => {
      const sql = selectVersionedSql(
        runningQueriesConfig.sql,
        parseVersion('24.1.0.0')
      )

      expect(sql).not.toContain('SELECT *')
      expect(sql).not.toContain('SELECT *,')
    })

    it('should configure the compact running-query summary table shape', () => {
      const sql = selectVersionedSql(
        runningQueriesConfig.sql,
        parseVersion('24.1.0.0')
      )

      expect(sql).toContain('ORDER BY elapsed DESC')
      expect(runningQueriesConfig.columns).toEqual(['action', 'query'])
      expect(runningQueriesConfig.columnFormats?.query).toBe(
        ColumnFormat.RunningQuerySummary
      )
      expect(runningQueriesConfig.columnFormats?.action).toBeTruthy()
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

describe('Query Views Log Version Selection', () => {
  it('uses placeholder peak memory fields before ClickHouse 23.2', () => {
    const sql = selectVersionedSql(
      queryViewsLogConfig.sql,
      parseVersion('22.8.0.0')
    )

    expect(sql).not.toContain('formatReadableSize(peak_memory_usage)')
    expect(sql).toContain("'-' AS readable_peak_memory_usage")
    expect(sql).toContain('NULL AS pct_peak_memory_usage')
  })

  it('uses peak memory at the ClickHouse 23.2 boundary', () => {
    const sql = selectVersionedSql(
      queryViewsLogConfig.sql,
      parseVersion('23.2.0.0')
    )

    expect(sql).toContain('peak_memory_usage')
    expect(sql).toContain('readable_peak_memory_usage')
  })

  it('uses the documented peak memory column for modern ClickHouse versions', () => {
    const sql = selectVersionedSql(
      queryViewsLogConfig.sql,
      parseVersion('24.1.0.0')
    )

    expect(sql).toContain('peak_memory_usage')
    expect(sql).not.toContain('formatReadableSize(memory_usage)')
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
  it('getSqlForDisplay and selectVersionedSql return same running queries SQL', () => {
    const { getSqlForDisplay } = require('@/types/query-config')

    const displaySql = getSqlForDisplay(runningQueriesConfig.sql)
    const executionSql = selectVersionedSql(
      runningQueriesConfig.sql,
      parseVersion('25.3.0.0')
    )

    expect(displaySql).not.toContain('peak_threads_usage')
    expect(executionSql).not.toContain('peak_threads_usage')
    expect(displaySql).not.toContain('normalized_query_hash')
    expect(displaySql).toBe(executionSql)
  })
})
