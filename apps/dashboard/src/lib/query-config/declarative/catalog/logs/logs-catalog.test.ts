/**
 * Snapshot tests for the logs/ domain declarative catalog (Plan 02h).
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
 * Skipped configs (runtime-only fields that the schema cannot express):
 *   stackTracesConfig — clickhouseSettings (allow_introspection_functions)
 */

import { loadDeclarativeConfig } from '../../loader'
import { crashLogDeclarative } from './crashes'
import { textLogDeclarative } from './text-log'
import { describe, expect, test } from 'bun:test'
import { crashLogConfig } from '@/lib/query-config/logs/crashes'
import { textLogConfig } from '@/lib/query-config/logs/text-log'

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
// crashes
// ---------------------------------------------------------------------------

describe('crash-log declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(crashLogDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(crashLogDeclarative)
    compareSerializable(loaded, crashLogConfig)
  })
})

// ---------------------------------------------------------------------------
// text-log
// ---------------------------------------------------------------------------

describe('text-log declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(textLogDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(textLogDeclarative)
    compareSerializable(loaded, textLogConfig)
  })

  test('filterParamPresets length matches legacy', () => {
    const loaded = loadDeclarativeConfig(textLogDeclarative)
    expect(loaded.filterParamPresets?.length).toBe(
      textLogConfig.filterParamPresets?.length
    )
  })
})
