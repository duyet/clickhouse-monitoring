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
 * Skipped configs (runtime-only fields or non-serializable values):
 *   mergePerformanceConfig — docs uses PART_LOG (non-URL string, fails url() validation)
 *   mutationsConfig        — rowClassName function
 */

import { loadDeclarativeConfig } from '../../loader'
import { mergesDeclarative } from './merges'
import { describe, expect, test } from 'bun:test'
import { mergesConfig } from '@/lib/query-config/merges/merges'

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
