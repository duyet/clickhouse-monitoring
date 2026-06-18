/**
 * Snapshot tests for the merges/ domain declarative catalog (Plan 02h).
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
 * mutations migrates its rowClassName via the declarative `rowStyle` rules;
 * rowClassName is excluded from the deep-equal (it's a function) but is verified
 * separately by applying both functions to boundary rows.
 */

import { loadDeclarativeConfig } from '../../loader'
import { mergePerformanceDeclarative } from './merge-performance'
import { mergesDeclarative } from './merges'
import { mutationsDeclarative } from './mutations'
import { describe, expect, test } from 'bun:test'
import { mergePerformanceConfig } from '@/lib/query-config/merges/merge-performance'
import { mergesConfig } from '@/lib/query-config/merges/merges'
import { mutationsConfig } from '@/lib/query-config/merges/mutations'

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
// merges
// ---------------------------------------------------------------------------

describe('merges declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(mergesDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(mergesDeclarative)
    compareSerializable(loaded, mergesConfig)
  })

  test('refreshInterval matches legacy', () => {
    const loaded = loadDeclarativeConfig(mergesDeclarative)
    expect(loaded.refreshInterval).toBe(mergesConfig.refreshInterval)
  })
})

// ---------------------------------------------------------------------------
// merge-performance (docs now a plain string via schema-ext)
// ---------------------------------------------------------------------------

describe('merge-performance declarative', () => {
  test('loads without error', () => {
    expect(() =>
      loadDeclarativeConfig(mergePerformanceDeclarative)
    ).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(mergePerformanceDeclarative)
    compareSerializable(loaded, mergePerformanceConfig)
  })

  test('docs (inlined PART_LOG) matches legacy', () => {
    const loaded = loadDeclarativeConfig(mergePerformanceDeclarative)
    expect(loaded.docs).toBe(mergePerformanceConfig.docs)
  })
})

// ---------------------------------------------------------------------------
// mutations — rowClassName (is_stuck red; !is_done & elapsed>300 amber)
// migrated to declarative rowStyle (compound `all` condition).
// ---------------------------------------------------------------------------

describe('mutations declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(mutationsDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(mutationsDeclarative)
    compareSerializable(loaded, mutationsConfig)
  })

  test('compiled rowClassName matches legacy across boundary rows', () => {
    const loaded = loadDeclarativeConfig(mutationsDeclarative)
    const compiled = loaded.rowClassName
    const legacy = mutationsConfig.rowClassName
    expect(typeof compiled).toBe('function')
    expect(typeof legacy).toBe('function')
    if (!compiled || !legacy) return

    // Cover the full truth table: is_stuck (red, highest priority),
    // !is_done & elapsed boundaries (amber at >300), and the no-match default.
    const rows: Record<string, unknown>[] = [
      { is_stuck: 1, is_done: 0, elapsed: 0 }, // red wins over amber
      { is_stuck: 1, is_done: 1, elapsed: 999 }, // red
      { is_stuck: 0, is_done: 0, elapsed: 301 }, // amber (just over)
      { is_stuck: 0, is_done: 0, elapsed: 300 }, // not strict-gt → default
      { is_stuck: 0, is_done: 0, elapsed: 500 }, // amber
      { is_stuck: 0, is_done: 1, elapsed: 999 }, // done → default
      { is_stuck: 0, is_done: 0, elapsed: 0 }, // default
      {}, // missing keys → default
    ]
    for (const row of rows) {
      expect(compiled(row)).toBe(legacy(row))
    }
  })
})
