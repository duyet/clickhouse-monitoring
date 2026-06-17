/**
 * Snapshot tests for the anomaly/ domain declarative catalog (Plan 02h).
 *
 * For each migrated config, assert that loadDeclarativeConfig(declarativeObj)
 * deep-equals the legacy TS config on its serializable fields.
 *
 * Runtime-only fields excluded from comparison:
 *   rowClassName  — function (row) => string | undefined
 *   expandable    — function-based ExpandableConfig
 *   columnIcons   — React component refs
 *   permission    — FeaturePermission
 *   filterSchema  — contains Icon refs and dynamic option fns
 *   clickhouseSettings — execution-time settings
 *
 * All 7 configs in anomaly/ are eligible (no runtime-only fields).
 */

import { loadDeclarativeConfig } from '../../loader'
import {
  anomalySummaryDeclarative,
  diskUsageChangeDeclarative,
  errorRateBaselineDeclarative,
  memoryUsageBaselineDeclarative,
  mergePerformanceBaselineDeclarative,
  queryCountBaselineDeclarative,
  replicationLagBaselineDeclarative,
} from './anomaly-queries'
import { describe, expect, test } from 'bun:test'
import {
  anomalySummaryConfig,
  diskUsageChangeConfig,
  errorRateBaselineConfig,
  memoryUsageBaselineConfig,
  mergePerformanceBaselineConfig,
  queryCountBaselineConfig,
  replicationLagBaselineConfig,
} from '@/lib/query-config/anomaly/anomaly-queries'

// ---------------------------------------------------------------------------
// Helper: compare serializable fields between loaded declarative config and
// legacy TS config. Skips keys absent from the declarative schema.
// ---------------------------------------------------------------------------

const RUNTIME_ONLY_KEYS = new Set([
  'rowClassName',
  'expandable',
  'columnIcons',
  'permission',
  'filterSchema',
  'columnFilters',
  'clickhouseSettings',
  'variants',
])

function compareSerializable(
  loaded: ReturnType<typeof loadDeclarativeConfig>,
  legacy: ReturnType<typeof loadDeclarativeConfig>
): void {
  const legacyRec = legacy as unknown as Record<string, unknown>
  const loadedRec = loaded as unknown as Record<string, unknown>

  for (const key of Object.keys(legacyRec)) {
    if (RUNTIME_ONLY_KEYS.has(key)) continue
    expect(loadedRec[key]).toEqual(legacyRec[key])
  }
}

// ---------------------------------------------------------------------------
// query-count-baseline
// ---------------------------------------------------------------------------

describe('query-count-baseline declarative', () => {
  test('loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(queryCountBaselineDeclarative)
    ).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(queryCountBaselineDeclarative)
    compareSerializable(loaded, queryCountBaselineConfig)
  })
})

// ---------------------------------------------------------------------------
// memory-usage-baseline
// ---------------------------------------------------------------------------

describe('memory-usage-baseline declarative', () => {
  test('loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(memoryUsageBaselineDeclarative)
    ).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(memoryUsageBaselineDeclarative)
    compareSerializable(loaded, memoryUsageBaselineConfig)
  })

  test('versioned sql array length matches', () => {
    const loaded = loadDeclarativeConfig(memoryUsageBaselineDeclarative)
    const legacySql = memoryUsageBaselineConfig.sql
    expect(Array.isArray(loaded.sql)).toBe(Array.isArray(legacySql))
    if (Array.isArray(loaded.sql) && Array.isArray(legacySql)) {
      expect(loaded.sql.length).toBe(legacySql.length)
    }
  })
})

// ---------------------------------------------------------------------------
// merge-performance-baseline
// ---------------------------------------------------------------------------

describe('merge-performance-baseline declarative', () => {
  test('loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(mergePerformanceBaselineDeclarative)
    ).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(mergePerformanceBaselineDeclarative)
    compareSerializable(loaded, mergePerformanceBaselineConfig)
  })
})

// ---------------------------------------------------------------------------
// replication-lag-baseline
// ---------------------------------------------------------------------------

describe('replication-lag-baseline declarative', () => {
  test('loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(replicationLagBaselineDeclarative)
    ).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(replicationLagBaselineDeclarative)
    compareSerializable(loaded, replicationLagBaselineConfig)
  })
})

// ---------------------------------------------------------------------------
// error-rate-baseline
// ---------------------------------------------------------------------------

describe('error-rate-baseline declarative', () => {
  test('loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(errorRateBaselineDeclarative)
    ).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(errorRateBaselineDeclarative)
    compareSerializable(loaded, errorRateBaselineConfig)
  })
})

// ---------------------------------------------------------------------------
// disk-usage-change
// ---------------------------------------------------------------------------

describe('disk-usage-change declarative', () => {
  test('loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(diskUsageChangeDeclarative)
    ).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(diskUsageChangeDeclarative)
    compareSerializable(loaded, diskUsageChangeConfig)
  })
})

// ---------------------------------------------------------------------------
// anomaly-summary
// ---------------------------------------------------------------------------

describe('anomaly-summary declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(anomalySummaryDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(anomalySummaryDeclarative)
    compareSerializable(loaded, anomalySummaryConfig)
  })
})
