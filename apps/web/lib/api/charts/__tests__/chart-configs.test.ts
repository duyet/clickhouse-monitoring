/**
 * Structural validation tests for chart query configs.
 *
 * These tests validate every chart builder function across all domain modules
 * for required fields, unique names, valid SQL, and structural consistency.
 */

import {
  chartRegistry,
  getAvailableCharts,
  getChartQuery,
  hasChart,
} from '../../chart-registry'
import { connectionCharts } from '../connection-charts'
import { dashboardCharts } from '../dashboard-charts'
import { dictionaryCharts } from '../dictionary-charts'
import { insightCharts } from '../insight-charts'
import { logsCharts } from '../logs-charts'
import { mergeCharts } from '../merge-charts'
import { overviewCharts } from '../overview-charts'
import { pageViewCharts } from '../page-view-charts'
import { queryCharts } from '../query-charts'
import { queryPerfCharts } from '../query-perf-charts'
import { replicationCharts } from '../replication-charts'
import { securityCharts } from '../security-charts'
import { systemCharts } from '../system-charts'
import { threadCharts } from '../thread-charts'
import { zookeeperCharts } from '../zookeeper-charts'
import { describe, expect, it } from 'bun:test'

/**
 * All domain chart modules and their human-readable names for test output.
 */
const chartModules: Array<{
  name: string
  charts: Record<string, (...args: unknown[]) => unknown>
}> = [
  { name: 'queryCharts', charts: queryCharts },
  { name: 'mergeCharts', charts: mergeCharts },
  { name: 'systemCharts', charts: systemCharts },
  { name: 'connectionCharts', charts: connectionCharts },
  { name: 'replicationCharts', charts: replicationCharts },
  { name: 'zookeeperCharts', charts: zookeeperCharts },
  { name: 'pageViewCharts', charts: pageViewCharts },
  { name: 'overviewCharts', charts: overviewCharts },
  { name: 'dashboardCharts', charts: dashboardCharts },
  { name: 'securityCharts', charts: securityCharts },
  { name: 'threadCharts', charts: threadCharts },
  { name: 'logsCharts', charts: logsCharts },
  { name: 'dictionaryCharts', charts: dictionaryCharts },
  { name: 'queryPerfCharts', charts: queryPerfCharts },
  { name: 'insightCharts', charts: insightCharts },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Invoke a chart builder with default-ish params. */
function invokeBuilder(builder: (...args: unknown[]) => unknown) {
  return builder({
    interval: 'toStartOfHour',
    lastHours: 24,
    params: {},
  })
}

type ChartResult = {
  query?: string
  queries?: Array<{ key: string; query: string }>
  sql?: Array<{ since: string; sql: string }>
  optional?: boolean
  tableCheck?: string | string[]
  variants?: Array<{ versions: unknown; query: string; description?: string }>
}

function isChartResult(v: unknown): v is ChartResult {
  return typeof v === 'object' && v !== null
}

/** Count open '(' and close ')' in a string; return whether balanced. */
function areParensBalanced(s: string): boolean {
  let depth = 0
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (depth < 0) return false
  }
  return depth === 0
}

// ---------------------------------------------------------------------------
// 1. Each domain module is a non-empty object
// ---------------------------------------------------------------------------

describe('chart domain modules', () => {
  for (const { name, charts } of chartModules) {
    it(`${name}: exports a non-empty charts object`, () => {
      expect(typeof charts).toBe('object')
      expect(charts).not.toBeNull()
      const keys = Object.keys(charts)
      expect(keys.length).toBeGreaterThan(0)
    })
  }
})

// ---------------------------------------------------------------------------
// 2. Every chart name across ALL modules is unique (no duplicates)
// ---------------------------------------------------------------------------

