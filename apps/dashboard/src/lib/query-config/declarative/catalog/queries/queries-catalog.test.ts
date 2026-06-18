/**
 * Snapshot tests for the queries/ domain declarative catalog (Plan 02i).
 *
 * For each migrated config, assert that loadDeclarativeConfig(declarativeObj)
 * deep-equals the legacy TS config on its serializable fields.
 *
 * Runtime-only fields excluded from comparison:
 *   rowClassName  — function (row) => string | undefined
 *   expandable    — function-based ExpandableConfig
 *   columnIcons   — React component refs
 *   filterSchema  — contains Icon refs and dynamic option fns
 *   columnFilters — UI sugar over filterSchema
 *   clickhouseSettings — ClickHouseSettings (execution-time; not serializable)
 *
 * permission (FeaturePermission as plain data) is now serializable and IS
 * compared (e.g. query-detail).
 *
 * Skipped configs (runtime-only fields the schema cannot express):
 *   expensive-queries          — rowClassName, expandable (JSX), columnIcons
 *   expensive-queries-by-memory — expandable (JSX), columnIcons
 *   failed-queries             — expandable (JSX), columnIcons
 *   slow-queries               — rowClassName, expandable (JSX), columnIcons
 *   history-queries            — rowClassName, expandable, filterSchema (icons + runtime env), clickhouseSettings
 *   running-queries            — rowClassName, expandable (JSX), filterSchema (icons), columnFilters
 */

import { loadDeclarativeConfig } from '../../loader'
// Declarative catalog objects
import { commonErrorsDeclarative } from './common-errors'
import { parallelizationDeclarative } from './parallelization'
import { profilerDeclarative } from './profiler'
import { queryCacheDeclarative } from './query-cache'
import { queryDetailDeclarative } from './query-detail'
import { queryViewsLogDeclarative } from './query-views-log'
import { threadAnalysisDeclarative } from './thread-analysis'
import { describe, expect, test } from 'bun:test'
// Legacy TS configs
import { commonErrorsConfig } from '@/lib/query-config/queries/common-errors'
import { parallelizationConfig } from '@/lib/query-config/queries/parallelization'
import { profilerConfig } from '@/lib/query-config/queries/profiler'
import { queryCacheConfig } from '@/lib/query-config/queries/query-cache'
import { queryDetailConfig } from '@/lib/query-config/queries/query-detail'
import { queryViewsLogConfig } from '@/lib/query-config/queries/query-views-log'
import { threadAnalysisConfig } from '@/lib/query-config/queries/thread-analysis'

// ---------------------------------------------------------------------------
// Helper: compare serializable fields between loaded declarative config and
// legacy TS config. Skips keys absent from the declarative schema.
// ---------------------------------------------------------------------------

const RUNTIME_ONLY_KEYS = new Set([
  'rowClassName',
  'expandable',
  'columnIcons',
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
// common-errors
// ---------------------------------------------------------------------------

describe('common-errors declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(commonErrorsDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(commonErrorsDeclarative)
    compareSerializable(loaded, commonErrorsConfig)
  })
})

// ---------------------------------------------------------------------------
// parallelization
// ---------------------------------------------------------------------------

describe('parallelization declarative', () => {
  test('loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(parallelizationDeclarative)
    ).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(parallelizationDeclarative)
    compareSerializable(loaded, parallelizationConfig)
  })
})

// ---------------------------------------------------------------------------
// profiler
// ---------------------------------------------------------------------------

describe('profiler declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(profilerDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(profilerDeclarative)
    compareSerializable(loaded, profilerConfig)
  })
})

// ---------------------------------------------------------------------------
// query-views-log
// ---------------------------------------------------------------------------

describe('query-views-log declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(queryViewsLogDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(queryViewsLogDeclarative)
    compareSerializable(loaded, queryViewsLogConfig)
  })

  test('versioned sql array length matches', () => {
    const loaded = loadDeclarativeConfig(queryViewsLogDeclarative)
    const legacySql = queryViewsLogConfig.sql
    expect(Array.isArray(loaded.sql)).toBe(Array.isArray(legacySql))
    if (Array.isArray(loaded.sql) && Array.isArray(legacySql)) {
      expect(loaded.sql.length).toBe(legacySql.length)
    }
  })
})

// ---------------------------------------------------------------------------
// query-cache (docs now a plain string via schema-ext)
// ---------------------------------------------------------------------------

describe('query-cache declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(queryCacheDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(queryCacheDeclarative)
    compareSerializable(loaded, queryCacheConfig)
  })

  test('docs (inlined QUERY_CACHE) matches legacy', () => {
    const loaded = loadDeclarativeConfig(queryCacheDeclarative)
    expect(loaded.docs).toBe(queryCacheConfig.docs)
  })
})

// ---------------------------------------------------------------------------
// query-detail (permission + versioned SQL with inlined baseSelect)
// ---------------------------------------------------------------------------

describe('query-detail declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(queryDetailDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(queryDetailDeclarative)
    compareSerializable(loaded, queryDetailConfig)
  })

  test('permission matches legacy', () => {
    const loaded = loadDeclarativeConfig(queryDetailDeclarative)
    expect(loaded.permission).toEqual(queryDetailConfig.permission)
  })

  test('versioned sql (inlined baseSelect) byte-matches legacy', () => {
    const loaded = loadDeclarativeConfig(queryDetailDeclarative)
    expect(loaded.sql).toEqual(queryDetailConfig.sql)
  })
})

// ---------------------------------------------------------------------------
// thread-analysis
// ---------------------------------------------------------------------------

describe('thread-analysis declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(threadAnalysisDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(threadAnalysisDeclarative)
    compareSerializable(loaded, threadAnalysisConfig)
  })
})
