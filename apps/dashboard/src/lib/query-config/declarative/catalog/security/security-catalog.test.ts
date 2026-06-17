/**
 * Snapshot tests for the security/ domain declarative catalog (Plan 02h).
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
 * All 2 configs in security/ are eligible (no runtime-only fields).
 */

import { loadDeclarativeConfig } from '../../loader'
import { loginAttemptsDeclarative } from './login-attempts'
import { sessionsDeclarative } from './sessions'
import { describe, expect, test } from 'bun:test'
import { loginAttemptsConfig } from '@/lib/query-config/security/login-attempts'
import { sessionsConfig } from '@/lib/query-config/security/sessions'

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
// login-attempts
// ---------------------------------------------------------------------------

describe('login-attempts declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(loginAttemptsDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(loginAttemptsDeclarative)
    compareSerializable(loaded, loginAttemptsConfig)
  })

  test('filterParamPresets length matches legacy', () => {
    const loaded = loadDeclarativeConfig(loginAttemptsDeclarative)
    expect(loaded.filterParamPresets?.length).toBe(
      loginAttemptsConfig.filterParamPresets?.length
    )
  })
})

// ---------------------------------------------------------------------------
// sessions
// ---------------------------------------------------------------------------

describe('sessions declarative', () => {
  test('loads without error', () => {
    expect(() => loadDeclarativeConfig(sessionsDeclarative)).not.toThrow()
  })

  test('serializable fields match legacy', () => {
    const loaded = loadDeclarativeConfig(sessionsDeclarative)
    compareSerializable(loaded, sessionsConfig)
  })
})
