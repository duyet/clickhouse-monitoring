/**
 * Snapshot tests for the keeper/ domain declarative catalog (Plan 02g).
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
 *
 * Skipped configs (runtime-only fields that the schema cannot express):
 *   keeperConnectionsConfig — expandable (KeeperConnectionExpandedDetails JSX)
 */

import { loadDeclarativeConfig } from '../../loader'
// Declarative catalog objects
import { keeperConnectionLogDeclarative } from './keeper-connection-log'
import { keeperInfoDeclarative } from './keeper-info'
import { keeperLogDeclarative } from './keeper-log'
import { keeperOverviewDeclarative } from './keeper-overview'
import { keeperPresenceDeclarative } from './keeper-presence'
import { keeperWatchesDeclarative } from './keeper-watches'
import { describe, expect, test } from 'bun:test'
// Legacy TS configs
import { keeperConnectionLogConfig } from '@/lib/query-config/keeper/keeper-connection-log'
import { keeperInfoConfig } from '@/lib/query-config/keeper/keeper-info'
import { keeperLogConfig } from '@/lib/query-config/keeper/keeper-log'
import { keeperOverviewConfig } from '@/lib/query-config/keeper/keeper-overview'
import { keeperPresenceConfig } from '@/lib/query-config/keeper/keeper-presence'
import { keeperWatchesConfig } from '@/lib/query-config/keeper/keeper-watches'

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
// keeper-connection-log
// ---------------------------------------------------------------------------

describe('keeper-connection-log declarative', () => {
  test('loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(keeperConnectionLogDeclarative)
    ).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(keeperConnectionLogDeclarative)
    compareSerializable(loaded, keeperConnectionLogConfig)
  })

  test('versioned sql array length matches', () => {
    const loaded = loadDeclarativeConfig(keeperConnectionLogDeclarative)
    const legacySql = keeperConnectionLogConfig.sql
    expect(Array.isArray(loaded.sql)).toBe(Array.isArray(legacySql))
    if (Array.isArray(loaded.sql) && Array.isArray(legacySql)) {
      expect(loaded.sql.length).toBe(legacySql.length)
    }
  })
})

// ---------------------------------------------------------------------------
// keeper-info
// ---------------------------------------------------------------------------

describe('keeper-info declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(keeperInfoDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(keeperInfoDeclarative)
    compareSerializable(loaded, keeperInfoConfig)
  })

  test('versioned sql array length matches', () => {
    const loaded = loadDeclarativeConfig(keeperInfoDeclarative)
    const legacySql = keeperInfoConfig.sql
    expect(Array.isArray(loaded.sql)).toBe(Array.isArray(legacySql))
    if (Array.isArray(loaded.sql) && Array.isArray(legacySql)) {
      expect(loaded.sql.length).toBe(legacySql.length)
    }
  })
})

// ---------------------------------------------------------------------------
// keeper-log
// ---------------------------------------------------------------------------

describe('keeper-log declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(keeperLogDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(keeperLogDeclarative)
    compareSerializable(loaded, keeperLogConfig)
  })

  test('versioned sql array length matches', () => {
    const loaded = loadDeclarativeConfig(keeperLogDeclarative)
    const legacySql = keeperLogConfig.sql
    expect(Array.isArray(loaded.sql)).toBe(Array.isArray(legacySql))
    if (Array.isArray(loaded.sql) && Array.isArray(legacySql)) {
      expect(loaded.sql.length).toBe(legacySql.length)
    }
  })
})

// ---------------------------------------------------------------------------
// keeper-overview (spreads keeperInfoConfig + adds relatedCharts)
// ---------------------------------------------------------------------------

describe('keeper-overview declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(keeperOverviewDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(keeperOverviewDeclarative)
    compareSerializable(loaded, keeperOverviewConfig)
  })

  test('relatedCharts length matches legacy', () => {
    const loaded = loadDeclarativeConfig(keeperOverviewDeclarative)
    expect(loaded.relatedCharts?.length).toBe(
      keeperOverviewConfig.relatedCharts?.length
    )
  })
})

// ---------------------------------------------------------------------------
// keeper-presence
// ---------------------------------------------------------------------------

describe('keeper-presence declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(keeperPresenceDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(keeperPresenceDeclarative)
    compareSerializable(loaded, keeperPresenceConfig)
  })

  test('versioned sql array length matches', () => {
    const loaded = loadDeclarativeConfig(keeperPresenceDeclarative)
    const legacySql = keeperPresenceConfig.sql
    expect(Array.isArray(loaded.sql)).toBe(Array.isArray(legacySql))
    if (Array.isArray(loaded.sql) && Array.isArray(legacySql)) {
      expect(loaded.sql.length).toBe(legacySql.length)
    }
  })
})

// ---------------------------------------------------------------------------
// keeper-watches
// ---------------------------------------------------------------------------

describe('keeper-watches declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(keeperWatchesDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(keeperWatchesDeclarative)
    compareSerializable(loaded, keeperWatchesConfig)
  })
})