describe('chart name uniqueness', () => {
  it('has no duplicate chart names across all modules', () => {
    const seen = new Map<string, string>() // name -> module
    for (const { name, charts } of chartModules) {
      for (const chartName of Object.keys(charts)) {
        if (seen.has(chartName)) {
          expect(
            false,
            `Duplicate chart name "${chartName}" found in both "${seen.get(chartName)}" and "${name}"`
          ).toBe(true)
        }
        seen.set(chartName, name)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 3. Every builder returns a valid result with required fields
// ---------------------------------------------------------------------------

describe('chart builder output validation', () => {
  for (const { name, charts } of chartModules) {
    describe(name, () => {
      for (const chartName of Object.keys(charts)) {
        it(`${chartName}: returns valid result with query or queries`, () => {
          const builder = charts[chartName]
          expect(typeof builder).toBe('function')

          const result = invokeBuilder(builder)
          expect(isChartResult(result)).toBe(true)

          if (isChartResult(result)) {
            // Must have either `query` (single) or `queries` (multi)
            const hasQuery =
              result.query !== undefined && typeof result.query === 'string'
            const hasQueries =
              result.queries !== undefined && Array.isArray(result.queries)
            expect(
              hasQuery || hasQueries,
              `Chart "${chartName}" must have either "query" (string) or "queries" (array)`
            ).toBe(true)

            // Single-query charts must have non-empty query
            if (hasQuery) {
              expect(
                result.query!.trim().length,
                `Chart "${chartName}" has empty query string`
              ).toBeGreaterThan(0)
            }

            // Multi-query charts must have at least one query with a key
            if (hasQueries) {
              expect(
                result.queries!.length,
                `Chart "${chartName}" has empty queries array`
              ).toBeGreaterThan(0)
              for (const q of result.queries!) {
                expect(typeof q.key).toBe('string')
                expect(q.key.length).toBeGreaterThan(0)
                expect(typeof q.query).toBe('string')
                expect(
                  q.query.trim().length,
                  `Multi-query key "${q.key}" in "${chartName}" has empty query`
                ).toBeGreaterThan(0)
              }
            }
          }
        })
      }
    })
  }
})

// ---------------------------------------------------------------------------
// 4. SQL strings have no trailing semicolons and balanced parentheses
// ---------------------------------------------------------------------------

describe('SQL string quality', () => {
  for (const { name, charts } of chartModules) {
    describe(name, () => {
      for (const chartName of Object.keys(charts)) {
        it(`${chartName}: SQL has balanced parentheses and no trailing semicolons`, () => {
          const result = invokeBuilder(charts[chartName]) as ChartResult
          if (!isChartResult(result)) return

          const sqlStrings: string[] = []

          if (result.query) sqlStrings.push(result.query)
          if (result.queries) {
            for (const q of result.queries) sqlStrings.push(q.query)
          }
          // Variants
          if (result.variants) {
            for (const v of result.variants) sqlStrings.push(v.query)
          }
          // VersionedSql
          if (result.sql) {
            for (const entry of result.sql) sqlStrings.push(entry.sql)
          }

          for (const sql of sqlStrings) {
            // No trailing semicolons (ClickHouse client handles termination)
            expect(
              sql.trimEnd().endsWith(';'),
              `Chart "${chartName}" SQL ends with semicolon: ...${sql.trimEnd().slice(-20)}`
            ).toBe(false)

            // Balanced parentheses
            expect(
              areParensBalanced(sql),
              `Chart "${chartName}" has unbalanced parentheses`
            ).toBe(true)
          }
        })
      }
    })
  }
})

// ---------------------------------------------------------------------------
// 5. VersionedSql entries sorted by 'since' (when present)
// ---------------------------------------------------------------------------

describe('VersionedSql ordering', () => {
  for (const { name, charts } of chartModules) {
    describe(name, () => {
      for (const chartName of Object.keys(charts)) {
        it(`${chartName}: VersionedSql entries sorted by 'since' version`, () => {
          const result = invokeBuilder(charts[chartName]) as ChartResult
          if (!isChartResult(result) || !result.sql) return

          // Skip empty arrays
          if (result.sql.length <= 1) return

          const versions = result.sql.map((e) => e.since)
          const sorted = [...versions].sort((a, b) => a.localeCompare(b))
          expect(
            versions,
            `Chart "${chartName}" VersionedSql not sorted: got ${versions.join(', ')} expected ${sorted.join(', ')}`
          ).toEqual(sorted)
        })
      }
    })
  }
})

// ---------------------------------------------------------------------------
// 6. Variant entries have required fields (when present)
// ---------------------------------------------------------------------------

describe('Query variants validation', () => {
  for (const { name, charts } of chartModules) {
    describe(name, () => {
      for (const chartName of Object.keys(charts)) {
        it(`${chartName}: variants have required fields`, () => {
          const result = invokeBuilder(charts[chartName]) as ChartResult
          if (!isChartResult(result) || !result.variants) return

          for (const variant of result.variants) {
            expect(variant.versions).toBeDefined()
            expect(typeof variant.query).toBe('string')
            expect(
              variant.query.trim().length,
              `Variant in "${chartName}" has empty query`
            ).toBeGreaterThan(0)
          }
        })
      }
    })
  }
})

// ---------------------------------------------------------------------------
// 7. Optional charts with tableCheck have valid values
// ---------------------------------------------------------------------------

describe('optional/tableCheck consistency', () => {
  for (const { name, charts } of chartModules) {
    describe(name, () => {
      for (const chartName of Object.keys(charts)) {
        it(`${chartName}: optional=true implies tableCheck is reasonable`, () => {
          const result = invokeBuilder(charts[chartName]) as ChartResult
          if (!isChartResult(result) || !result.optional) return

          // If optional is true, tableCheck should either be present or the
          // query should contain system table references that can be auto-detected.
          // We only check that tableCheck (when present) is valid.
          if (result.tableCheck) {
            const checks = Array.isArray(result.tableCheck)
              ? result.tableCheck
              : [result.tableCheck]
            for (const check of checks) {
              expect(typeof check).toBe('string')
              expect(
                check.length,
                `tableCheck in "${chartName}" is empty`
              ).toBeGreaterThan(0)
            }
          }
        })
      }
    })
  }
})

// ---------------------------------------------------------------------------
// 8. Chart registry completeness
// ---------------------------------------------------------------------------

describe('chart registry', () => {
  it('contains all charts from all domain modules', () => {
    const allExpectedNames: string[] = []
    for (const { charts } of chartModules) {
      allExpectedNames.push(...Object.keys(charts))
    }

    const registryNames = Object.keys(chartRegistry)
    for (const name of allExpectedNames) {
      expect(
        registryNames,
        `Chart "${name}" from domain module is missing from registry`
      ).toContain(name)
    }

    // Registry should not have extra keys beyond the domain modules
    expect(registryNames.length).toBe(allExpectedNames.length)
  })

  it('getAvailableCharts returns all chart names', () => {
    const available = getAvailableCharts()
    const registryKeys = Object.keys(chartRegistry)
    expect(available.sort()).toEqual(registryKeys.sort())
  })

  it('hasChart returns true for known charts, false for unknown', () => {
    expect(hasChart('memory-usage')).toBe(true)
    expect(hasChart('query-count')).toBe(true)
    expect(hasChart('nonexistent-chart')).toBe(false)
    expect(hasChart('')).toBe(false)
  })

  it('getChartQuery returns result for known charts', () => {
    const result = getChartQuery('memory-usage', { lastHours: 24 })
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('query')

    // Multi-query chart
    const multiResult = getChartQuery('summary-used-by-running-queries')
    expect(multiResult).not.toBeNull()
    expect(multiResult).toHaveProperty('queries')
  })

  it('getChartQuery returns null for unknown charts', () => {
    expect(getChartQuery('nonexistent-chart')).toBeNull()
  })
})
